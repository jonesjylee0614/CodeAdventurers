package main

import (
	"fmt"
	"strings"

	"github.com/go-sql-driver/mysql"
)

func main() {
	// 原始 DSN
	originalDSN := "mysql://root:Jz%40szM982io@tcp(localhost:3306)/code_adventurers?parseTime=true&charset=utf8mb4"

	fmt.Printf("原始 DSN: %s\n", originalDSN)

	// 模拟 storage/mysql.go 中的处理逻辑
	dsn := originalDSN
	if strings.HasPrefix(dsn, "mysql://") {
		parsed, err := mysql.ParseDSN(strings.TrimPrefix(dsn, "mysql://"))
		if err != nil {
			fmt.Printf("解析失败: %v\n", err)
			return
		}
		dsn = parsed.FormatDSN()
	}

	fmt.Printf("转换后 DSN: %s\n", dsn)
}
