# VSCode 调试配置说明

本项目已配置了完整的VSCode调试环境，支持前端和后端的独立调试以及全栈联合调试。

## 调试配置说明

### 可用调试配置

1. **Launch Frontend (Chrome)** - 在Chrome浏览器中启动前端应用
2. **Launch Frontend (Edge)** - 在Edge浏览器中启动前端应用
3. **Attach to Frontend** - 附加到已运行的前端应用进行调试
4. **Launch Go Backend** - 启动并调试Go后端API服务器
5. **Debug Go Backend** - 附加到已运行的Go进程进行调试
6. **Launch Full Stack** - 同时启动前端和后端的全栈调试

### 任务说明

- **frontend:dev** - 启动前端开发服务器 (Vite)
- **backend:build** - 构建Go后端应用
- **backend:run** - 直接运行Go后端应用
- **frontend:install-deps** - 安装前端依赖
- **backend:install-deps** - 下载Go模块依赖
- **fullstack:install-deps** - 安装完整项目依赖
- **frontend:test** - 运行前端测试
- **backend:test** - 运行后端测试
- **clean** - 清理构建产物和依赖文件夹

## 使用方法

### 1. 安装依赖（首次使用）
1. 在VSCode中按 `Ctrl+Shift+P` 打开命令面板
2. 运行任务: `Tasks: Run Task`
3. 选择 `fullstack:install-deps` 安装所有依赖

### 2. 启动调试

#### 方式一：使用调试面板
1. 点击侧边栏的调试图标或按 `Ctrl+Shift+D`
2. 在调试配置下拉菜单中选择想要的调试配置
3. 点击绿色播放按钮或按 `F5` 启动调试

#### 方式二：使用命令面板
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Debug: Select and Start Debugging`
3. 选择想要的调试配置

### 3. 全栈调试
选择 `Launch Full Stack` 配置将同时启动：
- 前端开发服务器 (http://localhost:3000)
- 后端API服务器 (http://localhost:8081)

## 项目结构

```
.vscode/
├── launch.json      # 调试配置
├── tasks.json       # 任务配置
├── settings.json    # 项目设置
├── extensions.json  # 推荐扩展
└── README.md        # 本说明文件
```

## 推荐扩展

打开项目时，VSCode会提示安装推荐的扩展，包括：
- Go语言支持
- TypeScript/JavaScript支持
- React开发工具
- 调试工具
- 代码质量工具

## 注意事项

1. 确保端口3000（前端）和8081（后端）没有被其他程序占用
2. 如遇到依赖问题，先运行对应的install-deps任务
3. Go后端需要正确配置环境变量和数据库连接
4. 前端开发服务器支持热重载，修改代码后会自动刷新

## 故障排除

如果遇到调试问题：
1. 检查终端输出中的错误信息
2. 确保所有依赖已正确安装
3. 检查端口是否被占用
4. 重启VSCode并重新加载窗口

## 快捷键

- `F5` - 启动调试
- `Ctrl+Shift+D` - 打开调试面板
- `Ctrl+Shift+P` - 打开命令面板

