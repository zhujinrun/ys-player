package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Config struct {
	Server ServerConfig `json:"server"`
}

type ServerConfig struct {
	Port int    `json:"port"`
	Mode string `json:"mode"`
}

var GlobalConfig Config

// LoadConfig 从指定路径加载配置文件
func LoadConfig(configPath string) error {
	// 获取配置文件的绝对路径
	absPath, err := filepath.Abs(configPath)
	if err != nil {
		return err
	}

	// 检查文件是否存在
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		// 文件不存在，直接返回，使用默认配置
		GlobalConfig = Config{
			Server: ServerConfig{
				Port: 8080,
				Mode: "release",
			},
		}
		return nil
	} else if err != nil {
		// 其他错误
		return err
	}

	// 读取配置文件
	file, err := os.ReadFile(absPath)
	if err != nil {
		return err
	}

	// 解析 JSON 配置到结构体
	if err := json.Unmarshal(file, &GlobalConfig); err != nil {
		return err
	}

	return nil
}
