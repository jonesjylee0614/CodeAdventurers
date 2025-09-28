package main

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// 测试不同的连接配置
	configs := []string{
		"root:Jz@szM982io@tcp(localhost:3306)/code_adventurers?parseTime=true&charset=utf8mb4",
		"root:@tcp(localhost:3306)/code_adventurers?parseTime=true&charset=utf8mb4",
		"root:root@tcp(localhost:3306)/mysql?parseTime=true&charset=utf8mb4",
		"root:@tcp(localhost:3306)/mysql?parseTime=true&charset=utf8mb4",
	}

	for i, dsn := range configs {
		fmt.Printf("测试连接 %d: %s\n", i+1, dsn)

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

			// 检查数据库是否存在
			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'code_adventurers'").Scan(&count)
			if err != nil {
				fmt.Printf("检查数据库失败: %v\n", err)
			} else if count == 0 {
				fmt.Printf("数据库 'code_adventurers' 不存在\n")
				// 尝试创建数据库
				_, err = db.Exec("CREATE DATABASE IF NOT EXISTS code_adventurers CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci")
				if err != nil {
					fmt.Printf("创建数据库失败: %v\n", err)
				} else {
					fmt.Printf("数据库创建成功\n")
				}
			} else {
				fmt.Printf("数据库 'code_adventurers' 存在\n")
			}

			db.Close()
			return
		}
		db.Close()
	}

	fmt.Println("所有连接都失败了。请检查:")
	fmt.Println("1. MySQL 是否正确安装和运行")
	fmt.Println("2. 端口 3306 是否正确配置")
	fmt.Println("3. root 用户密码是否正确")
}
