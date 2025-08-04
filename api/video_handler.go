package api

import (
	"net/http"

	"ys-player/internal/services"

	"github.com/gin-gonic/gin"
)

// VideoSourceHandler 处理视频源相关的请求
type VideoSourceHandler struct {
	videoService *services.VideoSourceService
}

// NewVideoSourceHandler 创建新的视频源处理器
func NewVideoSourceHandler() *VideoSourceHandler {
	return &VideoSourceHandler{
		videoService: services.NewVideoSourceService(),
	}
}

// GetVideoSource 获取视频源信息
func (h *VideoSourceHandler) GetVideoSource(c *gin.Context) {
	// 获取查询参数
	sourceName := c.Query("name")
	if sourceName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "视频名称不能为空",
		})
		return
	}

	// 调用视频源服务
	result, err := h.videoService.GetVideoSource(sourceName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// 返回结果
	c.JSON(http.StatusOK, result)
}
