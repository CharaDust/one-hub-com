package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"one-api/common/config"
	"one-api/model"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type wechatLoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    string `json:"data"`
}

func appendWechatDebugLog(hypothesisID, location, message string, data map[string]any) {
	payload := map[string]any{
		"runId":        "run-1",
		"hypothesisId": hypothesisID,
		"location":     location,
		"message":      message,
		"data":         data,
		"timestamp":    time.Now().UnixMilli(),
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return
	}
	f, err := os.OpenFile("/Users/richardki/Documents/项目/WebServer/one-hub-com/.cursor/debug.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	_, _ = f.Write(append(b, '\n'))
}

func getWeChatIdByCode(code string) (string, error) {
	// #region agent log
	appendWechatDebugLog("H1", "controller/wechat.go:getWeChatIdByCode:beforeRequest", "prepare bridge request", map[string]any{
		"codeLen":           len(code),
		"serverAddressSet":  config.WeChatServerAddress != "",
		"serverAddressHead": func() string { if len(config.WeChatServerAddress) >= 8 { return config.WeChatServerAddress[:8] }; return config.WeChatServerAddress }(),
		"tokenSet":          config.WeChatServerToken != "",
		"tokenLen":          len(config.WeChatServerToken),
	})
	// #endregion
	if code == "" {
		return "", errors.New("无效的参数")
	}
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/wechat/user?code=%s", config.WeChatServerAddress, code), nil)
	if err != nil {
		// #region agent log
		appendWechatDebugLog("H1", "controller/wechat.go:getWeChatIdByCode:newRequestErr", "create request failed", map[string]any{
			"err": err.Error(),
		})
		// #endregion
		return "", err
	}
	req.Header.Set("Authorization", config.WeChatServerToken)
	client := http.Client{
		Timeout: 5 * time.Second,
	}
	httpResponse, err := client.Do(req)
	if err != nil {
		// #region agent log
		appendWechatDebugLog("H2", "controller/wechat.go:getWeChatIdByCode:clientDoErr", "bridge request failed", map[string]any{
			"err": err.Error(),
		})
		// #endregion
		return "", err
	}
	defer httpResponse.Body.Close()
	var res wechatLoginResponse
	err = json.NewDecoder(httpResponse.Body).Decode(&res)
	if err != nil {
		// #region agent log
		appendWechatDebugLog("H2", "controller/wechat.go:getWeChatIdByCode:decodeErr", "decode bridge response failed", map[string]any{
			"httpStatus": httpResponse.StatusCode,
			"err":        err.Error(),
		})
		// #endregion
		return "", err
	}
	// #region agent log
	appendWechatDebugLog("H2", "controller/wechat.go:getWeChatIdByCode:bridgeResponse", "bridge response received", map[string]any{
		"httpStatus": httpResponse.StatusCode,
		"success":    res.Success,
		"message":    res.Message,
		"dataEmpty":  res.Data == "",
	})
	// #endregion
	if !res.Success {
		return "", errors.New(res.Message)
	}
	if res.Data == "" {
		return "", errors.New("验证码错误或已过期")
	}
	return res.Data, nil
}

func WeChatAuth(c *gin.Context) {
	// #region agent log
	appendWechatDebugLog("H3", "controller/wechat.go:WeChatAuth:entry", "wechat auth entry", map[string]any{
		"codeLen":               len(c.Query("code")),
		"legacyEnabled":         config.WeChatAuthEnabled,
		"codeModeEnabled":       config.WeChatCodeAuthEnabled,
		"scanModeEnabled":       config.WeChatScanAuthEnabled,
		"registerEnabled":       config.RegisterEnabled,
		"serverAddressConfigured": config.WeChatServerAddress != "",
		"tokenConfigured":         config.WeChatServerToken != "",
	})
	// #endregion
	if !config.WeChatAuthEnabled && !config.WeChatCodeAuthEnabled && !config.WeChatScanAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "管理员未开启微信登录以及注册",
			"success": false,
		})
		return
	}
	code := c.Query("code")
	wechatId, err := getWeChatIdByCode(code)
	if err != nil {
		// #region agent log
		appendWechatDebugLog("H4", "controller/wechat.go:WeChatAuth:getWeChatIdErr", "wechat id fetch failed", map[string]any{
			"err": err.Error(),
		})
		// #endregion
		c.JSON(http.StatusOK, gin.H{
			"message": err.Error(),
			"success": false,
		})
		return
	}
	user := model.User{
		WeChatId: wechatId,
	}
	if model.IsWeChatIdAlreadyTaken(wechatId) {
		err := user.FillUserByWeChatId()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	} else {
		if config.RegisterEnabled {
			user.Username = "wechat_" + strconv.Itoa(model.GetMaxUserId()+1)
			user.DisplayName = "WeChat User"
			user.Role = config.RoleCommonUser
			user.Status = config.UserStatusEnabled

			if err := user.Insert(0); err != nil {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}
		} else {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "管理员关闭了新用户注册",
			})
			return
		}
	}

	if user.Status != config.UserStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "用户已被封禁",
			"success": false,
		})
		return
	}
	setupLogin(&user, c)
}

func WeChatBind(c *gin.Context) {
	if !config.WeChatAuthEnabled && !config.WeChatCodeAuthEnabled && !config.WeChatScanAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "管理员未开启微信登录以及注册",
			"success": false,
		})
		return
	}
	code := c.Query("code")
	wechatId, err := getWeChatIdByCode(code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": err.Error(),
			"success": false,
		})
		return
	}
	if model.IsWeChatIdAlreadyTaken(wechatId) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该微信账号已被绑定",
		})
		return
	}
	id := c.GetInt("id")
	user := model.User{
		Id: id,
	}
	err = user.FillUserById()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	user.WeChatId = wechatId
	err = user.Update(false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
