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
	Port      int    `json:"port"`
	PlayerUrl string `json:"player_url"`
	Mode      string `json:"mode"`
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
		// 文件不存在，使用默认配置
		GlobalConfig = Config{
			Server: ServerConfig{
				Port:      8080,
				PlayerUrl: "https://m3u8player.org/player.html?url=",
				Mode:      "release",
			},
		}
		// 并且将默认配置保存到文件中
		if saveErr := saveConfig(absPath, GlobalConfig); saveErr != nil {
			return saveErr
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

// saveConfig 将配置保存到指定路径
func saveConfig(path string, config Config) error {
	// 确保目录存在
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// 将配置序列化为JSON
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	// 写入文件
	return os.WriteFile(path, data, 0644)
}
