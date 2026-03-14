package handler

import (
	"net/http"
	"strings"
	"time"
	"wechat-sso-bridge/store"
	"wechat-sso-bridge/wechat"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var indexHTML []byte

func SetIndexHTML(b []byte) { indexHTML = b }

func LoginPage(c *gin.Context) {
	redirectURI := c.Query("redirect_uri")
	token := strings.ReplaceAll(uuid.New().String(), "-", "")

	ticket, imageURL, expireSec, err := wechat.CreateTemporaryQR(token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "生成二维码失败: " + err.Error(),
		})
		return
	}

	expireAt := time.Now().Add(time.Duration(expireSec+60) * time.Second)
	store.Default().CreateSession(token, ticket, redirectURI, expireAt)

	if c.GetHeader("Accept") == "application/json" {
		c.JSON(http.StatusOK, gin.H{
			"success":      true,
			"token":        token,
			"url":          imageURL,
			"redirect_uri": redirectURI,
		})
		return
	}

	html := string(indexHTML)
	html = strings.ReplaceAll(html, "{{.Token}}", token)
	html = strings.ReplaceAll(html, "{{.QRURL}}", imageURL)
	html = strings.ReplaceAll(html, "{{.RedirectURI}}", redirectURI)
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
