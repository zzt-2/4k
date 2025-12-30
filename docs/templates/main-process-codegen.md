# Electron 主进程模块代码生成规范

本规范定义 LLM Agent 根据模块设计文档生成主进程模块代码时的标准。

前置依赖：项目初始化配置已完成（参见 `main-process-init.md`）

---

## 1. 命名规范

| 类型      | 格式                  | 示例                      |
| --------- | --------------------- | ------------------------- |
| 文件名    | kebab-case            | `user-profile.service.ts` |
| 类名      | PascalCase            | `UserProfileService`      |
| 接口名    | PascalCase            | `UserProfile`             |
| 函数/方法 | camelCase             | `getUserProfile`          |
| IPC 通道  | kebab-case:kebab-case | `user-profile:get-list`   |
| 数据库表  | snake_case            | `user_profiles`           |
| 数据库列  | snake_case            | `created_at`              |

---

## 2. 类型定义生成

### 2.1 模板

```typescript
// electron/types/[module].types.ts
import { BaseEntity, ListQuery } from './ipc.types'

// 实体类型
export interface [Entity] extends BaseEntity {
  name: string
  status: [Entity]Status
  // ...业务字段
}

// 状态枚举
export enum [Entity]Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// 创建 DTO
export type Create[Entity]DTO = Omit<[Entity], 'id' | 'createdAt' | 'updatedAt'>

// 更新 DTO
export type Update[Entity]DTO = Partial<Create[Entity]DTO> & Pick<[Entity], 'id'>

// 查询参数（如需扩展）
export interface [Entity]Query extends ListQuery {
  status?: [Entity]Status
}

// IPC 通道枚举
export enum [Entity]Channel {
  GET_LIST = '[module]:get-list',
  GET_BY_ID = '[module]:get-by-id',
  CREATE = '[module]:create',
  UPDATE = '[module]:update',
  DELETE = '[module]:delete',
  CHANGED = '[module]:changed',
}
```

---

## 3. Prisma 配置

### 3.1 Schema 模板

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model [Model] {
  id        String   @id @default(cuid())
  name      String
  status    [Model]Status @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("[table_name]")
}

enum [Model]Status {
  ACTIVE
  INACTIVE
}
```

### 3.2 Prisma Client 封装

```typescript
// electron/main/prisma/client.ts
import { PrismaClient } from '@prisma/client';
import { app } from 'electron';
import path from 'path';
import { logger } from '../utils/logger';

let prisma: PrismaClient | null = null;

export function initPrisma(): PrismaClient {
	if (prisma) return prisma;

	const dbPath = path.join(app.getPath('userData'), 'data.db');
	process.env.DATABASE_URL = `file:${dbPath}`;

	prisma = new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'error', emit: 'stdout' },
		],
	});

	prisma.$on('query', (e) => {
		logger.debug(`[Prisma] ${e.query} - ${e.duration}ms`);
	});

	logger.info(`[Prisma] Initialized: ${dbPath}`);
	return prisma;
}

export function getPrisma(): PrismaClient {
	if (!prisma) throw new Error('Prisma not initialized');
	return prisma;
}

export async function closePrisma(): Promise<void> {
	if (prisma) {
		await prisma.$disconnect();
		prisma = null;
		logger.info('[Prisma] Disconnected');
	}
}
```

---

## 4. Service 生成

### 4.1 模板

```typescript
// electron/main/services/[module].service.ts
import { PrismaClient, [Model], Prisma } from '@prisma/client'
import { [Entity], Create[Entity]DTO, Update[Entity]DTO, [Entity]Query } from '../../types/[module].types'
import { Page } from '../../types/ipc.types'
import { getPrisma } from '../prisma/client'
import { NotFoundError } from '../utils/errors'
import { logger } from '../utils/logger'

export class [Entity]Service {
  private get prisma(): PrismaClient {
    return getPrisma()
  }

  async getList(query: [Entity]Query): Promise<Page<[Entity]>> {
    const { page = 1, pageSize = 20, keyword, status } = query
    const skip = (page - 1) * pageSize

    const where: Prisma.[Model]WhereInput = {}
    if (keyword) {
      where.name = { contains: keyword }
    }
    if (status) {
      where.status = status
    }

    const [items, total] = await Promise.all([
      this.prisma.[model].findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.[model].count({ where }),
    ])

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async getById(id: string): Promise<[Entity]> {
    const entity = await this.prisma.[model].findUnique({
      where: { id },
    })
    if (!entity) throw new NotFoundError('[Entity]', id)
    return entity
  }

  async create(dto: Create[Entity]DTO): Promise<[Entity]> {
    const entity = await this.prisma.[model].create({
      data: dto,
    })
    logger.info(`[[Entity]Service] Created: ${entity.id}`)
    return entity
  }

  async update(dto: Update[Entity]DTO): Promise<[Entity]> {
    const { id, ...data } = dto
    await this.getById(id) // 确保存在

    const entity = await this.prisma.[model].update({
      where: { id },
      data,
    })
    logger.info(`[[Entity]Service] Updated: ${id}`)
    return entity
  }

  async delete(id: string): Promise<void> {
    await this.getById(id) // 确保存在
    await this.prisma.[model].delete({
      where: { id },
    })
    logger.info(`[[Entity]Service] Deleted: ${id}`)
  }
}
```

---

## 5. IPC Handler 生成

### 5.1 模板

```typescript
// electron/main/ipc/[module].handler.ts
import { ipcMain, BrowserWindow } from 'electron'
import { [Entity]Channel, Create[Entity]DTO, Update[Entity]DTO, [Entity]Query } from '../../types/[module].types'
import { [Entity]Service } from '../services/[module].service'
import { normalizeError } from '../utils/errors'
import { logger } from '../utils/logger'

export function register[Entity]Handlers(service: [Entity]Service) {
  ipcMain.handle([Entity]Channel.GET_LIST, async (_, query: [Entity]Query) => {
    try {
      return await service.getList(query)
    } catch (error) {
      logger.error('[[Entity]Handler] getList failed:', error)
      throw normalizeError(error)
    }
  })

  ipcMain.handle([Entity]Channel.GET_BY_ID, async (_, { id }: { id: string }) => {
    try {
      return await service.getById(id)
    } catch (error) {
      logger.error('[[Entity]Handler] getById failed:', error)
      throw normalizeError(error)
    }
  })

  ipcMain.handle([Entity]Channel.CREATE, async (_, dto: Create[Entity]DTO) => {
    try {
      const result = await service.create(dto)
      broadcastChange(result)
      return result
    } catch (error) {
      logger.error('[[Entity]Handler] create failed:', error)
      throw normalizeError(error)
    }
  })

  ipcMain.handle([Entity]Channel.UPDATE, async (_, dto: Update[Entity]DTO) => {
    try {
      const result = await service.update(dto)
      broadcastChange(result)
      return result
    } catch (error) {
      logger.error('[[Entity]Handler] update failed:', error)
      throw normalizeError(error)
    }
  })

  ipcMain.handle([Entity]Channel.DELETE, async (_, { id }: { id: string }) => {
    try {
      await service.delete(id)
      broadcastChange({ id, deleted: true })
    } catch (error) {
      logger.error('[[Entity]Handler] delete failed:', error)
      throw normalizeError(error)
    }
  })
}

function broadcastChange(data: any) {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send([Entity]Channel.CHANGED, data)
  })
}
```

---

## 6. Preload API 生成

### 6.1 模板

```typescript
// electron/preload/modules/[module].ts
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { [Entity], Create[Entity]DTO, Update[Entity]DTO, [Entity]Query, [Entity]Channel } from '../../types/[module].types'
import { Page } from '../../types/ipc.types'

export const [module]Api = {
  getList(query: [Entity]Query): Promise<Page<[Entity]>> {
    return ipcRenderer.invoke([Entity]Channel.GET_LIST, query)
  },

  getById(id: string): Promise<[Entity]> {
    return ipcRenderer.invoke([Entity]Channel.GET_BY_ID, { id })
  },

  create(dto: Create[Entity]DTO): Promise<[Entity]> {
    return ipcRenderer.invoke([Entity]Channel.CREATE, dto)
  },

  update(dto: Update[Entity]DTO): Promise<[Entity]> {
    return ipcRenderer.invoke([Entity]Channel.UPDATE, dto)
  },

  delete(id: string): Promise<void> {
    return ipcRenderer.invoke([Entity]Channel.DELETE, { id })
  },

  onChanged(callback: (data: [Entity] | { id: string; deleted: true }) => void): () => void {
    const handler = (_: IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on([Entity]Channel.CHANGED, handler)
    return () => ipcRenderer.removeListener([Entity]Channel.CHANGED, handler)
  },
}
```

---

## 7. 注册到入口

### 7.1 IPC 入口

```typescript
// electron/main/ipc/index.ts 添加：
import { register[Entity]Handlers } from './[module].handler'
import { [Entity]Service } from '../services/[module].service'

// 在 registerAllHandlers 中添加：
const [module]Service = new [Entity]Service()
register[Entity]Handlers([module]Service)
```

### 7.2 Preload 入口

```typescript
// electron/preload/index.ts 添加：
import { [module]Api } from './modules/[module]'

// 在 exposeInMainWorld 中添加：
[module]: [module]Api,
```

---

## 8. 代码生成检查清单

生成代码后检查：

- [ ] Prisma Schema 模型已添加
- [ ] 已运行 `npx prisma generate` 生成客户端
- [ ] 类型定义完整（Entity, DTO, Query, Channel）
- [ ] Service 使用 Prisma Client 正确调用
- [ ] Service 方法返回完整对象
- [ ] Handler 有 try-catch 和错误标准化
- [ ] Handler 写操作后广播变更事件
- [ ] Preload 返回取消订阅函数
- [ ] 已注册到 IPC 入口
- [ ] 已注册到 Preload 入口
- [ ] 已注册到 Preload 入口
