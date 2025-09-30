# CodeAdventurers (编程冒险家)

> 一个面向青少年的可视化编程学习平台

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-1.23+-00ADD8.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/react-18.3-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.5+-3178C6.svg)](https://www.typescriptlang.org/)

---

## 📖 项目简介

CodeAdventurers 是一个创新的编程教育平台，通过游戏化的方式让学生学习编程概念。该项目采用现代Web技术栈，提供了完整的学生学习、教师管理、家长监督和系统管理功能。

### ✨ 核心特色

- 🎮 **游戏化学习** - 通过闯关模式学习编程
- 🧩 **可视化编程** - 拖拽积木式编程界面
- 📊 **学习分析** - 详细的进度追踪和数据分析
- 👥 **多角色支持** - 学生、教师、家长、管理员
- 🎨 **现代UI设计** - 响应式设计，美观易用
- ⚡ **高性能** - Go后端 + React前端，快速响应

---

## 🚀 快速开始

### 环境要求

**后端**:
- Go 1.23+
- MySQL 8.0+
- Redis 7.0+ (可选)

**前端**:
- Node.js 18+
- pnpm 或 npm

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/your-org/CodeAdventurers.git
cd CodeAdventurers
```

#### 2. 启动后端

```bash
cd backend

# 配置环境变量（可选，有默认值）
# cp .env.example .env

# 安装依赖（如有go.mod）
go mod download

# 运行服务
go run cmd/api/main.go
```

后端服务将在 `http://localhost:8081` 启动

#### 3. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install
# 或使用 npm
npm install

# 启动开发服务器
pnpm dev
# 或使用 npm
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

#### 4. 访问应用

打开浏览器访问 `http://localhost:3000`

**测试账号**:
- 教师账号: `teacher-1` / `teach123`
- 家长账号: `parent-1` / `parent123`
- 学生: 使用班级邀请码或游客模式

---

## 📚 文档

### 重要文档

- **[项目进度与状态](./docs/项目进度与状态.md)** ⭐ - 项目当前状态和功能清单
- **[开发与调试指南](./docs/开发与调试指南.md)** - 开发环境配置和调试技巧
- **[设计方案](./docs/设计方案.md)** - 系统架构和设计文档
- **[API文档](./docs/backend_endpoints.md)** - 后端API接口文档
- **[数据库Schema](./docs/database_schema_v3.sql)** - 数据库结构文档

### 更多文档

查看 **[docs/README.md](./docs/README.md)** 了解完整的文档目录和导航

---

## 🏗️ 技术架构

### 项目结构

```
CodeAdventurers/
├── backend/                 # Go后端服务
│   ├── cmd/api/            # 程序入口
│   ├── internal/           # 内部代码
│   │   ├── http/          # HTTP处理层
│   │   ├── service/       # 业务逻辑层
│   │   ├── repo/          # 数据访问层
│   │   └── platform/      # 基础设施
│   └── migrations/         # 数据库迁移
├── frontend/               # React前端应用
│   ├── apps/              # 应用程序
│   │   └── web/          # 主Web应用
│   │       └── src/
│   │           ├── app/           # 应用层
│   │           ├── components/    # UI组件
│   │           ├── services/      # API服务
│   │           └── store/         # 状态管理
│   └── packages/          # 共享包
│       └── engine/       # 游戏引擎
├── database/              # 数据库脚本
│   └── init/             # 初始化脚本
├── docs/                  # 项目文档
└── levels/                # 示例关卡数据
```

### 技术栈

#### 后端
- **框架**: Go + Gin
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.0
- **ORM**: sqlc (类型安全的SQL生成)
- **任务队列**: asynq
- **日志**: zap
- **配置**: viper
- **WebSocket**: nhooyr.io/websocket

#### 前端
- **框架**: React 18
- **语言**: TypeScript 5.5+
- **状态管理**: Zustand
- **路由**: React Router 6
- **构建工具**: Vite
- **UI**: 自定义组件库
- **测试**: Jest + Testing Library

#### 游戏引擎
- **渲染**: HTML5 Canvas API
- **编程界面**: 自定义拖拽系统
- **关卡数据**: JSON格式

---

## 🎯 功能概览

### ✅ 已实现功能（~75%）

#### 学生端 (90%)
- ✅ 游客登录和班级加入
- ✅ 章节地图和关卡列表
- ✅ 可视化编程界面（BlockEditor）
- ✅ 游戏场景渲染（GameCanvas）
- ✅ 关卡挑战和完成
- ✅ 成就系统和装扮收集
- ✅ 学习进度跟踪
- ✅ 智能提示系统

#### 教师端 (85%)
- ✅ 教师登录
- ✅ 班级管理
- ✅ 学生进度查看
- ✅ 教学分析报告
- ✅ 课程内容管理
- ✅ 作业布置和审核
- ✅ 关卡编辑器

#### 家长端 (80%)
- ✅ 家长登录
- ✅ 孩子进度查看
- ✅ 学习周报
- ✅ 提醒设置

#### 管理端 (30%)
- ⚠️ 基础布局（占位）
- ⏳ 用户管理（待开发）
- ⏳ 课程管理（待开发）
- ⏳ 运营配置（待开发）

#### 后端API (85%)
- ✅ 认证系统
- ✅ 学生端所有API
- ✅ 教师端所有API
- ✅ 家长端所有API
- ⏳ 管理端API（待开发）

#### 数据库 (100%)
- ✅ v3.0 Schema设计
- ✅ 关系型数据结构
- ✅ Repository层实现
- ✅ 数据迁移脚本

### ⏳ 待开发功能

- 管理端完整功能
- 移动端适配
- 离线模式
- 多语言支持
- 更多关卡内容
- 社交功能（作品分享）
- AI智能提示系统

详细的功能清单请查看 **[项目进度与状态](./docs/项目进度与状态.md)**

---

## 🧪 测试

```bash
# 前端测试
cd frontend
pnpm test

# 后端测试
cd backend
go test ./...
```

---

## 📊 项目状态

**当前版本**: v0.9.0 (Beta)  
**整体完成度**: ~75%

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 后端API | 85% | ✅ 核心功能完成 |
| 前端UI | 80% | ✅ 主要页面完成 |
| 数据库 | 100% | ✅ Schema完成 |
| 游戏引擎 | 100% | ✅ 功能完整 |
| 文档 | 90% | ✅ 核心文档齐全 |
| 测试 | 40% | ⚠️ 需要补充 |

**最近更新** (2025-09-30):
- ✅ 修复学生端无限循环问题
- ✅ 修复登录窗体错误
- ✅ 修复关卡跳转问题
- ✅ 重新组织项目文档

查看 **[已修复问题记录](./docs/已修复问题记录-2025-09-30.md)** 了解详情

---

## 🎓 教育价值

### 编程概念覆盖

1. **顺序结构** - 基本指令执行
2. **循环结构** - 重复积木
3. **条件判断** - if-else逻辑
4. **调试思维** - 错误分析和修正
5. **算法优化** - 追求最优解

### 学习闭环设计

```
目标设定 → 实践操作 → 即时反馈 → 渐进提示 → 成就激励
```

---

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- **Go**: 遵循 `gofmt` 和 `golint` 规范
- **TypeScript**: 遵循项目 ESLint 配置
- **提交信息**: 使用清晰的提交信息描述变更

### 报告问题

在 Issues 中报告问题时，请包含：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（OS、浏览器、版本等）

---

## 📜 License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

特别感谢:
- React 团队 - 优秀的前端框架
- Go 团队 - 高性能的后端语言
- 所有开源项目的贡献者

---

## 📞 联系我们

- **项目主页**: https://github.com/your-org/CodeAdventurers
- **问题反馈**: https://github.com/your-org/CodeAdventurers/issues
- **文档中心**: [docs/README.md](./docs/README.md)

---

## 🗺️ 开发路线图

### 短期目标 (1-2周)
- [x] 修复前端死循环问题
- [x] 修复关卡跳转问题
- [ ] 完成管理端基础功能
- [ ] 补充单元测试

### 中期目标 (1-2个月)
- [ ] 更多关卡内容
- [ ] 移动端适配
- [ ] 性能优化
- [ ] 社交功能

### 长期愿景 (3-6个月)
- [ ] AI智能提示系统
- [ ] 多语言支持
- [ ] 教师培训体系
- [ ] 开源社区建设

---

<p align="center">
  Made with ❤️ by CodeAdventurers Team
</p>

<p align="center">
  <sub>让编程学习变得有趣而有效</sub>
</p>
