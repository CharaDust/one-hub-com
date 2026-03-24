const PaymentType = {
  epay: '易支付',
  jeepay: '计全支付',
  alipay: '支付宝',
  wxpay: '微信支付',
  stripe: 'Stripe',
};

const CurrencyType = {
  CNY: '人民币',
  USD: '积分'
};

const PaymentConfig = {
  epay: {
    pay_domain: {
      name: '支付域名',
      description: '支付域名',
      type: 'text',
      value: ''
    },
    partner_id: {
      name: '商户号',
      description: '商户号',
      type: 'text',
      value: ''
    },
    key: {
      name: '密钥',
      description: '密钥',
      type: 'text',
      value: ''
    },
    pay_type: {
      name: '支付类型',
      description: '支付类型,如果需要跳转到易支付收银台,请选择收银台',
      type: 'select',
      value: '',
      options: [
        {
          name: '收银台',
          value: ''
        },
        {
          name: '支付宝',
          value: 'alipay'
        },
        {
          name: '微信',
          value: 'wxpay'
        },
        {
          name: 'QQ',
          value: 'qqpay'
        },
        {
          name: '京东',
          value: 'jdpay'
        },
        {
          name: '银联',
          value: 'bank'
        },
        {
          name: 'Paypal',
          value: 'paypal'
        },
        {
          name: 'USDT',
          value: 'usdt'
        }
      ]
    }
  },
  jeepay: {
    pay_domain: {
      name: '支付域名',
      description: '计全支付网关地址，如 https://pay.jeepay.vip',
      type: 'text',
      value: ''
    },
    mch_no: {
      name: '商户号',
      description: '计全商户号',
      type: 'text',
      value: ''
    },
    app_id: {
      name: '应用ID',
      description: '计全应用ID',
      type: 'text',
      value: ''
    },
    key: {
      name: '密钥',
      description: '计全 API 私钥，用于签名与验签',
      type: 'text',
      value: ''
    },
    cashier_mnt: {
      name: '收银台 mnt（可选）',
      description:
        'Web/聚合收银台（WEB_CASHIER、CHANNEL_CASHIER）统一下单 channelExtra 中的 mnt，默认同「商户号」。若计全提示「参数mnt必填」且与商户号不同，在此填写计全要求的值',
      type: 'text',
      value: ''
    },
    way_code: {
      name: '支付方式',
      description:
        '计全支付方式。Web 统一收银台见指引 https://doc.jeequan.com/#/integrate/jqf/guide/267 与 https://docs.jeequan.com/docs/jeepay-open/jeepay-open-1e9j91jksjnh9',
      type: 'select',
      value: 'ALI_PC',
      options: [
        { name: 'Web收银台(统一收银台)-WEB_CASHIER', value: 'WEB_CASHIER' },
        { name: '聚合二维码(用户扫商家,支持微信/支付宝/云闪付)', value: 'QR_CASHIER' },
        { name: '聚合收银台-CHANNEL_CASHIER', value: 'CHANNEL_CASHIER' },
        { name: '支付宝PC网站-ALI_PC', value: 'ALI_PC' },
        { name: '支付宝WAP-ALI_WAP', value: 'ALI_WAP' },
        { name: '支付宝二维码-ALI_QR', value: 'ALI_QR' },
        { name: '微信扫码-WX_NATIVE', value: 'WX_NATIVE' },
        { name: '微信条码-WX_BAR', value: 'WX_BAR' },
        { name: '微信H5-WX_H5', value: 'WX_H5' },
        { name: '微信公众号-WX_JSAPI', value: 'WX_JSAPI' }
      ]
    }
  },
  alipay: {
    app_id: {
      name: '应用ID',
      description: '支付宝应用ID',
      type: 'text',
      value: ''
    },
    private_key: {
      name: '应用私钥',
      description: '应用私钥，开发者自己生成，详细参考官方文档 https://opendocs.alipay.com/common/02kipl?pathHash=84adb0fd',
      type: 'text',
      value: ''
    },
    public_key: {
      name: '支付宝公钥',
      description: '支付宝公钥，详细参考官方文档 https://opendocs.alipay.com/common/02kdnc?pathHash=fb0c752a',
      type: 'text',
      value: ''
    },
    pay_type: {
      name: '支付类型',
      description: '支付类型,需要您再支付宝开发者中心开通相关权限才可以使用对应类型支付方式',
      type: 'select',
      value: '',
      options: [
        {
          name: '当面付',
          value: 'facepay'
        },
        {
          name: '电脑网站支付',
          value: 'pagepay'
        },
        {
          name: '手机网站支付',
          value: 'wappay'
        }
      ]
    }
  },
  wxpay: {
    app_id: {
      name: 'AppID',
      description: '应用ID 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    mch_id: {
      name: '商户号',
      description: '微信商户号 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    mch_certificate_serial_number: {
      name: '商户证书序列号',
      description: '商户证书序列号 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    mch_apiv3_key: {
      name: '商户APIv3密钥',
      description: '商户APIv3密钥 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    mch_private_key: {
      name: '商户私钥',
      description: '商户私钥 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    pay_type: {
      name: '支付类型',
      description: '支付类型',
      type: 'select',
      value: '',
      options: [
        {
          name: 'Native支付',
          value: 'Native'
        }
      ]
    },
  },
  stripe: {
    secret_key: {
      name: 'SecretKey',
      description: 'API 私钥',
      type: 'text',
      value: ''
    },
    webhook_secret: {
      name: 'WebHookSecret',
      description: '回调验证密钥，不用填写，创建网关后会自动在stripe后台创建webhook并获取webhook密钥',
      type: 'text',
      value: ''
    },
  }
};

export { PaymentConfig, PaymentType, CurrencyType };
