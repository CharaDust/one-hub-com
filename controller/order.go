package controller

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"one-api/common"
	"one-api/common/config"
	"one-api/common/logger"
	"one-api/common/utils"
	"one-api/model"
	"one-api/payment"
	"one-api/payment/types"

	"github.com/gin-gonic/gin"
)

type OrderRequest struct {
	UUID   string `json:"uuid" binding:"required"`
	Amount int    `json:"amount" binding:"required"`
}

type OrderResponse struct {
	TradeNo string `json:"trade_no"`
	*types.PayRequest
}

// CreateOrder
func CreateOrder(c *gin.Context) {
	var orderReq OrderRequest
	if err := c.ShouldBindJSON(&orderReq); err != nil {
		common.APIRespondWithError(c, http.StatusOK, errors.New("invalid request"))

		return
	}

	if orderReq.Amount <= 0 || orderReq.Amount < config.PaymentMinAmount {
		common.APIRespondWithError(c, http.StatusOK, fmt.Errorf("金额必须大于等于 %d", config.PaymentMinAmount))

		return
	}

	userId := c.GetInt("id")
	user, err := model.GetUserById(userId, false)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, errors.New("用户不存在"))
		return
	}

	// 关闭用户未完成的订单
	go model.CloseUnfinishedOrder()

	paymentService, err := payment.NewPaymentService(orderReq.UUID)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	// 获取手续费和支付金额
	discount, fee, payMoney := calculateOrderAmount(paymentService.Payment, orderReq.Amount)
	// 开始支付
	tradeNo := utils.GenerateTradeNo()
	payRequest, err := paymentService.Pay(tradeNo, payMoney, user)
	if err != nil {
		logger.SysError(fmt.Sprintf("create order pay failed: %v", err))
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	// 创建订单
	order := &model.Order{
		UserId:        userId,
		GatewayId:     paymentService.Payment.ID,
		TradeNo:       tradeNo,
		Amount:        orderReq.Amount,
		OrderAmount:   payMoney,
		OrderCurrency: paymentService.Payment.Currency,
		Fee:           fee,
		Discount:      discount,
		Status:        model.OrderStatusPending,
		Quota:         orderReq.Amount * int(config.QuotaPerUnit),
	}

	err = order.Insert()
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, errors.New("创建订单失败，请稍后再试"))
		return
	}

	orderResp := &OrderResponse{
		TradeNo:    tradeNo,
		PayRequest: payRequest,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    orderResp,
	})
}

// tradeNo lock
var orderLocks sync.Map
var createLock sync.Mutex

// LockOrder 尝试对给定订单号加锁
func LockOrder(tradeNo string) {
	lock, ok := orderLocks.Load(tradeNo)
	if !ok {
		createLock.Lock()
		defer createLock.Unlock()
		lock, ok = orderLocks.Load(tradeNo)
		if !ok {
			lock = new(sync.Mutex)
			orderLocks.Store(tradeNo, lock)
		}
	}
	lock.(*sync.Mutex).Lock()
}

// UnlockOrder 释放给定订单号的锁
func UnlockOrder(tradeNo string) {
	lock, ok := orderLocks.Load(tradeNo)
	if ok {
		lock.(*sync.Mutex).Unlock()
	}
}

// 新手档位（特惠计划）：1、190、390、990，对应到账 15、500、1000、2000；冷却期内再次充新手档位仅等额到账
var newbieTierAmounts = map[int]bool{10: true, 190: true, 390: true, 990: true}

func isNewbieTier(amount int) bool {
	return newbieTierAmounts[amount]
}

func getNewbieTierCredit(amount int) int {
	switch amount {
	case 10:
		return 15
	case 190:
		return 500
	case 390:
		return 1000
	case 990:
		return 2000
	default:
		return amount
	}
}

// 固定档位（含加赠）：11→15，190、390、990、2000、3000、5000，以及测试档 10、20；检测到这些档位时按加赠规则到账
var fixedRechargeAmounts = map[int]bool{
	10: true, 11: true, 20: true, 190: true, 390: true, 990: true, 2000: true, 3000: true, 5000: true,
}

func isFixedRechargeAmount(amount int) bool {
	return fixedRechargeAmounts[amount]
}

// getActualCredit 仅用于固定档位：2000→3000，3000→5000，5000→10000，其余固定档到账=充值金额
func getActualCreditForFixedTier(amount int) int {
	switch amount {
	case 11:
		return 15
	case 2000:
		return 3000
	case 3000:
		return 5000
	case 5000:
		return 10000
	default:
		return amount
	}
}

func PaymentCallback(c *gin.Context) {
	uuid := c.Param("uuid")
	paymentService, err := payment.NewPaymentService(uuid)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, errors.New("payment not found"))
		return
	}

	payNotify, err := paymentService.HandleCallback(c, paymentService.Payment.Config)
	if err != nil {
		return
	}

	LockOrder(payNotify.GatewayNo)
	defer UnlockOrder(payNotify.GatewayNo)

	order, err := model.GetOrderByTradeNo(payNotify.TradeNo)
	if err != nil {
		logger.SysError(fmt.Sprintf("gateway callback failed to find order, trade_no: %s,", payNotify.TradeNo))
		return
	}

	if order.Status != model.OrderStatusPending {
		logger.SysLog(fmt.Sprintf("payment callback: order already processed, trade_no=%s, method=%s, status=%s", payNotify.TradeNo, c.Request.Method, order.Status))
		// 计全通常会先发 POST 异步通知，再触发浏览器 GET 回跳；若订单已处理，GET 也应重定向到流水页。
		if c.Request.Method == "GET" {
			c.Redirect(http.StatusFound, "/panel/log")
		}
		return
	}

	var actualCredit int
	// 新手档位（1/190/390/990）：无新手标签时给特惠到账并加标签进入冷却；冷却期内再次充新手档位仅等额到账
	if isNewbieTier(order.Amount) {
		user, err := model.GetUserById(order.UserId, true)
		if err != nil {
			logger.SysError(fmt.Sprintf("gateway callback failed to get user, trade_no: %s, user_id: %d", payNotify.TradeNo, order.UserId))
			return
		}
		if user.HasNewbieTag() {
			actualCredit = order.Amount // 冷却期内等额发放
		} else {
			actualCredit = getNewbieTierCredit(order.Amount)
			expireAt := time.Now().Add(time.Duration(config.NewbieTagCooldownMinutes) * time.Minute).Unix()
			if err := model.SetNewbieTagExpireAt(order.UserId, expireAt); err != nil {
				logger.SysError(fmt.Sprintf("gateway callback failed to set newbie tag, trade_no: %s, error: %s", payNotify.TradeNo, err.Error()))
			}
		}
	} else if isFixedRechargeAmount(order.Amount) {
		actualCredit = getActualCreditForFixedTier(order.Amount)
	} else {
		actualCredit = order.Amount
	}
	order.Quota = actualCredit * int(config.QuotaPerUnit)

	order.GatewayNo = payNotify.GatewayNo
	order.Status = model.OrderStatusSuccess
	err = order.Update()
	if err != nil {
		logger.SysError(fmt.Sprintf("gateway callback failed to update order, trade_no: %s,", payNotify.TradeNo))
		return
	}
	// 添加余额到用户账户
	err = model.IncreaseUserQuota(order.UserId, order.Quota)
	if err != nil {
		logger.SysError(fmt.Sprintf("gateway callback failed to increase user quota, trade_no: %s,", payNotify.TradeNo))
		return
	}

	// Try to upgrade user group based on cumulative recharge amount
	err = model.CheckAndUpgradeUserGroup(order.UserId, order.Quota)
	if err != nil {
		logger.SysError(fmt.Sprintf("failed to check and upgrade user group, trade_no: %s, error: %s", payNotify.TradeNo, err.Error()))
	}

	model.RecordQuotaLog(order.UserId, model.LogTypeTopup, order.Quota, c.ClientIP(), fmt.Sprintf("在线充值成功，充值档位: %d 积分，实际到账: %d 积分，支付金额：%.2f %s", order.Amount, actualCredit, order.OrderAmount, order.OrderCurrency))

	// 浏览器通过 return_url 跳转过来的是 GET，处理完后重定向到流水页
	if c.Request.Method == "GET" {
		c.Redirect(http.StatusFound, "/panel/log")
		return
	}
}

func CheckOrderStatus(c *gin.Context) {
	tradeNo := c.Query("trade_no")
	userId := c.GetInt("id")
	success := false

	if tradeNo != "" {
		order, err := model.GetUserOrder(userId, tradeNo)
		if err == nil {
			if order.Status == model.OrderStatusSuccess {
				success = true
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": success,
		"message": "",
	})
}

// discountMoney优惠金额 fee手续费，payMoney实付金额
func calculateOrderAmount(payment *model.Payment, amount int) (discountMoney, fee, payMoney float64) {
	// 获取折扣
	discount := common.GetRechargeDiscount(strconv.Itoa(amount))
	newMoney := float64(amount) * discount // 折后价值
	oldTotal := float64(amount)            //原价值
	if payment.PercentFee > 0 {
		//手续费=（原始价值*折扣*手续费率）
		fee = utils.Decimal(newMoney*payment.PercentFee, 2) //折后手续
		oldTotal = utils.Decimal(oldTotal*(1+payment.PercentFee), 2)
	} else if payment.FixedFee > 0 {
		//固定费率不计算折扣
		fee = payment.FixedFee
	}

	//实际费用=（折后价+折后手续费）*汇率
	total := utils.Decimal(newMoney+fee, 2)
	if payment.Currency == model.CurrencyTypeUSD {
		payMoney = total
	} else {
		oldTotal = utils.Decimal(oldTotal*config.PaymentUSDRate, 2)
		payMoney = utils.Decimal(total*config.PaymentUSDRate, 2)
	}
	discountMoney = oldTotal - payMoney //折扣金额 = 原价值-实际支付价值
	return
}

func GetOrderList(c *gin.Context) {
	var params model.SearchOrderParams
	if err := c.ShouldBindQuery(&params); err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}

	payments, err := model.GetOrderList(&params)
	if err != nil {
		common.APIRespondWithError(c, http.StatusOK, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    payments,
	})
}
