package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
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
		fmt.Printf("加载配置文件失败:%v\n程序将在 5s 后自动关闭...\n", err)
		time.Sleep(time.Second * 5)
		os.Exit(0)
	}

	// 设置 gin 的运行模式
	gin.SetMode(config.GlobalConfig.Server.Mode)

	// 创建默认的 gin 引擎
	r := gin.Default()
	r.SetTrustedProxies(nil)

	// 静态文件服务 - 使用嵌入的文件系统
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		fmt.Printf("创建静态文件子系统失败:%v\n程序将在 5s 后自动关闭...\n", err)
		time.Sleep(time.Second * 5)
		os.Exit(0)
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

	r.GET("/play", func(c *gin.Context) {
		playerFile, err := staticFS.Open("play.html")
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

	ln, err := net.Listen("tcp", addr)
	if err != nil {
		fmt.Printf("服务端口 %s 已被占用，请修改 configs/config.json 中的 server.port 参数后重新打开\n程序将在 5s 后自动关闭...\n", addr[1:])
		time.Sleep(time.Second * 5)
		os.Exit(0)
	}

	// 在新goroutine中启动服务器
	go func() {
		fmt.Printf("服务启动在 http://localhost%s 程序即将自动在浏览器中打开\n", addr)
		// 等待服务器启动
		time.Sleep(100 * time.Millisecond)
		// 打开浏览器
		openBrowser(fmt.Sprintf("http://localhost%s", addr))
		fmt.Println("温馨提示：请勿在观影过程中关闭此窗口，除非您确认结束观看！")
	}()

	// 主goroutine中启动服务器
	if err := r.RunListener(ln); err != nil {
		fmt.Printf("服务启动失败:%v\n程序将在 5s 后自动关闭...\n", err)
		time.Sleep(time.Second * 5)
		os.Exit(0)
	}
}
