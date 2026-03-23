package jeepay

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/model"
	"one-api/payment/types"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Jeepay struct{}

func (j *Jeepay) Name() string {
	return "计全支付"
}

func (j *Jeepay) Pay(cfg *types.PayConfig, gatewayConfig string) (*types.PayRequest, error) {
	client, err := getJeepayConfig(gatewayConfig)
	if err != nil {
		return nil, err
	}

	// 金额：计全单位是分，这里 Money 是元
	amountFen := int64(cfg.Money * 100)
	if amountFen < 1 {
		amountFen = 1
	}
	currency := "cny"
	if cfg.Currency == model.CurrencyTypeUSD {
		currency = "usd"
	}

	channelExtra := ""
	switch client.WayCode {
	case WayCodeWebCashier, WayCodeChannelCashier:
		// 计全 Web/聚合收银台在 channelExtra 中需传 mnt，否则收银台页提示「参数mnt必填」
		extra := map[string]string{
			"payDataType": "payUrl",
			"mnt":         client.CashierMntValue(),
		}
		b, err := json.Marshal(extra)
		if err != nil {
			return nil, err
		}
		channelExtra = string(b)
	case WayCodeAliPC, WayCodeAliWAP:
		channelExtra = `{"payDataType":"payUrl"}`
	case WayCodeAliQR, WayCodeWxNative, WayCodeQRCashier:
		// 二维码类可要 codeUrl 或 codeImgUrl
		channelExtra = `{"payDataType":"codeUrl"}`
	}

	req := &UnifiedOrderRequest{
		MchNo:       client.MchNo,
		AppId:       client.AppId,
		MchOrderNo:  cfg.TradeNo,
		WayCode:     string(client.WayCode),
		Amount:      amountFen,
		Currency:    currency,
		Subject:     config.SystemName + "-充值:" + cfg.TradeNo,
		Body:        "Token充值 " + strconv.FormatFloat(cfg.Money, 'f', 2, 64) + " " + strings.ToUpper(currency),
		NotifyUrl:   cfg.NotifyURL,
		ReturnUrl:   cfg.ReturnURL,
		ChannelExtra: channelExtra,
	}

	// 计全将向此地址 POST 支付结果，必须是公网可访问的 URL，否则收不到回调、订单不会完成
	logger.SysLog(fmt.Sprintf("jeepay unified order notify_url=%s (must be publicly reachable)", cfg.NotifyURL))

	data, err := client.UnifiedOrder(req)
	if err != nil {
		return nil, err
	}

	// payDataType: payUrl / form / codeUrl / codeImgUrl（计全可能返回小写如 payurl）
	payURL := strings.TrimSpace(data.PayData)
	if client.WayCode == WayCodeWebCashier || client.WayCode == WayCodeChannelCashier {
		payURL = appendCashierMntToPayURL(payURL, client.CashierMntValue())
	}
	dt := strings.ToLower(strings.TrimSpace(data.PayDataType))
	switch dt {
	case "payurl", "form":
		return &types.PayRequest{
			Type: 1,
			Data: types.PayRequestData{
				URL:    payURL,
				Method: http.MethodGet,
			},
		}, nil
	case "codeurl", "codeimgurl":
		return &types.PayRequest{
			Type: 2,
			Data: types.PayRequestData{
				URL:    payURL,
				Method: http.MethodGet,
			},
		}, nil
	default:
		return nil, fmt.Errorf("jeepay unsupported payDataType: %s", data.PayDataType)
	}
}

// appendCashierMntToPayURL 若收银台跳转 URL 缺少 mnt 查询参数则补上（与 channelExtra 中的 mnt 一致）
func appendCashierMntToPayURL(rawURL, mnt string) string {
	if rawURL == "" || mnt == "" {
		return rawURL
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	q := u.Query()
	if q.Get("mnt") == "" {
		q.Set("mnt", mnt)
		u.RawQuery = q.Encode()
	}
	return u.String()
}

func (j *Jeepay) HandleCallback(c *gin.Context, gatewayConfig string) (*types.PayNotify, error) {
	writeFail := func() { c.Header("Content-Type", "text/plain"); c.Writer.Write([]byte("fail")) }
	writeSuccess := func() { c.Header("Content-Type", "text/plain"); c.Writer.Write([]byte("success")) }

	client, err := getJeepayConfig(gatewayConfig)
	if err != nil {
		writeFail()
		return nil, err
	}

	params, err := parseNotifyParams(c)
	if err != nil {
		logger.SysError(fmt.Sprintf("jeepay notify parse error: %v", err))
		writeFail()
		return nil, err
	}
	logger.SysLog(fmt.Sprintf("jeepay notify received, mchOrderNo=%s, state=%s", params["mchOrderNo"], params["state"]))

	sign := params["sign"]
	if sign == "" {
		logger.SysError("jeepay callback: missing sign")
		writeFail()
		return nil, errors.New("jeepay callback: missing sign")
	}
	stateStr := params["state"]
	state, _ := strconv.Atoi(stateStr)
	if state != OrderStateSuccess {
		logger.SysError(fmt.Sprintf("jeepay callback: state=%d not success", state))
		writeFail()
		return nil, fmt.Errorf("jeepay callback: state=%d not success", state)
	}

	calculated := client.SignString(params)
	if calculated != sign {
		logger.SysError(fmt.Sprintf("jeepay callback: sign mismatch, calculated=%s, received=%s", calculated, sign))
		writeFail()
		return nil, errors.New("jeepay callback: sign mismatch")
	}

	mchOrderNo := params["mchOrderNo"]
	payOrderId := params["payOrderId"]
	if mchOrderNo == "" || payOrderId == "" {
		logger.SysError("jeepay callback: missing mchOrderNo or payOrderId")
		writeFail()
		return nil, errors.New("jeepay callback: missing mchOrderNo or payOrderId")
	}

	if c.Request.Method != "GET" {
		writeSuccess()
	}
	return &types.PayNotify{
		TradeNo:   mchOrderNo,
		GatewayNo: payOrderId,
	}, nil
}

// parseNotifyParams 解析计全支付通知参数，支持 application/x-www-form-urlencoded 与 application/json
func parseNotifyParams(c *gin.Context) (map[string]string, error) {
	params := make(map[string]string)
	ct := c.GetHeader("Content-Type")
	if strings.Contains(ct, "application/json") {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			return nil, err
		}
		var raw map[string]interface{}
		if err := json.Unmarshal(body, &raw); err != nil {
			return nil, err
		}
		for k, v := range raw {
			if v == nil {
				continue
			}
			switch val := v.(type) {
			case string:
				params[k] = val
			case float64:
				params[k] = strconv.FormatInt(int64(val), 10)
			case int:
				params[k] = strconv.Itoa(val)
			case int64:
				params[k] = strconv.FormatInt(val, 10)
			default:
				params[k] = fmt.Sprint(v)
			}
		}
		return params, nil
	}
	if err := c.Request.ParseForm(); err != nil {
		return nil, err
	}
	for k, v := range c.Request.PostForm {
		if len(v) > 0 {
			params[k] = v[0]
		}
	}
	return params, nil
}

func (j *Jeepay) CreatedPay(_ string, _ *model.Payment) error {
	return nil
}

func getJeepayConfig(gatewayConfig string) (*Client, error) {
	var client Client
	if err := json.Unmarshal([]byte(gatewayConfig), &client); err != nil {
		return nil, errors.New("jeepay config error")
	}
	client.PayDomain = strings.TrimSuffix(client.PayDomain, "/")
	if client.PayDomain == "" || client.MchNo == "" || client.AppId == "" || client.Key == "" {
		return nil, errors.New("jeepay config: pay_domain / mch_no / app_id / key required")
	}
	if client.WayCode == "" {
		client.WayCode = WayCodeAliPC
	}
	return &client, nil
}
