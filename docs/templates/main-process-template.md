# Electron 主进程模块设计文档模板

本模板用于描述单个主进程业务模块的设计，供 LLM Agent 生成代码使用。

前置依赖：项目初始化配置已完成（参见 `main-process-init.md`）

---

## [模块名称]

> 模块简短描述（一句话）

### 1. 模块概述

#### 1.1 功能说明

简要描述模块的核心功能和使用场景。

#### 1.2 文件清单

| 类型        | 文件路径                                     |
| ----------- | -------------------------------------------- |
| 类型定义    | `electron/types/[module].types.ts`           |
| 服务层      | `electron/main/services/[module].service.ts` |
| IPC Handler | `electron/main/ipc/[module].handler.ts`      |
| Preload API | `electron/preload/modules/[module].ts`       |
| Prisma 模型 | `prisma/schema.prisma`                       |

---

### 2. IPC 通道定义

#### 2.1 通道枚举

```typescript
enum [Module]Channel {
  GET_LIST = '[module]:get-list',
  GET_BY_ID = '[module]:get-by-id',
  CREATE = '[module]:create',
  UPDATE = '[module]:update',
  DELETE = '[module]:delete',
  CHANGED = '[module]:changed',
}
```

#### 2.2 通道清单

| 通道名称             | 调用方式 | 参数类型         | 返回类型       | 说明         |
| -------------------- | -------- | ---------------- | -------------- | ------------ |
| `[module]:get-list`  | invoke   | `ListQuery`      | `Page<Entity>` | 分页查询     |
| `[module]:get-by-id` | invoke   | `{ id: string }` | `Entity`       | 获取详情     |
| `[module]:create`    | invoke   | `CreateDTO`      | `Entity`       | 创建记录     |
| `[module]:update`    | invoke   | `UpdateDTO`      | `Entity`       | 更新记录     |
| `[module]:delete`    | invoke   | `{ id: string }` | `void`         | 删除记录     |
| `[module]:changed`   | on       | -                | `Entity`       | 数据变更事件 |

---

### 3. 类型定义

#### 3.1 实体类型

```typescript
interface [Entity] extends BaseEntity {
  // 业务字段
  name: string
  status: EntityStatus
  // ...其他字段
}
```

#### 3.2 枚举类型

```typescript
enum EntityStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
}
```

#### 3.3 DTO 类型

| DTO 名称    | 用途     | 定义方式                                           |
| ----------- | -------- | -------------------------------------------------- |
| `CreateDTO` | 创建参数 | `Omit<Entity, 'id' \| 'createdAt' \| 'updatedAt'>` |
| `UpdateDTO` | 更新参数 | `Partial<CreateDTO> & { id: string }`              |

---

### 4. Prisma 数据模型

#### 4.1 Schema 定义

```prisma
model [Model] {
  id        String   @id @default(cuid())
  name      String
  status    Status   @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("[table_name]")
}

enum Status {
  ACTIVE
  INACTIVE
}
```

#### 4.2 字段映射

| 实体字段    | Prisma 字段 | 类型     | 说明     |
| ----------- | ----------- | -------- | -------- |
| `id`        | `id`        | String   | 主键     |
| `name`      | `name`      | String   | 名称     |
| `status`    | `status`    | Status   | 状态枚举 |
| `createdAt` | `createdAt` | DateTime | 创建时间 |
| `updatedAt` | `updatedAt` | DateTime | 更新时间 |

---

### 5. 服务层方法

| 方法      | 参数        | 返回值         | 事务 | 说明                   |
| --------- | ----------- | -------------- | ---- | ---------------------- |
| `getList` | `ListQuery` | `Page<Entity>` | 否   | 分页，支持关键字       |
| `getById` | `id`        | `Entity`       | 否   | 不存在抛 NotFoundError |
| `create`  | `CreateDTO` | `Entity`       | 是   | Prisma 自动易管理事务  |
| `update`  | `UpdateDTO` | `Entity`       | 是   | Prisma 自动管理事务    |
| `delete`  | `id`        | `void`         | 是   | Prisma 自动管理事务    |

---

### 6. Preload API

| 方法名      | 参数        | 返回值                  | 说明     |
| ----------- | ----------- | ----------------------- | -------- |
| `getList`   | `ListQuery` | `Promise<Page<Entity>>` | 分页列表 |
| `getById`   | `string`    | `Promise<Entity>`       | 详情     |
| `create`    | `CreateDTO` | `Promise<Entity>`       | 创建     |
| `update`    | `UpdateDTO` | `Promise<Entity>`       | 更新     |
| `delete`    | `string`    | `Promise<void>`         | 删除     |
| `onChanged` | `callback`  | `() => void`            | 监听变更 |

---

### 7. 特殊逻辑（如有）

描述模块的特殊业务逻辑、关联关系、级联操作等：

- **关联查询**：是否需要 join 其他表
- **级联删除**：删除时是否需要处理关联数据
- **唯一约束**：哪些字段需要唯一性校验
- **默认值**：创建时的默认值逻辑
- **状态机**：状态变更的规则限制

---

### 8. 事件广播

| 事件               | 触发时机             | 数据                                   |
| ------------------ | -------------------- | -------------------------------------- |
| `[module]:changed` | 创建/更新/删除成功后 | 变更后的实体或 `{ id, deleted: true }` |

---

## 模板使用说明

### 填写要点

1. **模块命名**：使用小写单词，如 `user`、`device-config`
2. **实体字段**：列出所有业务字段及其类型
3. **枚举定义**：明确状态等枚举的所有可选值
4. **特殊逻辑**：描述非 CRUD 的业务规则

### 可选章节

以下章节根据模块复杂度选择性填写：

- **7. 特殊逻辑**：简单 CRUD 模块可省略
- **8. 事件广播**：不需要实时同步可省略
