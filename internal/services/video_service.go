package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"ys-player/internal/models"
	"ys-player/internal/utils"
)

// VideoSourceService 视频源服务
type VideoSourceService struct {
	httpClient *utils.HTTPClient
	apiURL     string
}

// NewVideoSourceService 创建新的视频源服务
func NewVideoSourceService() *VideoSourceService {
	return &VideoSourceService{
		httpClient: utils.NewHTTPClient(30 * time.Second), // 增加超时时间到30秒，因为视频源数据可能较大
		// 这里替换为实际的 API 地址
		apiURL: "https://m1-a1.cloud.nnpp.vip:2223/api/v/",
	}
}

// GetVideoSource 获取视频源信息
func (s *VideoSourceService) GetVideoSource(sourceName string) (*models.VideoResponse, error) {
	// 构建请求 URL
	url := fmt.Sprintf("%s?z=5117f1b038516d559d873674092a53e5&jx=%s&s1ig=11398&g=", s.apiURL, sourceName)

	// 发送 GET 请求
	resp, err := s.httpClient.Get(context.Background(), url)
	if err != nil {
		return nil, fmt.Errorf("获取视频源信息失败: %v", err)
	}

	// 检查响应状态码
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("视频源API返回错误状态码: %d", resp.StatusCode)
	}

	// 解析响应数据
	var videoResp models.VideoResponse
	if err := json.Unmarshal(resp.Body, &videoResp); err != nil {
		return nil, fmt.Errorf("解析视频源信息失败: %v", err)
	}

	return &videoResp, nil
}
