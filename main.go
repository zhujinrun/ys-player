package main

import (
	"fmt"
	"log"

	"ys-player/api"
	"ys-player/internal/config"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置文件
	if err := config.LoadConfig("configs/config.json"); err != nil {
		log.Fatal("加载配置文件失败:", err)
	}

	// 设置 gin 的运行模式
	gin.SetMode(config.GlobalConfig.Server.Mode)

	// 创建默认的 gin 引擎
	r := gin.Default()

	// 静态文件服务
	r.Static("/static", "./static")
	r.StaticFile("/", "./static/index.html")
	r.StaticFile("/player", "./static/player.html")

	// 创建处理器
	searchHandler := api.NewSearchHandler()
	videoHandler := api.NewVideoSourceHandler()

	// 注册路由
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// 添加搜索路由
	r.GET("/api/search", searchHandler.Search)

	// 添加视频源路由
	r.GET("/api/video", videoHandler.GetVideoSource)

	// 启动服务器
	addr := fmt.Sprintf(":%d", config.GlobalConfig.Server.Port)
	if err := r.Run(addr); err != nil {
		log.Fatal("启动服务器失败:", err)
	}
}
