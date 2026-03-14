package config

import (
	"os"
	"strconv"
)

var (
	WeChatAppID     string
	WeChatAppSecret string
	WeChatToken     string
	APIToken        string
	Port            int
)

const defaultPort = 3000

func Init() {
	WeChatAppID = os.Getenv("WECHAT_APP_ID")
	WeChatAppSecret = os.Getenv("WECHAT_APP_SECRET")
	WeChatToken = os.Getenv("WECHAT_TOKEN")
	APIToken = os.Getenv("WECHAT_API_TOKEN")
	Port = defaultPort
	if p := os.Getenv("PORT"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			Port = v
		}
	}
}
