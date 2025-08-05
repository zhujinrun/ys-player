package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os/exec"
	"runtime"
	"time"

	"ys-player/api"
	"ys-player/internal/config"

	"github.com/gin-gonic/gin"
)

//go:embed static/*
var staticFiles embed.FS

// openBrowser opens the specified URL in the default browser of the user's OS
func openBrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		log.Printf("Unsupported platform: %s", runtime.GOOS)
		return
	}
	if err != nil {
		log.Printf("Failed to open browser: %v", err)
	}
}

func main() {
	// 加载配置文件
	if err := config.LoadConfig("configs/config.json"); err != nil {
		log.Fatal("加载配置文件失败:", err)
	}

	// 设置 gin 的运行模式
	gin.SetMode(config.GlobalConfig.Server.Mode)

	// 创建默认的 gin 引擎
	r := gin.Default()

	// 静态文件服务 - 使用嵌入的文件系统
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatal("创建静态文件子系统失败:", err)
	}

	r.StaticFS("/static", http.FS(staticFS))

	// 处理根路径和特定页面
	r.GET("/", func(c *gin.Context) {
		indexFile, err := staticFS.Open("index.html")
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		defer indexFile.Close()

		c.DataFromReader(http.StatusOK, -1, "text/html", indexFile, nil)
	})

	r.GET("/player", func(c *gin.Context) {
		playerFile, err := staticFS.Open("player.html")
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		defer playerFile.Close()

		c.DataFromReader(http.StatusOK, -1, "text/html", playerFile, nil)
	})

	// 创建处理器
	searchHandler := api.NewSearchHandler()
	videoHandler := api.NewVideoSourceHandler()

	// 注册路由
	r.GET("/api/ping", func(c *gin.Context) {
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

	// 在新goroutine中启动服务器
	go func() {
		// 等待服务器启动
		time.Sleep(100 * time.Millisecond)

		// 打开浏览器
		openBrowser(fmt.Sprintf("http://localhost%s", addr))
	}()

	// 主goroutine中启动服务器
	if err := r.Run(addr); err != nil {
		log.Fatal("启动服务器失败:", err)
	}
}
