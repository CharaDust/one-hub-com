package handler

import (
	"net/http"
	"wechat-sso-bridge/config"
	"wechat-sso-bridge/store"
	"wechat-sso-bridge/wechat"

	"github.com/gin-gonic/gin"
)

func apiAuth(c *gin.Context) bool {
	token := c.GetHeader("Authorization")
	if token == "" {
		token = c.Query("Authorization")
	}
	if token == "" || token != config.APIToken {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无权进行此操作，未登录或 token 无效",
		})
		return false
	}
	return true
}

func GetUserByCode(c *gin.Context) {
	if !apiAuth(c) {
		return
	}
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusOK, gin.H{
			"message": "无效的参数",
			"success": false,
		})
		return
	}
	openID, ok := store.Default().GetAndConsumeCode(code)
	if !ok {
		c.JSON(http.StatusOK, gin.H{
			"message": "无效或已过期的 code",
			"success": false,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "",
		"success": true,
		"data":    openID,
	})
}

func GetAccessToken(c *gin.Context) {
	if !apiAuth(c) {
		return
	}
	token, expiration := wechat.GetAccessTokenAndExpiration()
	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "",
		"access_token": token,
		"expiration":   expiration,
	})
}
