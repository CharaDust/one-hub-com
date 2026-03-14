package handler

import (
	"net/http"
	"wechat-sso-bridge/store"

	"github.com/gin-gonic/gin"
)

func GetScanStatus(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusOK, gin.H{
			"status": "expired",
			"code":   "",
		})
		return
	}
	status, code := store.Default().GetScanStatus(token)
	res := gin.H{"status": status}
	if code != "" {
		res["code"] = code
	}
	c.JSON(http.StatusOK, res)
}
