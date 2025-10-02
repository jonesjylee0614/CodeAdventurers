# 代码奇兵 (Code Adventurers) - 文档中心

## 📚 文档导航

### 核心文档

- **[前端技术文档](./frontend/技术文档.md)** - 前端架构、组件库、开发指南
- **[后端 API 文档](./api/backend_endpoints.md)** - API 接口说明
- **[数据库设计](./api/database_schema_v3.sql)** - 数据库表结构

### 开发文档

- **[环境配置](./development/环境配置.md)** - 开发环境搭建指南
- **[开发与调试指南](./development/开发与调试指南.md)** - 开发流程和调试技巧
- **[设计方案](./development/设计方案.md)** - 系统设计和架构

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd CodeAdventurers
```

### 2. 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端将运行在 `http://localhost:3000`

### 3. 后端启动

```bash
cd backend
go run cmd/api/main.go
```

后端将运行在 `http://localhost:8080`

### 4. 数据库初始化

```bash
# 使用提供的 SQL 文件初始化数据库
mysql -u root -p < docs/api/mysql_init_v3.sql
```

---

## 📁 项目结构

```
CodeAdventurers/
├── frontend/           # 前端项目
│   ├── apps/          # 应用模块
│   │   ├── web/      # 主 Web 应用
│   │   ├── student/  # 学生端组件
│   │   └── teacher/  # 教师端组件
│   └── packages/      # 共享包
│       └── engine/   # 游戏引擎
│
├── backend/           # 后端项目
│   ├── cmd/          # 命令行入口
│   ├── internal/     # 内部包
│   │   ├── http/    # HTTP 处理
│   │   ├── service/ # 业务逻辑
│   │   ├── repo/    # 数据访问
│   │   └── platform/# 平台服务
│   └── migrations/  # 数据库迁移
│
└── docs/             # 文档
    ├── frontend/    # 前端文档
    ├── api/         # API 文档
    └── development/ # 开发文档
```

---

## 🎯 项目概述

**代码奇兵**是一个面向青少年的编程教育平台，通过游戏化的方式让学生学习编程概念。

### 核心功能

#### 🎮 学生端
- **游戏化学习**：通过闯关模式学习编程
- **积木编程**：可视化编程界面
- **成就系统**：收集徽章、解锁装扮
- **进度追踪**：实时查看学习进度

#### 👨‍🏫 教师端
- **班级管理**：创建班级、生成邀请码
- **作业布置**：布置关卡作业，设置截止时间
- **进度监控**：查看学生学习情况
- **数据分析**：学习数据统计和分析

#### 👨‍👩‍👧 家长端
- **进度查看**：查看孩子学习进度
- **学习报告**：周报和月报
- **成就展示**：查看孩子获得的成就

#### 🔧 管理端
- **用户管理**：管理所有用户
- **课程管理**：管理关卡和课程内容
- **运营管理**：系统配置和运营数据

---

## 🛠 技术栈

### 前端
- **React 18** + **TypeScript** + **Vite**
- **React Router v6** - 路由管理
- **Zustand** - 状态管理
- **CSS Modules** - 样式管理

### 后端
- **Go 1.21+** - 后端语言
- **Gin** - Web 框架
- **GORM** - ORM 框架
- **MySQL** - 数据库
- **Redis** - 缓存

---

## 📝 开发规范

### 前端规范

1. **文件命名**
   - 组件：PascalCase（如 `HomePage.tsx`）
   - 样式：kebab-case（如 `home-page.css`）
   - 工具：camelCase（如 `utils.ts`）

2. **组件编写**
   - 使用函数组件和 Hooks
   - TypeScript 类型定义
   - Props 解构

3. **代码风格**
   - 使用 ESLint 和 Prettier
   - 遵循 React 最佳实践

### 后端规范

1. **目录结构**
   - `cmd/` - 入口文件
   - `internal/` - 内部包
   - `pkg/` - 可导出包

2. **命名规范**
   - 包名：小写单词
   - 文件名：snake_case
   - 函数名：CamelCase

3. **代码风格**
   - 使用 gofmt 格式化
   - 遵循 Go 最佳实践

---

## 🧪 测试

### 前端测试

```bash
cd frontend
npm test                # 运行所有测试
npm test -- --watch     # 监听模式
npm test -- --coverage  # 测试覆盖率
```

### 后端测试

```bash
cd backend
go test ./...           # 运行所有测试
go test -v ./...        # 详细输出
go test -cover ./...    # 测试覆盖率
```

---

## 🐛 调试

### 前端调试

1. **浏览器 DevTools**
   - 使用 React DevTools 查看组件
   - 使用 Console 查看日志
   - 使用 Network 查看请求

2. **VS Code 调试**
   - 配置 launch.json
   - 断点调试

### 后端调试

1. **日志调试**
   - 使用 logger 记录关键信息
   - 查看控制台输出

2. **Delve 调试**
   ```bash
   dlv debug cmd/api/main.go
   ```

---

## 🔄 Git 工作流

1. **分支策略**
   - `main` - 主分支，稳定版本
   - `develop` - 开发分支
   - `feature/*` - 功能分支
   - `bugfix/*` - 修复分支

2. **提交规范**
   ```
   feat: 新功能
   fix: 修复问题
   docs: 文档更新
   style: 代码格式
   refactor: 重构
   test: 测试
   chore: 构建/工具
   ```

3. **工作流程**
   ```bash
   git checkout -b feature/new-feature
   git add .
   git commit -m "feat: 添加新功能"
   git push origin feature/new-feature
   # 创建 Pull Request
   ```

---

## 📦 部署

### 前端部署

```bash
cd frontend
npm run build
# 将 dist/ 目录部署到静态服务器
```

### 后端部署

```bash
cd backend
go build -o bin/api cmd/api/main.go
# 运行二进制文件
./bin/api
```

---

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证。

---

## 📞 联系我们

如有问题或建议，请通过以下方式联系：

- 项目仓库：[GitHub](https://github.com/your-org/code-adventurers)
- 邮箱：support@code-adventurers.com

---

## 🎓 学习资源

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Go 官方文档](https://go.dev/doc/)
- [Gin 框架文档](https://gin-gonic.com/)

---

**祝你编程愉快！🚀**
