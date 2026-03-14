package handler

import (
	"io"
	"net/http"
	"strings"
	"wechat-sso-bridge/store"
	"wechat-sso-bridge/wechat"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func WeChatVerification(c *gin.Context) {
	signature := c.Query("signature")
	timestamp := c.Query("timestamp")
	nonce := c.Query("nonce")
	echoStr := c.Query("echostr")
	if !wechat.CheckSignature(signature, timestamp, nonce) {
		c.Status(http.StatusForbidden)
		return
	}
	c.String(http.StatusOK, echoStr)
}

func ProcessWeChatMessage(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	ev, err := wechat.ParseEventXML(body)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	if ev.MsgType != wechat.MsgTypeEvent {
		c.String(http.StatusOK, "")
		return
	}
	openID := ev.FromUserName
	if openID == "" {
		c.String(http.StatusOK, "")
		return
	}

	var token string
	if ev.Ticket != "" {
		token, _ = store.Default().TokenByTicket(ev.Ticket)
	}
	if token == "" {
		scene := wechat.SceneFromEventKey(ev.Event, ev.EventKey)
		if scene != "" {
			token, _ = store.Default().TokenByScene(scene)
		}
	}
	if token == "" {
		c.String(http.StatusOK, "")
		return
	}

	code := strings.ReplaceAll(uuid.New().String(), "-", "")[:16]
	store.Default().PutCode(code, openID)
	store.Default().MarkSuccess(token, code)

	// 按微信文档：5 秒内必须回复 success 或空串，否则报「回应不合法」；不回复文本内容即可，前端轮询会拿到 code 并跳转
	c.String(http.StatusOK, "success")
}
