package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"
)

// HTTPClient 是 HTTP 请求客户端的结构体
type HTTPClient struct {
	client  *http.Client
	timeout time.Duration
	headers map[string]string
}

// HTTPResponse 是 HTTP 响应的结构体
type HTTPResponse struct {
	StatusCode int
	Body       []byte
	Headers    http.Header
}

// NewHTTPClient 创建一个新的 HTTP 客户端
func NewHTTPClient(timeout time.Duration) *HTTPClient {
	return &HTTPClient{
		client: &http.Client{
			Timeout: timeout,
		},
		timeout: timeout,
		headers: make(map[string]string),
	}
}

// SetHeader 设置请求头
func (c *HTTPClient) SetHeader(key, value string) {
	c.headers[key] = value
}

// SetHeaders 批量设置请求头
func (c *HTTPClient) SetHeaders(headers map[string]string) {
	for k, v := range headers {
		c.headers[k] = v
	}
}

// do 执行 HTTP 请求
func (c *HTTPClient) do(ctx context.Context, method, url string, body interface{}) (*HTTPResponse, error) {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, reqBody)
	if err != nil {
		return nil, err
	}

	// 设置默认的 Content-Type
	if body != nil && c.headers["Content-Type"] == "" {
		req.Header.Set("Content-Type", "application/json")
	}

	// 设置请求头
	for k, v := range c.headers {
		req.Header.Set(k, v)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return &HTTPResponse{
		StatusCode: resp.StatusCode,
		Body:       respBody,
		Headers:    resp.Header,
	}, nil
}

// Get 发送 GET 请求
func (c *HTTPClient) Get(ctx context.Context, url string) (*HTTPResponse, error) {
	return c.do(ctx, http.MethodGet, url, nil)
}

// Post 发送 POST 请求
func (c *HTTPClient) Post(ctx context.Context, url string, body interface{}) (*HTTPResponse, error) {
	return c.do(ctx, http.MethodPost, url, body)
}

// Put 发送 PUT 请求
func (c *HTTPClient) Put(ctx context.Context, url string, body interface{}) (*HTTPResponse, error) {
	return c.do(ctx, http.MethodPut, url, body)
}

// Delete 发送 DELETE 请求
func (c *HTTPClient) Delete(ctx context.Context, url string) (*HTTPResponse, error) {
	return c.do(ctx, http.MethodDelete, url, nil)
}

// Patch 发送 PATCH 请求
func (c *HTTPClient) Patch(ctx context.Context, url string, body interface{}) (*HTTPResponse, error) {
	return c.do(ctx, http.MethodPatch, url, body)
}
