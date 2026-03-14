package jeepay

// WayCode 计全支付方式，见 https://docs.jeequan.com/docs/jeepay/payment_api
type WayCode string

const (
	WayCodeQRCashier  WayCode = "QR_CASHIER"  // 聚合二维码/聚合扫码(用户扫商家，支持微信/支付宝/云闪付)
	WayCodeAliPC      WayCode = "ALI_PC"      // 支付宝PC网站
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
	PayDomain string  `json:"pay_domain"` // 支付域名，如 https://pay.jeepay.vip
	MchNo     string  `json:"mch_no"`    // 商户号
	AppId     string  `json:"app_id"`     // 应用ID
	Key       string  `json:"key"`       // 密钥（API 私钥）
	WayCode   WayCode `json:"way_code"`   // 支付方式：ALI_PC / ALI_WAP / ALI_QR / WX_NATIVE / WX_H5 / QR_CASHIER
}
