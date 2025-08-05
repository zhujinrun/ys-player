# YS Player

这是一个基于 Go 和 Gin 框架开发的项目。

## 项目结构

```
ys-player/
├── api/          # API 处理器和路由
├── configs/      # 配置文件
├── internal/     # 内部包
├── main.go      # 主程序入口
└── go.mod       # Go 模块文件
```

## 运行项目

1. 确保已安装 Go 1.16 或更高版本
2. 克隆项目
3. 运行项目：
   ```bash
   go run main.go
   ```
4. 访问测试接口：
   ```
   http://localhost:8080/ping
   ```

## 开发

- 项目使用 Go 模块进行依赖管理
- 使用 Gin 框架作为 Web 服务器
- [Vip视频在线解析](https://tv.wandhi.com/go.html)

## 发布

项目使用 Go 语言开发，因此可以使用 Go 的标准工具进行编译和打包。

* -s：去掉符号表
* -w：去掉 DWARF 调试信息
* -9：为最高压缩率

```bash
go build -o release/ys-player.exe

go build -ldflags="-s -w" -o release/ys-player-mini.exe

upx.exe -9 release/ys-player-mini.exe

go build -ldflags="-s -w" -o release/ys-player-mini.exe && upx.exe -9 release/ys-player-mini.exe
```