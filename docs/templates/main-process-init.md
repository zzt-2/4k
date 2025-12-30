# Electron 主进程项目初始化配置

本文档包含项目初始化时需要确认的一次性配置，确认后不需要在创建新模块时修改。

---

## 1. 技术选型确认

### 1.1 核心依赖

| 用途     | 选项                               | 选择             | 说明        |
| -------- | ---------------------------------- | ---------------- | ----------- |
| 数据存储 | Prisma + SQLite / better-sqlite3   | `Prisma`         | 需确认      |
| 配置存储 | electron-store / 自定义 JSON       | `electron-store` | 需确认      |
| 日志     | electron-log / pino / winston      | `electron-log`   | 需确认      |
| ID 生成  | cuid (Prisma 默认) / nanoid / uuid | `cuid`           | Prisma 内置 |
| 验证库   | zod / yup / ajv                    | `zod`            | 需确认      |

### 1.2 版本要求

| 依赖       | 最低版本 |
| ---------- | -------- |
| Electron   | 28+      |
| TypeScript | 5+       |
| Node.js    | 18+      |

---

## 2. 目录结构

```
project/
├── prisma/
│   └── schema.prisma             # Prisma Schema 定义
├── electron/
│   ├── main/
│   │   ├── index.ts              # 主进程入口
│   │   ├── app.ts                # 应用生命周期
│   │   ├── window.ts             # 窗口工厂
│   │   ├── ipc/
│   │   │   ├── index.ts          # handler 注册入口
│   │   │   └── [module].handler.ts
│   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── [module].service.ts
│   │   ├── prisma/
│   │   │   └── client.ts         # Prisma 客户端初始化
│   │   └── utils/
│   │       ├── logger.ts
│   │       ├── errors.ts
│   │       ├── paths.ts
│   │       └── validation.ts
│   ├── preload/
│   │   ├── index.ts
│   │   └── modules/
│   └── types/
│       ├── index.ts
│       ├── ipc.types.ts
│       └── [module].types.ts
├── src/                          # 渲染进程
└── resources/                    # 静态资源
```

---

## 3. 基础设施代码

### 3.1 主进程入口

```typescript
// electron/main/index.ts
import { app, BrowserWindow } from 'electron';
import { initPrisma, closePrisma } from './prisma/client';
import { createMainWindow } from './window';
import { registerAllHandlers } from './ipc';
import { logger } from './utils/logger';

let mainWindow: BrowserWindow | null = null;

async function bootstrap() {
	await app.whenReady();

	// 初始化 Prisma
	initPrisma();

	// 注册 IPC handlers
	registerAllHandlers();

	// 创建主窗口
	mainWindow = createMainWindow();

	logger.info('[App] Started successfully');
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('before-quit', async () => {
	await closePrisma();
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		mainWindow = createMainWindow();
	}
});

bootstrap().catch((error) => {
	logger.error('[App] Bootstrap failed:', error);
	app.quit();
});
```

### 3.2 窗口工厂

```typescript
// electron/main/window.ts
import { BrowserWindow, shell } from 'electron';
import path from 'path';
import { WindowStateManager } from './utils/window-state';

const stateManager = new WindowStateManager();

export function createMainWindow(): BrowserWindow {
	const state = stateManager.get('main', {
		width: 1200,
		height: 800,
		minWidth: 800,
		minHeight: 600,
	});

	const win = new BrowserWindow({
		...state,
		show: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, '../preload/index.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	win.on('ready-to-show', () => win.show());
	win.on('close', () => stateManager.save('main', win));

	win.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
	} else {
		win.loadFile(path.join(__dirname, '../../dist/index.html'));
	}

	return win;
}
```

### 3.3 Prisma 客户端初始化

```typescript
// electron/main/prisma/client.ts
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { app } from 'electron';
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

### 3.4 日志配置

```typescript
// electron/main/utils/logger.ts
import log from 'electron-log';
import path from 'path';
import { app } from 'electron';

log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'app.log');

log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn';

export const logger = log;
```

### 3.5 错误类定义

```typescript
// electron/main/utils/errors.ts
import { ErrorCode, IpcError } from '../../types/ipc.types';

export class AppError extends Error {
	constructor(
		public code: string,
		message: string,
		public details?: Record<string, any>
	) {
		super(message);
		this.name = 'AppError';
	}

	toIpcError(): IpcError {
		return { code: this.code, message: this.message, details: this.details };
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string, id: string) {
		super(ErrorCode.NOT_FOUND, `${resource} not found: ${id}`, { resource, id });
	}
}

export class ValidationError extends AppError {
	constructor(message: string, fields?: Record<string, string>) {
		super(ErrorCode.VALIDATION_FAILED, message, { fields });
	}
}

export function normalizeError(error: unknown): IpcError {
	if (error instanceof AppError) return error.toIpcError();
	if (error instanceof Error) {
		return { code: ErrorCode.UNKNOWN_ERROR, message: error.message };
	}
	return { code: ErrorCode.UNKNOWN_ERROR, message: 'Unknown error' };
}
```

### 3.6 公共类型定义

```typescript
// electron/types/ipc.types.ts
export interface IpcError {
	code: string;
	message: string;
	details?: Record<string, any>;
}

export enum ErrorCode {
	VALIDATION_FAILED = 'VALIDATION_FAILED',
	NOT_FOUND = 'NOT_FOUND',
	ALREADY_EXISTS = 'ALREADY_EXISTS',
	DATABASE_ERROR = 'DATABASE_ERROR',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface BaseEntity {
	id: string;
	createdAt: number;
	updatedAt: number;
}

export interface Page<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface ListQuery {
	page?: number;
	pageSize?: number;
	keyword?: string;
}
```

### 3.7 Preload 入口

```typescript
// electron/preload/index.ts
import { contextBridge } from 'electron';
// 导入各模块 API
// import { userApi } from './modules/user'

contextBridge.exposeInMainWorld('electronAPI', {
	// user: userApi,
});
```

```typescript
// electron/types/electron.d.ts
import type { ElectronAPI } from '../preload';

declare global {
	interface Window {
		electronAPI: ElectronAPI;
	}
}

export {};
```

### 3.8 IPC Handler 注册入口

```typescript
// electron/main/ipc/index.ts
// 导入各模块 handler 注册函数
// import { registerUserHandlers } from './user.handler'
// import { UserService } from '../services/user.service'

export function registerAllHandlers() {
	// 初始化服务并注册 handlers
	// const userService = new UserService()
	// registerUserHandlers(userService)
}
```

---

## 4. 安全配置

### 4.1 BrowserWindow 安全配置（必须）

```typescript
webPreferences: {
  contextIsolation: true,        // 必须启用
  nodeIntegration: false,        // 必须禁用
  sandbox: true,                 // 推荐启用
  webSecurity: true,             // 必须启用（默认）
  allowRunningInsecureContent: false,
}
```

### 4.2 CSP 配置（如需）

```html
<meta
	http-equiv="Content-Security-Policy"
	content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
/>
```

---

## 5. 初始化检查清单

项目初始化时确认以下配置：

### 技术选型

- [ ] 数据库选型确认（Prisma + SQLite / 其他）
- [ ] Prisma Schema 已初始化
- [ ] 配置存储选型确认（electron-store / 其他）
- [ ] 日志库选型确认（electron-log / 其他）
- [ ] 验证库选型确认（zod / 其他）

### 基础设施

- [ ] 目录结构已创建
- [ ] 主进程入口已配置
- [ ] 窗口工厂已实现
- [ ] Prisma Client 初始化完成
- [ ] 日志系统已配置
- [ ] 错误类已定义
- [ ] 公共类型已定义
- [ ] Preload 入口已配置
- [ ] IPC 注册入口已配置

### 安全配置

- [ ] contextIsolation = true
- [ ] nodeIntegration = false
- [ ] sandbox = true
- [ ] CSP 已配置（如需）

---

## 6. 添加新模块时需要修改的文件

初始化完成后，添加新模块只需：

| 操作 | 文件                                          |
| ---- | --------------------------------------------- |
| 新增 | `prisma/schema.prisma` - 添加新模型           |
| 新增 | `electron/types/[module].types.ts`            |
| 新增 | `electron/main/services/[module].service.ts`  |
| 新增 | `electron/main/ipc/[module].handler.ts`       |
| 新增 | `electron/preload/modules/[module].ts`        |
| 修改 | `electron/main/ipc/index.ts` - 注册新 handler |
| 修改 | `electron/preload/index.ts` - 暴露新 API      |
| 运行 | `npx prisma generate` - 生成新的客户端代码    |

**无需修改**：Prisma 客户端初始化、日志配置、错误类、窗口工厂等基础设施。
