package router

import (
	"embed"
	"net/http"
	"strings"

	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"

	"one-api/controller"
	"one-api/middleware"
)

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())

	// 子路径部署：若通过反向代理挂在 /one-hub 等路径下，需设置 WEB_BASE_PATH=/one-hub，
	// 否则请求 /one-hub/assets/*.js 会落到 NoRoute 返回 index.html，导致 MIME type 报错。
	webBasePath := strings.TrimSpace(viper.GetString("web_base_path"))
	webBasePath = strings.TrimSuffix(webBasePath, "/")
	if webBasePath == "" {
		webBasePath = "/"
	}

	// 特别处理 favicon.ico
	router.GET("/favicon.ico", controller.Favicon(buildFS))
	if webBasePath != "/" {
		router.GET(webBasePath+"/favicon.ico", controller.Favicon(buildFS))
	}

	embedFS, err := static.EmbedFolder(buildFS, "web/build")
	if err != nil {
		panic("加载嵌入式资源失败")
	}
	router.Use(static.Serve(webBasePath, embedFS))

	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}
