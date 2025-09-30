# 后端接口梳理

下表基于 `backend/internal/http/router/router.go` 中注册的路由以及各 Handler 的实现，总结了当前 Go 后端暴露的 HTTP 与 WebSocket 接口：

| 模块 | 方法 | 路径 | 说明 |
| ---- | ---- | ---- | ---- |
| 健康检查 | GET | `/healthz` | 进程存活检查，返回基础状态信息。 |
| 健康检查 | GET | `/readyz` | 依赖检查，返回依赖健康状态。 |
| 监控 | GET | `${Telemetry.MetricsPath}` | Prometheus 指标采集端点，路径由配置决定。 |
| 认证 | POST | `/api/auth/guest` | 游客体验登录，接受可选昵称，返回访客用户信息。 |
| 认证 | POST | `/api/auth/class` | 学生通过班级邀请码加入课堂，返回学生用户信息。 |
| 认证 | POST | `/api/auth/login` | 教师/家长等凭证登录，返回对应角色的用户档案。 |
| 学生 | GET | `/api/student/profile` | 获取当前学生档案、装扮、成就与进度映射。 |
| 学生 | GET | `/api/student/map` | 获取学生地图概要信息（章节、关卡状态、奖励）。 |
| 学生 | GET | `/api/student/levels/:id` | 获取指定关卡详情及个人进度。 |
| 学生 | GET | `/api/student/levels/:id/prep` | 获取指定关卡的准备数据（目标、可用积木、漫画等）。 |
| 学生 | POST | `/api/student/levels/:id/run` | 运行积木程序，返回模拟结果日志。 |
| 学生 | POST | `/api/student/levels/:id/complete` | 记录关卡完成情况并解锁奖励。 |
| 学生 | POST | `/api/student/levels/:id/sandbox` | 在沙盒模式下运行程序，不影响正式进度。 |
| 学生 | POST | `/api/student/hints/:id` | 根据失败次数和错误类型返回渐进提示。 |
| 学生 | GET | `/api/student/settings` | 获取学生偏好设置（音量、低动效等）。 |
| 学生 | PUT | `/api/student/settings` | 更新学生偏好设置。 |
| 学生 | POST | `/api/student/settings/reset-progress` | 重置全部关卡进度及奖励。 |
| 学生 | GET | `/api/student/avatar` | 获取学生当前装扮状态。 |
| 学生 | PUT | `/api/student/avatar` | 装备新的装扮（需已解锁）。 |
| 教师 | GET | `/api/teacher/analytics/*resource` | 获取教师分析数据，`*resource` 支持子路径透传。 |
| 实时 | GET | `/api/student/run/stream` | WebSocket 流，推送运行状态。 |

> 说明：除上述接口外，`backend/api/openapi.yaml` 同步维护了 OpenAPI 规范，供前端或第三方集成参考。
