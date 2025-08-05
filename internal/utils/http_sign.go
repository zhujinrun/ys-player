package utils

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	// "net/url"
	"time"
)

// MD5 返回输入字符串的 32 位小写 MD5 十六进制值。
func MD5(s string) string {
	h := md5.Sum([]byte(s))
	return hex.EncodeToString(h[:])
}

// nodejs: 根据关键词生成带时间签名的解析接口 URL
// 	
// 	const md5 = require('md5');
//	
// 	let keyword = '朝雪录';
//	
// 	const nowBJ = new Date(Date.now() + 8 * 3600_000); // 北京时间
// 	let zSign = nowBJ.getDate() + 9 + 9 ^ 10;          // 简单混淆
// 	zSign = md5(String(zSign)).slice(0, 10);
// 	zSign = md5(zSign);                                // 两次 md5
// 	const s1ig = nowBJ.getDay() + 11397;               // 固定偏移
// 	let apiUrl = `https://m1-a1.cloud.nnpp.vip:2223/api/v/?z=${zSign}&jx=${encodeURIComponent(keyword)}&s1ig=${s1ig}`;
//	
// 	console.log(apiUrl);
//

// BuildApiURL 根据关键词生成带时间签名的解析接口 URL
//
// 参数
//   keyword - 影片名称
//
// 返回值
//   完整的 API 请求地址，形如："https://m1-a1.cloud.nnpp.vip:2223/api/v/?z=...&jx=...&s1ig=..."
//
// 示例
//   url := BuildApiURL("朝雪录")
// func buildApiURL(keyword string) string {
// 	z, s1ig := buildSignature()
// 	base := "https://m1-a1.cloud.nnpp.vip:2223/api/v/"
// 	return fmt.Sprintf("%s?z=%s&jx=%s&s1ig=%d", base, z, url.QueryEscape(keyword), s1ig)
// }

// buildSignature 构建签名
//
// 返回值：
//   签名字符串,
// 示例：
//   z, s1ig := buildSignature()
func BuildSignature() (z string, s1ig int) {
	loc, _ := time.LoadLocation("Asia/Shanghai")
	nowBJ := time.Now().In(loc)

	// 1. 整数运算
	day := nowBJ.Day()
	zVal := (day + 9 + 9) ^ 10

	// 2. 两次 MD5（都是字符串）
	first := MD5(fmt.Sprintf("%d", zVal))[:10]

	z = MD5(first)
	s1ig = int(nowBJ.Weekday()) + 11397

	return
}