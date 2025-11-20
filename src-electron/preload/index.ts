import { contextBridge } from 'electron';
import { windowAPI } from './window';

// 动态导入所有API模块
export const api = {
	windowAPI,
};

// 添加类型检查
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', api);
		console.log('Electron API exposed');
	} catch (error) {
		console.error('Electron API exposure failed:', error);
	}
}
