package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"ys-player/internal/models"
	"ys-player/internal/utils"
)

// SearchService 搜索服务
type SearchService struct {
	httpClient *utils.HTTPClient
	apiURL     string
}

// NewSearchService 创建新的搜索服务
func NewSearchService() *SearchService {
	return &SearchService{
		httpClient: utils.NewHTTPClient(10 * time.Second),
		// 这里替换为实际的 API 地址
		apiURL: "https://m1-a1.cloud.nnpp.vip:2223/api/search_prompt",
	}
}

// Search 执行搜索请求
func (s *SearchService) Search(keyword string) ([]models.SearchResult, error) {
	// 构建请求 URL（添加关键字作为查询参数）
	url := fmt.Sprintf("%s?k=%s", s.apiURL, keyword)

	// 发送 GET 请求
	resp, err := s.httpClient.Get(context.Background(), url)
	if err != nil {
		return nil, fmt.Errorf("搜索请求失败: %v", err)
	}

	// 检查响应状态码
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("搜索API返回错误状态码: %d", resp.StatusCode)
	}

	// 解析响应数据
	var results []models.SearchResult
	if err := json.Unmarshal(resp.Body, &results); err != nil {
		return nil, fmt.Errorf("解析搜索结果失败: %v", err)
	}

	return results, nil
}
