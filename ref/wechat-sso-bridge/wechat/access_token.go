package wechat

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
	"wechat-sso-bridge/config"
)

var (
	mu                sync.RWMutex
	accessToken       string
	expirationSeconds int
)

type tokenResp struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	Errcode     int    `json:"errcode"`
	Errmsg      string `json:"errmsg"`
}

func InitAccessToken() {
	go func() {
		for {
			RefreshAccessToken()
			mu.RLock()
			sleep := expirationSeconds
			mu.RUnlock()
			if sleep < 60 {
				sleep = 60
			}
			time.Sleep(time.Duration(sleep) * time.Second)
		}
	}()
}

func RefreshAccessToken() {
	if config.WeChatAppID == "" || config.WeChatAppSecret == "" {
		return
	}
	url := fmt.Sprintf("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s",
		config.WeChatAppID, config.WeChatAppSecret)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		log.Printf("[wechat] refresh access token request error: %v", err)
		return
	}
	defer resp.Body.Close()
	var r tokenResp
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		log.Printf("[wechat] decode token response error: %v", err)
		return
	}
	if r.Errcode != 0 {
		log.Printf("[wechat] token api error: %d %s", r.Errcode, r.Errmsg)
		return
	}
	mu.Lock()
	accessToken = r.AccessToken
	expirationSeconds = r.ExpiresIn
	mu.Unlock()
	log.Printf("[wechat] access token refreshed, expires_in=%d", r.ExpiresIn)
}

func GetAccessToken() string {
	mu.RLock()
	defer mu.RUnlock()
	return accessToken
}

func GetAccessTokenAndExpiration() (string, int) {
	mu.RLock()
	defer mu.RUnlock()
	return accessToken, expirationSeconds
}
