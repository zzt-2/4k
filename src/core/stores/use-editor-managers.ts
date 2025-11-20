import { ref, markRaw, provide, inject, type InjectionKey } from 'vue';
import { provideThemeManager } from './theme-manager';

// =============== 类型定义 ===============

/**
 * 应用管理器配置
 */
export interface AppManagersConfig {
	/** 应用 ID（可选，会自动生成） */
	id?: string;
	/** 调试模式 */
	debugMode?: boolean;
}

// =============== 工具函数 ===============

/**
 * 生成唯一 ID
 */
function generateUniqueId(): string {
	return `app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// =============== 应用管理器创建函数 ===============

/**
 * 创建应用管理器
 * 统一管理所有子管理器的生命周期
 */
export function createAppManagers(config: AppManagersConfig = {}) {
	// =============== 基础配置 ===============

	const appId = config.id || generateUniqueId();
	const debugMode = config.debugMode ?? false;

	if (debugMode) {
		console.log('[AppManagers] 创建应用管理器:', appId);
	}

	// =============== 创建子管理器 ===============

	// 按依赖顺序创建管理器
	// 1. 主题管理器（无依赖，可独立运行）
	const themeManager = markRaw(provideThemeManager());

	// 2. 未来可以在这里添加更多管理器
	// const userManager = markRaw(provideUserManager());
	// const routerManager = markRaw(provideRouterManager());
	// 等等...

	// =============== 生命周期管理 ===============

	const isInitialized = ref(false);

	/**
	 * 初始化所有管理器
	 */
	const initialize = async (): Promise<void> => {
		if (isInitialized.value) {
			console.warn('[AppManagers] 管理器已初始化，跳过重复初始化');
			return;
		}

		try {
			if (debugMode) {
				console.log('[AppManagers] 开始初始化管理器...');
			}

			// 按顺序初始化各个管理器
			await themeManager.initialize();

			// 未来添加更多管理器的初始化
			// await userManager.initialize();
			// await routerManager.initialize();

			isInitialized.value = true;

			if (debugMode) {
				console.log('[AppManagers] 所有管理器初始化完成');
			}
		} catch (error) {
			console.error('[AppManagers] 初始化失败:', error);
			throw error;
		}
	};

	/**
	 * 销毁所有管理器
	 */
	const destroy = (): void => {
		if (!isInitialized.value) {
			return;
		}

		try {
			if (debugMode) {
				console.log('[AppManagers] 开始销毁管理器...');
			}

			// 按相反顺序销毁管理器
			// 未来添加的管理器在这里销毁
			// routerManager.destroy?.();
			// userManager.destroy?.();

			// themeManager 目前没有 destroy 方法，如果需要可以添加

			isInitialized.value = false;

			// 从全局注册表中移除
			globalAppManagers.delete(appId);

			if (debugMode) {
				console.log('[AppManagers] 所有管理器已销毁');
			}
		} catch (error) {
			console.error('[AppManagers] 销毁失败:', error);
		}
	};

	/**
	 * 重置所有管理器到初始状态
	 */
	const reset = async (): Promise<void> => {
		try {
			if (debugMode) {
				console.log('[AppManagers] 开始重置管理器...');
			}

			// 重新初始化各个管理器
			await themeManager.initialize();

			// 未来添加更多管理器的重置
			// await userManager.reset?.();

			if (debugMode) {
				console.log('[AppManagers] 所有管理器已重置');
			}
		} catch (error) {
			console.error('[AppManagers] 重置失败:', error);
			throw error;
		}
	};

	// =============== 返回管理器实例和控制方法 ===============

	return {
		// 基础信息
		appId,
		debugMode,
		isInitialized,

		// 管理器实例
		themeManager,
		// 未来添加更多管理器
		// userManager,
		// routerManager,

		// 生命周期方法
		initialize,
		destroy,
		reset,
	};
}

// =============== 类型导出 ===============

export type AppManagers = ReturnType<typeof createAppManagers>;

// =============== 依赖注入 ===============

const APP_MANAGERS_KEY: InjectionKey<AppManagers> = Symbol('app-managers');

/**
 * 全局管理器注册表
 * 用于在不同上下文中访问管理器实例
 */
const globalAppManagers = new Map<string, AppManagers>();

/**
 * 提供应用管理器到 Vue 组件树
 */
export function provideAppManagers(config: AppManagersConfig = {}) {
	const managers = markRaw(createAppManagers(config));
	provide(APP_MANAGERS_KEY, managers);
	globalAppManagers.set(managers.appId, managers);
	return managers;
}

/**
 * 在组件中注入应用管理器
 */
export function useAppManagers() {
	const managers = inject(APP_MANAGERS_KEY);
	if (!managers) {
		throw new Error('useAppManagers 必须在 provideAppManagers 之后调用');
	}
	return managers;
}

/**
 * 通过 ID 获取全局管理器实例
 * 适用于非组件上下文
 */
export function getAppManagersById(appId: string): AppManagers | undefined {
	return globalAppManagers.get(appId);
}

/**
 * 获取所有管理器实例
 */
export function getAllAppManagers(): AppManagers[] {
	return Array.from(globalAppManagers.values());
}
