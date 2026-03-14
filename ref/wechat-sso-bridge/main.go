package main

import (
	"embed"
	"log"
	"strconv"
	"wechat-sso-bridge/config"
	"wechat-sso-bridge/handler"
	"wechat-sso-bridge/router"
	"wechat-sso-bridge/store"
	"wechat-sso-bridge/wechat"

	"github.com/gin-gonic/gin"
)

//go:embed web/index.html
var webFS embed.FS

func main() {
	config.Init()
	wechat.InitAccessToken()
	store.StartCleanup(store.Default(), store.TokenTTL/2)

	indexHTML, _ := webFS.ReadFile("web/index.html")
	handler.SetIndexHTML(indexHTML)

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	router.SetRouter(r)

	port := strconv.Itoa(config.Port)
	log.Printf("[wechat-sso-bridge] listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
