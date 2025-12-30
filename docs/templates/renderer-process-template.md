# Electron 渲染进程模块设计文档模板

本模板用于描述单个渲染进程业务模块的设计，供 LLM Agent 生成代码使用。

前置依赖：

- 主进程模块已完成（参见对应的 `[module]-main.md`）
- Preload API 已定义

---

## [模块名称]

> 模块简短描述（一句话）

### 1. 模块概述

#### 1.1 功能说明

简要描述模块的核心功能和用户场景。

#### 1.2 文件清单

| 类型        | 文件路径                                |
| ----------- | --------------------------------------- |
| 页面组件    | `src/modules/[module]/pages/*.vue`      |
| 模块组件    | `src/modules/[module]/components/*.vue` |
| Composables | `src/modules/[module]/composables/*.ts` |
| Store       | `src/core/stores/[module]-store.ts`     |
| Manager     | `src/core/stores/[module]-manager.ts`   |
| 类型定义    | `src/modules/[module]/types.ts`         |
| 路由配置    | `src/router/routes.ts`（修改）          |

---

### 2. 路由配置

#### 2.1 路由定义

| 配置     | 值                             |
| -------- | ------------------------------ |
| 路由路径 | `/[module]`                    |
| 组件路径 | `modules/[module]/pages/index` |
| 路由名称 | `[Module]`                     |

#### 2.2 子路由（如有）

| 路由路径             | 组件           | 说明   |
| -------------------- | -------------- | ------ |
| `/[module]`          | `index.vue`    | 列表页 |
| `/[module]/:id`      | `detail.vue`   | 详情页 |
| `/[module]/settings` | `settings.vue` | 设置页 |

---

### 3. 页面设计

#### 3.1 页面布局

使用 ASCII 图描述页面整体布局：

```
┌────────────────────────────────────────────────────────────┐
│                        页面容器                             │
├────────────────────────────────────────────────────────────┤
│                        工具栏                               │
│  [新增] [删除] [刷新]                    [搜索框]           │
├────────────────────────────────────────────────────────────┤
│                        内容区域                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     数据展示区                        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│                        状态栏                               │
│  共 N 条记录                              分页组件          │
└────────────────────────────────────────────────────────────┘
```

#### 3.2 页面状态

| 状态     | 显示内容          | 触发条件     |
| -------- | ----------------- | ------------ |
| 加载中   | Loading 骨架屏    | 数据请求中   |
| 空状态   | 空状态插图 + 提示 | 数据为空     |
| 错误状态 | 错误提示 + 重试   | 请求失败     |
| 正常     | 数据列表/内容     | 数据加载成功 |

---

### 4. 组件设计

#### 4.1 组件层级

```
pages/index.vue
├── components/Toolbar.vue
│   ├── SearchInput
│   └── ActionButtons
├── components/DataList.vue
│   └── DataCard.vue
└── components/StatusBar.vue
```

#### 4.2 组件清单

| 组件名称  | 类型 | Props            | Emits            | 说明         |
| --------- | ---- | ---------------- | ---------------- | ------------ |
| Toolbar   | 业务 | `loading`        | `search, action` | 工具栏       |
| DataList  | 业务 | `items, loading` | `select, action` | 数据列表     |
| DataCard  | 业务 | `item`           | `click, action`  | 单个数据卡片 |
| StatusBar | 业务 | `total, current` | -                | 状态栏       |

#### 4.3 公共组件引用

| 组件           | 来源                  | 用途     |
| -------------- | --------------------- | -------- |
| LoadingSpinner | `@/components/common` | 加载状态 |
| EmptyState     | `@/components/common` | 空状态   |
| ErrorBoundary  | `@/components/common` | 错误边界 |

---

### 5. Store 设计（Pinia）

#### 5.1 Store 类型

选择 Store 实现方式：

| 方式          | 适用场景                       | 本模块选择 |
| ------------- | ------------------------------ | ---------- |
| Setup Store   | 复杂逻辑、需要 Composable 组合 | ✓          |
| Options Store | 简单状态管理                   |            |

#### 5.2 状态定义

| 状态名    | 类型             | 默认值  | 说明       |
| --------- | ---------------- | ------- | ---------- |
| `items`   | `Entity[]`       | `[]`    | 数据列表   |
| `current` | `Entity \| null` | `null`  | 当前选中项 |
| `loading` | `boolean`        | `false` | 加载状态   |
| `error`   | `Error \| null`  | `null`  | 错误信息   |

#### 5.3 计算属性

| 属性名     | 返回类型  | 说明         |
| ---------- | --------- | ------------ |
| `isEmpty`  | `boolean` | 数据是否为空 |
| `total`    | `number`  | 数据总数     |
| `hasError` | `boolean` | 是否有错误   |

#### 5.4 方法定义

| 方法名      | 参数             | 返回类型        | 说明     |
| ----------- | ---------------- | --------------- | -------- |
| `fetchList` | `query?: Query`  | `Promise<void>` | 获取列表 |
| `fetchById` | `id: string`     | `Promise<void>` | 获取详情 |
| `create`    | `dto: CreateDTO` | `Promise<void>` | 创建记录 |
| `update`    | `dto: UpdateDTO` | `Promise<void>` | 更新记录 |
| `remove`    | `id: string`     | `Promise<void>` | 删除记录 |
| `reset`     | -                | `void`          | 重置状态 |

---

### 6. Manager 设计（依赖注入）

> 适用于需要组件树内共享状态、有生命周期管理需求的场景

#### 6.1 是否需要 Manager

| 判断条件                       | 本模块 |
| ------------------------------ | ------ |
| 需要在组件树中共享实例         | ✓/✗    |
| 有副作用需要清理（事件监听等） | ✓/✗    |
| 需要与其他 Manager 协作        | ✓/✗    |
| 需要接收 IPC 事件回调          | ✓/✗    |

如果以上条件至少满足一项，建议使用 Manager 模式。

#### 6.2 Manager 设计

| 方法/属性    | 类型                  | 说明                 |
| ------------ | --------------------- | -------------------- |
| `state`      | `Ref<State>`          | 响应式状态           |
| `computed`   | `ComputedRef<T>`      | 计算属性             |
| `initialize` | `() => Promise<void>` | 初始化（绑定事件等） |
| `destroy`    | `() => void`          | 销毁（清理资源）     |

#### 6.3 InjectionKey

```typescript
const [MODULE]_MANAGER_KEY: InjectionKey<[Module]Manager> = Symbol('[module]-manager')
```

---

### 7. Composables 设计

#### 7.1 Composable 清单

| 名称                 | 用途               | 依赖        |
| -------------------- | ------------------ | ----------- |
| `use[Module]List`    | 列表数据获取与管理 | Store / IPC |
| `use[Module]Form`    | 表单状态与验证     | -           |
| `use[Module]Actions` | 操作方法封装       | Store / IPC |

#### 7.2 Composable 详细设计

**use[Module]List**

| 返回值    | 类型                  | 说明     |
| --------- | --------------------- | -------- |
| `items`   | `Ref<Entity[]>`       | 数据列表 |
| `loading` | `Ref<boolean>`        | 加载状态 |
| `error`   | `Ref<Error \| null>`  | 错误信息 |
| `refresh` | `() => Promise<void>` | 刷新数据 |

---

### 8. IPC 调用封装

#### 8.1 API 调用映射

| 功能     | Preload API                           | 调用位置           |
| -------- | ------------------------------------- | ------------------ |
| 获取列表 | `window.electronAPI.[module].getList` | Store / Composable |
| 获取详情 | `window.electronAPI.[module].getById` | Store / Composable |
| 创建     | `window.electronAPI.[module].create`  | Store / Action     |
| 更新     | `window.electronAPI.[module].update`  | Store / Action     |
| 删除     | `window.electronAPI.[module].delete`  | Store / Action     |

#### 8.2 事件监听

| 事件               | 处理位置        | 处理逻辑               |
| ------------------ | --------------- | ---------------------- |
| `[module]:changed` | Manager / Store | 刷新数据或更新本地状态 |

#### 8.3 错误处理

| 错误类型        | 处理方式     | 用户提示             |
| --------------- | ------------ | -------------------- |
| `NOT_FOUND`     | 移除本地数据 | "数据不存在或已删除" |
| `VALIDATION`    | 表单字段标红 | 显示具体错误信息     |
| `NETWORK_ERROR` | 提供重试选项 | "网络连接失败"       |
| `UNKNOWN`       | 记录日志     | "操作失败，请重试"   |

---

### 9. 交互规范

#### 9.1 加载状态

| 场景       | 处理方式                 |
| ---------- | ------------------------ |
| 初始加载   | 显示骨架屏               |
| 刷新数据   | 保持内容，显示加载指示器 |
| 操作进行中 | 按钮禁用 + loading 图标  |

#### 9.2 确认操作

| 操作类型 | 确认方式   | 提示文案                           |
| -------- | ---------- | ---------------------------------- |
| 删除     | 确认对话框 | "确定要删除该XXX吗？"              |
| 批量删除 | 确认对话框 | "确定要删除选中的N条吗？"          |
| 重置     | 确认对话框 | "确定要重置吗？未保存的更改将丢失" |

#### 9.3 成功提示

| 操作     | 提示方式   | 后续动作            |
| -------- | ---------- | ------------------- |
| 创建成功 | Toast 消息 | 关闭表单 + 刷新列表 |
| 更新成功 | Toast 消息 | 关闭表单 + 刷新列表 |
| 删除成功 | Toast 消息 | 刷新列表            |

---

### 10. 弹窗/抽屉设计（如需要）

#### 10.1 容器选择

| 场景     | 容器类型 | 建议宽度 |
| -------- | -------- | -------- |
| 简单表单 | Dialog   | 500px    |
| 复杂表单 | Drawer   | 600px    |
| 详情展示 | Drawer   | 700px    |
| 关联选择 | Dialog   | 800px    |

#### 10.2 表单设计（如需要）

| 字段名   | 类型     | 组件     | 校验规则          | 说明 |
| -------- | -------- | -------- | ----------------- | ---- |
| `name`   | `string` | Input    | required, max:100 | 名称 |
| `status` | `enum`   | Select   | required          | 状态 |
| `remark` | `string` | Textarea | max:500           | 备注 |

---

### 11. 特殊逻辑（如有）

描述模块的特殊业务逻辑：

- **实时更新**：是否需要监听 IPC 事件自动更新
- **缓存策略**：数据是否需要本地缓存
- **离线支持**：是否需要离线功能
- **快捷键**：是否需要键盘快捷键支持

---

## 模板使用说明

### 填写要点

1. **模块命名**：使用 kebab-case，如 `device-config`
2. **组件层级**：清晰描述父子关系
3. **Store vs Manager**：根据场景选择合适的状态管理方式
4. **IPC 封装**：确保与主进程 Preload API 对应

### 可选章节

以下章节根据模块复杂度选择性填写：

- **6. Manager 设计**：简单模块可省略，使用 Store 即可
- **10. 弹窗/抽屉设计**：无弹窗需求可省略
- **11. 特殊逻辑**：无特殊逻辑可省略
