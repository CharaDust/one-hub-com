package jeepay

import "strings"

// WayCode 计全支付方式，见 https://docs.jeequan.com/docs/jeepay/payment_api
type WayCode string

const (
	WayCodeQRCashier      WayCode = "QR_CASHIER"      // 聚合二维码/聚合扫码(用户扫商家，支持微信/支付宝/云闪付)
	WayCodeWebCashier     WayCode = "WEB_CASHIER"     // Web 统一收银台（PC/H5/微信/支付宝端自适应），见计全「线上支付说明」
	WayCodeChannelCashier WayCode = "CHANNEL_CASHIER" // 聚合收银台（部分环境使用，与 WEB_CASHIER 二选一以商户后台为准）
	WayCodeAliPC          WayCode = "ALI_PC"        // 支付宝PC网站
	WayCodeAliWAP     WayCode = "ALI_WAP"     // 支付宝WAP
	WayCodeAliQR      WayCode = "ALI_QR"      // 支付宝二维码
	WayCodeWxNative   WayCode = "WX_NATIVE"   // 微信扫码
	WayCodeWxH5       WayCode = "WX_H5"       // 微信H5
	WayCodeWxBar      WayCode = "WX_BAR"      // 微信条码
	WayCodeWxJsapi    WayCode = "WX_JSAPI"    // 微信公众号
)

const (
	UnifiedOrderPath = "/api/pay/unifiedOrder"
	SignTypeMD5      = "MD5"
	Version          = "1.0"
	// OrderStateSuccess 支付成功
	OrderStateSuccess = 2
)

// Client 计全 Jeepay 接口客户端配置（与表单 config 字段对应）
type Client struct {
	PayDomain   string  `json:"pay_domain"`   // 支付域名，如 https://pay.jeepay.vip
	MchNo       string  `json:"mch_no"`      // 商户号
	AppId       string  `json:"app_id"`      // 应用ID
	Key         string  `json:"key"`         // 密钥（API 私钥）
	WayCode     WayCode `json:"way_code"`    // 支付方式：QR_CASHIER / CHANNEL_CASHIER / ALI_PC / ...
	CashierMnt  string  `json:"cashier_mnt,omitempty"` // 收银台 mnt 参数，默认同商户号；若计全要求其它值请填写
}

// CashierMntValue 收银台 mnt：优先 cashier_mnt，否则商户号（Web/聚合收银台必填）
func (c *Client) CashierMntValue() string {
	if strings.TrimSpace(c.CashierMnt) != "" {
		return strings.TrimSpace(c.CashierMnt)
	}
	return c.MchNo
}
