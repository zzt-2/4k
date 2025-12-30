# Vue + Electron 桌面应用 LLM Agent 开发流程

## 概述

本文档描述使用 LLM Agent 开发 Vue + Electron 桌面应用的标准化流程。每个阶段新开会话，确保上下文清晰、依赖明确。

---

## 第一阶段：数据模型与类型定义

**输入**：

- 产品功能列表/需求文档
- 项目初始化配置（`docs/templates/main-process-init.md`）

**输出**：

- `electron/types/*.types.ts` - 实体接口、DTO、枚举定义
- `electron/types/ipc.types.ts` - IPC 通道枚举与公共类型

**要点**：

- TypeScript 接口/类型定义
- Electron IPC 通道定义与事件类型
- 本地存储/数据库 schema（Prisma / electron-store）
- 枚举类型与常量定义

---

## 第二阶段：主进程文档生成

**输入**：

- 产品功能列表
- 第一阶段产物（类型定义文件）
- 主进程文档模板（`docs/templates/main-process-template.md`）

**输出**：

- `docs/modules/[module]-main.md` - 每个模块的主进程设计文档

**要点**：

- IPC 通信接口设计
- 系统原生功能调用（托盘、菜单、快捷键、通知等）
- 窗口管理逻辑（多窗口、窗口状态持久化）
- 文件系统操作
- 本地数据库操作
- 错误处理与日志记录策略

---

## 第三阶段：渲染进程文档生成

**输入**：

- 第二阶段产物（主进程设计文档）
- UI/UX 设计稿（如有）
- 渲染进程文档模板（`docs/templates/renderer-process-template.md`）

**输出**：

- `docs/modules/[module]-renderer.md` - 每个模块的渲染进程设计文档

**要点**：

- 页面/视图结构与路由设计
- 组件层级与复用策略
- 状态管理方案（Pinia Store 或 Manager）
- Composables 设计
- IPC 调用封装与错误处理
- 用户交互流程

---

## 第四阶段：主进程代码生成

分两步生成主进程代码：

### 第一步：基础架构

**输入**：

- 第二阶段产物（主进程设计文档）
- 代码生成规范（`docs/templates/main-process-codegen.md`）

**输出**：

- `electron/types/[module].types.ts` - 模块类型定义
- `electron/preload/modules/[module].ts` - Preload API
- `prisma/schema.prisma` - Prisma Schema 更新

**要点**：

- 类型定义文件
- IPC 通道枚举与常量
- preload 脚本（contextBridge 暴露的 API）
- Prisma Schema 模型定义

### 第二步：业务逻辑

**输入**：

- 第四阶段第一步产物
- 第二阶段产物（主进程设计文档）
- 代码生成规范（`docs/templates/main-process-codegen.md`）

**输出**：

- `electron/main/services/[module].service.ts`
- `electron/main/ipc/[module].handler.ts`
- 更新 `electron/main/ipc/index.ts`（注册 handler）
- 更新 `electron/preload/index.ts`（暴露 API）

**要点**：

- Service 层逻辑（直接调用 Prisma Client）
- IPC Handler 实现
- 入口文件注册

**验证**：自行验证编译通过，不通过 LLM 验证。

---

## 第五阶段：渲染进程代码生成

**输入**：

- 第三阶段产物（渲染进程设计文档）
- 第四阶段产物（Preload API 定义）
- 渲染进程代码生成规范（`docs/templates/renderer-process-codegen.md`）

**输出**：

- `src/modules/[module]/pages/*.vue` - 页面组件
- `src/modules/[module]/components/*.vue` - 模块内组件
- `src/modules/[module]/composables/*.ts` - 组合式函数
- `src/modules/[module]/types.ts` - 模块类型定义
- `src/core/stores/[module]-store.ts` - Pinia Store（或 Manager）
- 路由配置更新

**要点**：

- Vue 组件（`<script setup>` 语法）
- Composables（`useXxxList`、`useXxxForm`、`useXxxActions`）
- 状态管理（Pinia Setup Store 或 Manager 依赖注入）
- IPC 调用封装与错误处理
- 路由配置
- 加载/错误/空状态处理

---

## 关键原则

| 原则     | 说明                                  |
| -------- | ------------------------------------- |
| 会话隔离 | 每个阶段新开会话，避免上下文污染      |
| 依赖顺序 | 类型定义 → 文档 → 基础代码 → 业务代码 |
| 单向引用 | 后续阶段引用前置阶段产物，不回溯修改  |
| 自行验证 | 业务代码生成后由开发者验证，而非 LLM  |
| 安全优先 | 遵循 Electron 安全最佳实践            |

---

## 输出规范

- 永远使用中文输出
- 注释从整体角度考虑，不解释本次变更
- 不过量添加注释
- 不使用 emoji
- 不考虑后续序号，只管当前部分

---

## 安全检查清单

生成代码时需确保：

- [ ] contextIsolation 已启用
- [ ] nodeIntegration 已禁用
- [ ] preload 脚本使用 contextBridge
- [ ] IPC 通信有输入验证
- [ ] 远程内容加载有 CSP 限制
- [ ] 敏感数据有加密存储

---

## 文件结构参考

```
project/
├── prisma/
│   └── schema.prisma   # Prisma Schema 定义
├── electron/
│   ├── main/           # 主进程代码
│   │   ├── index.ts
│   │   ├── ipc/        # IPC handlers
│   │   ├── services/   # 业务服务（使用 Prisma Client）
│   │   ├── prisma/     # Prisma 客户端封装
│   │   │   └── client.ts
│   │   └── utils/      # 工具函数
│   ├── preload/        # preload 脚本
│   │   ├── index.ts
│   │   └── modules/
│   └── types/          # 共享类型定义
├── src/
│   ├── components/     # 通用组件
│   ├── composables/    # 组合式函数
│   ├── layouts/        # 布局组件
│   ├── modules/        # 业务模块
│   │   └── [module]/
│   │       ├── pages/
│   │       ├── components/
│   │       └── composables/
│   ├── stores/         # Pinia stores
│   ├── styles/         # 全局样式
│   └── router/         # 路由配置
├── resources/          # 静态资源（图标等）
├── tests/              # 测试文件
│   ├── unit/
│   └── e2e/
└── docs/               # 项目文档
    ├── modules/        # 模块设计文档
    └── templates/      # 文档模板
```
