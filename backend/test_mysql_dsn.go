package main

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// 测试不同的 DSN 格式
	dsns := []string{
		"root:Jz%40szM982io@tcp(localhost:3306)/code_adventurers?parseTime=true&charset=utf8mb4",
		"root:Jz@szM982io@tcp(localhost:3306)/code_adventurers?parseTime=true&charset=utf8mb4",
		"mysql://root:Jz%40szM982io@tcp(localhost:3306)/code_adventurers?parseTime=true&charset=utf8mb4",
		"mysql://root:Jz@szM982io@tcp(localhost:3306)/code_adventurers?parseTime=true&charset=utf8mb4",
	}

	for i, dsn := range dsns {
		fmt.Printf("\n测试 DSN %d: %s\n", i+1, dsn)

		db, err := sql.Open("mysql", dsn)
		if err != nil {
			fmt.Printf("连接失败: %v\n", err)
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		if err := db.PingContext(ctx); err != nil {
			fmt.Printf("Ping 失败: %v\n", err)
		} else {
			fmt.Printf("连接成功!\n")

			// 测试一个简单的查询
			var version string
			err = db.QueryRowContext(ctx, "SELECT VERSION()").Scan(&version)
			if err != nil {
				fmt.Printf("查询失败: %v\n", err)
			} else {
				fmt.Printf("MySQL 版本: %s\n", version)
			}

			db.Close()
			return
		}
		db.Close()
	}

	fmt.Println("\n所有连接都失败了。可能的问题:")
	fmt.Println("1. 密码中的特殊字符需要正确处理")
	fmt.Println("2. MySQL 用户权限问题")
	fmt.Println("3. 数据库不存在或访问被拒绝")
}
