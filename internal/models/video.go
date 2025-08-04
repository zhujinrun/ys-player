package models

// Episode 表示一集视频的信息
type Episode struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

// Source 表示视频源信息
type Source struct {
	Eps []Episode `json:"eps,omitempty"`
}

// VideoItem 表示单个视频项
type VideoItem struct {
	Name   string `json:"name"`
	Year   string `json:"year"`
	Source Source `json:"source"`
}

// VideoResponse 表示视频源API的响应
type VideoResponse struct {
	Type string      `json:"type"`           // "tv" 或 "movie" 或 "home"
	Data []VideoItem `json:"data,omitempty"` // 用于 tv 和 movie 类型
	New  []VideoItem `json:"new,omitempty"`  // 用于 home 类型
	Hot  []VideoItem `json:"hot,omitempty"`  // 用于 home 类型
	Ep   string      `json:"ep,omitempty"`
	Y    []string    `json:"y"`
	Sp   int         `json:"sp,omitempty"`
	P    string      `json:"p,omitempty"`
}
