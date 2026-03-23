package jeepay

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"one-api/common/logger"
	"sort"
	"strings"
	"time"
)

// Sign 计全签名：参数按 key 字典序排序，key=value&...&key=API密钥，MD5 后转大写
// 见 https://docs.jeequan.com/docs/jeepay_api/jeepay_api-1dabsb5sgav0l
func (c *Client) Sign(params map[string]interface{}) string {
	keys := make([]string, 0, len(params))
	for k, v := range params {
		if k == "sign" || v == nil || v == "" {
			continue
		}
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var buf strings.Builder
	for i, k := range keys {
		if i > 0 {
			buf.WriteString("&")
		}
		buf.WriteString(k)
		buf.WriteString("=")
		buf.WriteString(fmt.Sprint(params[k]))
	}
	buf.WriteString("&key=")
	buf.WriteString(c.Key)
	h := md5.Sum([]byte(buf.String()))
	return strings.ToUpper(hex.EncodeToString(h[:]))
}

// SignString 对 map[string]string 签名（回调验签用）。params 中 sign 不参与计算。
func (c *Client) SignString(params map[string]string) string {
	m := make(map[string]interface{}, len(params))
	for k, v := range params {
		if k == "sign" {
			continue
		}
		m[k] = v
	}
	return c.Sign(m)
}

// UnifiedOrderRequest 统一下单请求体
type UnifiedOrderRequest struct {
	MchNo       string `json:"mchNo"`
	AppId       string `json:"appId"`
	MchOrderNo  string `json:"mchOrderNo"`
	WayCode     string `json:"wayCode"`
	Amount      int64  `json:"amount"`      // 单位：分
	Currency    string `json:"currency"`    // cny
	Subject     string `json:"subject"`
	Body        string `json:"body"`
	NotifyUrl   string `json:"notifyUrl,omitempty"`
	ReturnUrl   string `json:"returnUrl,omitempty"`
	ReqTime     int64  `json:"reqTime"`     // 13 位时间戳
	Version     string `json:"version"`
	Sign        string `json:"sign"`
	SignType    string `json:"signType"`
	ChannelExtra string `json:"channelExtra,omitempty"` // 如 {"payDataType":"payUrl"} 用于 PC/WAP 获取跳转链接
}

// unifiedOrderResponseRaw 用于解析 data 可能是 object 或 string 的情况
type unifiedOrderResponseRaw struct {
	Code int             `json:"code"`
	Msg  string          `json:"msg"`
	Data json.RawMessage `json:"data"`
	Sign string          `json:"sign,omitempty"`
}

// UnifiedOrderData 统一下单 data
type UnifiedOrderData struct {
	PayOrderId   string `json:"payOrderId"`
	MchOrderNo   string `json:"mchOrderNo"`
	OrderState   int    `json:"orderState"`
	PayDataType  string `json:"payDataType"`  // payUrl / form / codeUrl / codeImgUrl
	PayData      string `json:"payData"`
	ErrCode      string `json:"errCode,omitempty"`
	ErrMsg       string `json:"errMsg,omitempty"`
}

// UnifiedOrder 调用计全统一下单接口，返回 data 或 error
func (c *Client) UnifiedOrder(req *UnifiedOrderRequest) (*UnifiedOrderData, error) {
	req.Version = Version
	req.SignType = SignTypeMD5
	req.ReqTime = time.Now().UnixMilli()

	params := map[string]interface{}{
		"mchNo":      req.MchNo,
		"appId":      req.AppId,
		"mchOrderNo": req.MchOrderNo,
		"wayCode":    req.WayCode,
		"amount":     req.Amount,
		"currency":   req.Currency,
		"subject":    req.Subject,
		"body":       req.Body,
		"reqTime":    req.ReqTime,
		"version":    req.Version,
		"signType":   req.SignType,
	}
	if req.NotifyUrl != "" {
		params["notifyUrl"] = req.NotifyUrl
	}
	if req.ReturnUrl != "" {
		params["returnUrl"] = req.ReturnUrl
	}
	if req.ChannelExtra != "" {
		params["channelExtra"] = req.ChannelExtra
	}
	req.Sign = c.Sign(params)

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	baseURL := strings.TrimSuffix(c.PayDomain, "/")
	url := baseURL + UnifiedOrderPath
	logger.SysLog(fmt.Sprintf("[jeepay unifiedOrder] request POST %s body=%s", url, string(body)))

	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		logger.SysError(fmt.Sprintf("[jeepay unifiedOrder] http do error: %v", err))
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.SysError(fmt.Sprintf("[jeepay unifiedOrder] read body error: %v", err))
		return nil, err
	}
	logger.SysLog(fmt.Sprintf("[jeepay unifiedOrder] response status=%d body=%s", resp.StatusCode, string(respBody)))

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jeepay unifiedOrder http %d: %s", resp.StatusCode, string(respBody))
	}

	var raw unifiedOrderResponseRaw
	if err := json.Unmarshal(respBody, &raw); err != nil {
		return nil, err
	}
	if raw.Code != 0 {
		return nil, fmt.Errorf("jeepay unifiedOrder code=%d msg=%s", raw.Code, raw.Msg)
	}
	if len(raw.Data) == 0 || string(raw.Data) == "null" {
		return nil, fmt.Errorf("jeepay unifiedOrder empty data")
	}
	var data UnifiedOrderData
	if raw.Data[0] == '"' {
		var dataStr string
		if err := json.Unmarshal(raw.Data, &dataStr); err != nil {
			return nil, fmt.Errorf("jeepay data string unmarshal: %w", err)
		}
		if err := json.Unmarshal([]byte(dataStr), &data); err != nil {
			return nil, fmt.Errorf("jeepay data json unmarshal: %w", err)
		}
	} else {
		if err := json.Unmarshal(raw.Data, &data); err != nil {
			return nil, err
		}
	}
	return &data, nil
}
