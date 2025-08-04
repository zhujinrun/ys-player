package api

import (
	"net/http"

	"ys-player/internal/services"

	"github.com/gin-gonic/gin"
)

// SearchHandler 处理搜索相关的请求
type SearchHandler struct {
	searchService *services.SearchService
}

// NewSearchHandler 创建新的搜索处理器
func NewSearchHandler() *SearchHandler {
	return &SearchHandler{
		searchService: services.NewSearchService(),
	}
}

// Search 处理搜索请求
func (h *SearchHandler) Search(c *gin.Context) {
	// 获取查询参数
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "关键字不能为空",
		})
		return
	}

	// 调用搜索服务
	results, err := h.searchService.Search(keyword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// 返回结果
	c.JSON(http.StatusOK, results)
}
