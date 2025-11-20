import { defineStore } from '#q-app/wrappers';
import { createPinia } from 'pinia';

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module 'pinia' {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export interface PiniaCustomProperties {
		// add your custom properties here, if any
	}
}

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default defineStore((/* { ssrContext } */) => {
	const pinia = createPinia();

	// You can add Pinia plugins here
	// pinia.use(SomePiniaPlugin)

	return pinia;
});

// =============== 导出各个管理器 ===============
// 注意：按依赖顺序导出，避免循环依赖

// 1. 独立管理器（无依赖）
export * from './theme-manager';
export * from './settings-store';

// 2. 统一管理器（依赖其他管理器）
export * from './use-editor-managers';
