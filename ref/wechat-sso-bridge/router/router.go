package router

import (
	"github.com/gin-gonic/gin"
	"wechat-sso-bridge/handler"
)

func SetRouter(r *gin.Engine) {
	r.GET("/", handler.LoginPage)
	r.GET("/api/scan/status", handler.GetScanStatus)
	r.GET("/api/wechat", handler.WeChatVerification)
	r.POST("/api/wechat", handler.ProcessWeChatMessage)
	wechat := r.Group("/api/wechat")
	{
		wechat.GET("/user", handler.GetUserByCode)
		wechat.GET("/access_token", handler.GetAccessToken)
	}
}
