/**
 * 窗口API封装
 * 提供窗口操作的统一接口
 */

// 导出窗口API
export const windowAPI = {
	close: () => window.electron.windowAPI.close(),
	minimize: () => window.electron.windowAPI.minimize(),
	maximize: () => window.electron.windowAPI.maximize(),
	unmaximize: () => window.electron.windowAPI.unmaximize(),
	isMaximized: () => window.electron.windowAPI.isMaximized(),
};
