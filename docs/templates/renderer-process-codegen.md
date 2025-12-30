# Electron 渲染进程模块代码生成规范

本规范定义 LLM Agent 根据模块设计文档生成渲染进程模块代码时的标准。

前置依赖：

- 主进程模块代码已完成
- Preload API 已定义并可用
- 渲染进程设计文档已完成（参见 `renderer-process-template.md`）

---

## 1. 命名规范

| 类型         | 格式            | 示例                        |
| ------------ | --------------- | --------------------------- |
| 文件名       | kebab-case      | `device-config.vue`         |
| 目录名       | kebab-case      | `device-config/`            |
| 组件名       | PascalCase      | `DeviceConfigList`          |
| Composable   | camelCase       | `useDeviceConfig`           |
| Store        | camelCase       | `useDeviceConfigStore`      |
| Manager      | camelCase       | `useDeviceConfigManager`    |
| 类型/接口    | PascalCase      | `DeviceConfig`              |
| 常量         | SCREAMING_SNAKE | `DEFAULT_PAGE_SIZE`         |
| InjectionKey | SCREAMING_SNAKE | `DEVICE_CONFIG_MANAGER_KEY` |

---

## 2. Pinia Store 生成

### 2.1 Setup Store 模板（推荐）

```typescript
// src/core/stores/[module]-store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { [Entity], Create[Entity]DTO, Update[Entity]DTO, [Entity]Query } from '@/modules/[module]/types'

export const use[Entity]Store = defineStore('[module]', () => {
  // =============== 状态定义 ===============

  const items = ref<[Entity][]>([])
  const current = ref<[Entity] | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // =============== 计算属性 ===============

  const isEmpty = computed(() => items.value.length === 0)
  const total = computed(() => items.value.length)
  const hasError = computed(() => error.value !== null)

  // =============== 方法定义 ===============

  async function fetchList(query?: [Entity]Query): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.[module].getList(query ?? {})
      items.value = result.items
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      current.value = await window.electronAPI.[module].getById(id)
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(dto: Create[Entity]DTO): Promise<[Entity]> {
    loading.value = true
    try {
      const created = await window.electronAPI.[module].create(dto)
      items.value.unshift(created)
      return created
    } finally {
      loading.value = false
    }
  }

  async function update(dto: Update[Entity]DTO): Promise<[Entity]> {
    loading.value = true
    try {
      const updated = await window.electronAPI.[module].update(dto)
      const index = items.value.findIndex(item => item.id === updated.id)
      if (index !== -1) {
        items.value[index] = updated
      }
      if (current.value?.id === updated.id) {
        current.value = updated
      }
      return updated
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string): Promise<void> {
    loading.value = true
    try {
      await window.electronAPI.[module].delete(id)
      items.value = items.value.filter(item => item.id !== id)
      if (current.value?.id === id) {
        current.value = null
      }
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    items.value = []
    current.value = null
    loading.value = false
    error.value = null
  }

  // =============== 返回所有内容 ===============

  return {
    // 状态
    items,
    current,
    loading,
    error,

    // 计算属性
    isEmpty,
    total,
    hasError,

    // 方法
    fetchList,
    fetchById,
    create,
    update,
    remove,
    reset,
  }
})
```

### 2.2 Store 注册

```typescript
// src/core/stores/index.ts 添加：
export * from './[module]-store';
```

---

## 3. Manager 生成（依赖注入）

### 3.1 Manager 模板

```typescript
// src/core/stores/[module]-manager.ts
import { ref, computed, markRaw } from 'vue'
import type { InjectionKey } from 'vue'
import type { [Entity] } from '@/modules/[module]/types'

// =============== 类型定义 ===============

export type [Entity]Manager = ReturnType<typeof create[Entity]Manager>
const [MODULE]_MANAGER_KEY: InjectionKey<[Entity]Manager> = Symbol('[module]-manager')

type ChangeCallback = (data: [Entity] | { id: string; deleted: true }) => void

// =============== 创建管理器 ===============

function create[Entity]Manager() {
  // =============== 状态管理 ===============

  const items = ref<[Entity][]>([])
  const selected = ref<[Entity] | null>(null)
  const changeCallbacks = new Set<ChangeCallback>()

  // =============== 计算属性 ===============

  const isEmpty = computed(() => items.value.length === 0)
  const total = computed(() => items.value.length)

  // =============== IPC 事件处理 ===============

  let unsubscribe: (() => void) | null = null

  function handleChange(data: [Entity] | { id: string; deleted: true }): void {
    if ('deleted' in data && data.deleted) {
      items.value = items.value.filter(item => item.id !== data.id)
      if (selected.value?.id === data.id) {
        selected.value = null
      }
    } else {
      const entity = data as [Entity]
      const index = items.value.findIndex(item => item.id === entity.id)
      if (index !== -1) {
        items.value[index] = entity
      } else {
        items.value.unshift(entity)
      }
    }

    changeCallbacks.forEach(cb => cb(data))
  }

  // =============== 回调注册 ===============

  function onChange(callback: ChangeCallback): () => void {
    changeCallbacks.add(callback)
    return () => changeCallbacks.delete(callback)
  }

  // =============== 生命周期 ===============

  async function initialize(): Promise<void> {
    // 订阅 IPC 变更事件
    unsubscribe = window.electronAPI.[module].onChanged(handleChange)
  }

  function destroy(): void {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    changeCallbacks.clear()
    items.value = []
    selected.value = null
  }

  // =============== 返回所有内容 ===============

  return {
    // 状态
    items,
    selected,

    // 计算属性
    isEmpty,
    total,

    // 回调
    onChange,

    // 生命周期
    initialize,
    destroy,
  }
}

// =============== Provide/Inject 函数 ===============

export function provide[Entity]Manager() {
  const manager = markRaw(create[Entity]Manager())
  provideLocal([MODULE]_MANAGER_KEY, manager)
  return manager
}

export function use[Entity]Manager() {
  const manager = injectLocal([MODULE]_MANAGER_KEY)
  if (!manager) {
    throw new Error('use[Entity]Manager must be called within provide[Entity]Manager')
  }
  return manager
}
```

### 3.2 Manager 注册到 AppManagers（如需要）

```typescript
// src/core/stores/use-editor-managers.ts 添加：
import { provide[Entity]Manager } from './[module]-manager'

// 在 createAppManagers 中添加：
const [module]Manager = markRaw(provide[Entity]Manager())

// 在 initialize 中添加：
await [module]Manager.initialize()

// 在 destroy 中添加：
[module]Manager.destroy?.()
```

---

## 4. Composable 生成

### 4.1 列表 Composable 模板

```typescript
// src/modules/[module]/composables/use[Entity]List.ts
import { ref, onMounted, onUnmounted } from 'vue'
import type { [Entity], [Entity]Query } from '../types'
import { use[Entity]Store } from '@/core/stores'

export function use[Entity]List(initialQuery?: [Entity]Query) {
  const store = use[Entity]Store()

  const query = ref<[Entity]Query>(initialQuery ?? {})

  async function refresh(): Promise<void> {
    await store.fetchList(query.value)
  }

  async function search(newQuery: Partial<[Entity]Query>): Promise<void> {
    query.value = { ...query.value, ...newQuery }
    await refresh()
  }

  function reset(): void {
    query.value = {}
    store.reset()
  }

  // 初始加载
  onMounted(() => {
    refresh()
  })

  return {
    // 来自 Store 的响应式状态
    items: computed(() => store.items),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    isEmpty: computed(() => store.isEmpty),

    // 本地状态
    query,

    // 方法
    refresh,
    search,
    reset,
  }
}
```

### 4.2 表单 Composable 模板

```typescript
// src/modules/[module]/composables/use[Entity]Form.ts
import { ref, reactive, computed } from 'vue'
import type { [Entity], Create[Entity]DTO, Update[Entity]DTO } from '../types'
import { use[Entity]Store } from '@/core/stores'

export function use[Entity]Form(entity?: [Entity]) {
  const store = use[Entity]Store()
  const isEdit = computed(() => !!entity?.id)

  const form = reactive<Create[Entity]DTO | Update[Entity]DTO>({
    ...(entity ?? getDefaultValues()),
  })

  const submitting = ref(false)
  const errors = ref<Record<string, string>>({})

  function getDefaultValues(): Create[Entity]DTO {
    return {
      name: '',
      status: 'active',
      // ...其他默认值
    }
  }

  function validate(): boolean {
    errors.value = {}

    if (!form.name?.trim()) {
      errors.value.name = '名称不能为空'
    }

    return Object.keys(errors.value).length === 0
  }

  async function submit(): Promise<[Entity] | null> {
    if (!validate()) return null

    submitting.value = true
    try {
      if (isEdit.value) {
        return await store.update(form as Update[Entity]DTO)
      } else {
        return await store.create(form as Create[Entity]DTO)
      }
    } finally {
      submitting.value = false
    }
  }

  function reset(): void {
    Object.assign(form, entity ?? getDefaultValues())
    errors.value = {}
  }

  return {
    form,
    isEdit,
    submitting,
    errors,
    validate,
    submit,
    reset,
  }
}
```

### 4.3 操作 Composable 模板

```typescript
// src/modules/[module]/composables/use[Entity]Actions.ts
import { ref } from 'vue'
import { use[Entity]Store } from '@/core/stores'

export function use[Entity]Actions() {
  const store = use[Entity]Store()
  const deleting = ref(false)

  async function remove(id: string): Promise<boolean> {
    deleting.value = true
    try {
      await store.remove(id)
      return true
    } catch (e) {
      console.error('[use[Entity]Actions] remove failed:', e)
      return false
    } finally {
      deleting.value = false
    }
  }

  async function batchRemove(ids: string[]): Promise<boolean> {
    deleting.value = true
    try {
      await Promise.all(ids.map(id => store.remove(id)))
      return true
    } catch (e) {
      console.error('[use[Entity]Actions] batchRemove failed:', e)
      return false
    } finally {
      deleting.value = false
    }
  }

  return {
    deleting,
    remove,
    batchRemove,
  }
}
```

---

## 5. 页面组件生成

### 5.1 列表页面模板

```vue
<!-- src/modules/[module]/pages/index.vue -->
<script setup lang="ts">
import { use[Entity]List } from '../composables/use[Entity]List'
import { use[Entity]Actions } from '../composables/use[Entity]Actions'

// =============== Composables ===============

const { items, loading, error, isEmpty, refresh } = use[Entity]List()
const { remove, deleting } = use[Entity]Actions()

// =============== 事件处理 ===============

async function handleDelete(id: string) {
  // 确认弹窗逻辑（根据项目 UI 框架实现）
  const confirmed = await confirm('确定要删除吗？')
  if (confirmed) {
    const success = await remove(id)
    if (success) {
      // 成功提示
    }
  }
}
</script>

<template>
	<div class="[module]-page">
		<!-- 工具栏 -->
		<div class="toolbar">
			<button @click="handleAdd">新增</button>
			<button @click="refresh" :disabled="loading">刷新</button>
		</div>

		<!-- 加载状态 -->
		<div v-if="loading" class="loading-state">加载中...</div>

		<!-- 错误状态 -->
		<div v-else-if="error" class="error-state">
			<p>{{ error.message }}</p>
			<button @click="refresh">重试</button>
		</div>

		<!-- 空状态 -->
		<div v-else-if="isEmpty" class="empty-state">暂无数据</div>

		<!-- 数据列表 -->
		<div v-else class="content">
			<div v-for="item in items" :key="item.id" class="item">
				<span>{{ item.name }}</span>
				<button @click="handleEdit(item)">编辑</button>
				<button @click="handleDelete(item.id)" :disabled="deleting">删除</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* 样式根据项目规范编写 */
</style>
```

### 5.2 表单弹窗模板

```vue
<!-- src/modules/[module]/components/[Entity]FormDialog.vue -->
<script setup lang="ts">
import { use[Entity]Form } from '../composables/use[Entity]Form'
import type { [Entity] } from '../types'

// =============== Props & Emits ===============

const props = defineProps<{
  entity?: [Entity]
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  success: [[Entity]]
}>()

// =============== Composables ===============

const { form, isEdit, submitting, errors, submit, reset } = use[Entity]Form(props.entity)

// =============== 事件处理 ===============

async function handleSubmit() {
  const result = await submit()
  if (result) {
    emit('success', result)
    emit('close')
  }
}

function handleClose() {
  reset()
  emit('close')
}
</script>

<template>
	<dialog :open="visible" @close="handleClose">
		<header>
			<h3>{{ isEdit ? '编辑' : '新增' }}</h3>
		</header>

		<form @submit.prevent="handleSubmit">
			<div class="field">
				<label>名称</label>
				<input v-model="form.name" />
				<span v-if="errors.name" class="error">{{ errors.name }}</span>
			</div>

			<!-- 其他表单字段 -->

			<footer>
				<button type="button" @click="handleClose">取消</button>
				<button type="submit" :disabled="submitting">
					{{ submitting ? '保存中...' : '保存' }}
				</button>
			</footer>
		</form>
	</dialog>
</template>
```

---

## 6. 类型定义生成

### 6.1 模块类型模板

```typescript
// src/modules/[module]/types.ts

// 从主进程类型导入或重新定义
export interface [Entity] {
  id: string
  name: string
  status: [Entity]Status
  createdAt: number
  updatedAt: number
}

export enum [Entity]Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export type Create[Entity]DTO = Omit<[Entity], 'id' | 'createdAt' | 'updatedAt'>
export type Update[Entity]DTO = Partial<Create[Entity]DTO> & Pick<[Entity], 'id'>

export interface [Entity]Query {
  page?: number
  pageSize?: number
  keyword?: string
  status?: [Entity]Status
}
```

---

## 7. 路由配置生成

### 7.1 路由添加模板

```typescript
// src/router/routes.ts 添加：
{
  path: '/[module]',
  name: '[Module]',
  component: () => import('@/modules/[module]/pages/index.vue'),
  meta: {
    title: '[模块名称]',
    icon: 'icon-name',
  },
  children: [
    // 子路由（如需要）
    {
      path: ':id',
      name: '[Module]Detail',
      component: () => import('@/modules/[module]/pages/detail.vue'),
      meta: { title: '详情' },
    },
  ],
}
```

---

## 8. 代码生成检查清单

生成代码后检查：

### Store

- [ ] 使用 Setup Store 风格（`defineStore('name', () => {})`）
- [ ] 状态使用 `ref()` 定义
- [ ] 计算属性使用 `computed()` 定义
- [ ] 异步方法包含 loading 状态管理
- [ ] 异步方法包含错误处理
- [ ] 已导出到 `stores/index.ts`

### Manager（如需要）

- [ ] 使用 `InjectionKey` 定义类型安全的注入键
- [ ] 实现 `initialize()` 和 `destroy()` 生命周期方法
- [ ] IPC 事件订阅在 `initialize()` 中绑定
- [ ] 资源清理在 `destroy()` 中执行
- [ ] 提供 `provideXxxManager()` 和 `useXxxManager()` 函数
- [ ] 使用 `provideLocal/injectLocal` 确保组件树隔离

### Composables

- [ ] 函数名以 `use` 开头
- [ ] 返回响应式数据和方法
- [ ] 适当使用 `onMounted`/`onUnmounted` 生命周期

### 页面组件

- [ ] 使用 `<script setup>` 语法
- [ ] 正确引入 Composables
- [ ] 处理加载、错误、空状态
- [ ] 实现确认删除等交互

### 类型定义

- [ ] 与主进程类型保持一致或正确导入
- [ ] DTO 类型正确定义

### 路由

- [ ] 路由路径符合规范
- [ ] 组件路径正确
- [ ] meta 信息完整

---

## 9. Store vs Manager 选择指南

| 场景                            | 推荐方案 | 原因                 |
| ------------------------------- | -------- | -------------------- |
| 简单 CRUD 数据管理              | Store    | 全局单例，使用简单   |
| 需要监听 IPC 事件               | Manager  | 需要生命周期管理     |
| 多组件共享但需隔离实例          | Manager  | 依赖注入支持多实例   |
| 复杂副作用（WebSocket、定时器） | Manager  | 需要显式销毁         |
| 跨页面持久化状态                | Store    | Pinia 支持持久化插件 |
| 与其他 Manager 协作             | Manager  | 通过依赖注入组合     |

---

## 10. Pinia 与依赖注入组合使用

### 10.1 Store + Manager 协作模式

```typescript
// Manager 使用 Store
function create[Entity]Manager() {
  const store = use[Entity]Store()

  async function initialize() {
    // 使用 Store 获取初始数据
    await store.fetchList()

    // 订阅 IPC 事件并同步到 Store
    window.electronAPI.[module].onChanged((data) => {
      if ('deleted' in data) {
        // 直接操作 Store 状态
        store.items = store.items.filter(item => item.id !== data.id)
      } else {
        const index = store.items.findIndex(item => item.id === data.id)
        if (index !== -1) {
          store.items[index] = data
        }
      }
    })
  }

  return {
    // 代理 Store 状态
    items: computed(() => store.items),
    loading: computed(() => store.loading),

    // Manager 专有方法
    initialize,
    destroy,
  }
}
```

### 10.2 最佳实践

1. **Store 负责数据**：CRUD 操作、数据缓存、跨页面共享
2. **Manager 负责行为**：事件监听、生命周期、副作用管理
3. **Composable 负责组合**：将 Store/Manager 组合为可复用的业务逻辑
4. **组件负责展示**：仅使用 Composable 返回的数据和方法
