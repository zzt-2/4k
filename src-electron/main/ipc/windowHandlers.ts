import { ipcMain } from 'electron';
import { windowManager } from '../window';

export function setupWindowIPC() {
	ipcMain.on('window-close', () => {
		windowManager.getWindow()?.close();
	});

	ipcMain.on('window-minimize', () => {
		windowManager.getWindow()?.minimize();
	});

	ipcMain.on('window-maximize', () => {
		const mainWindow = windowManager.getWindow();
		if (mainWindow?.isMaximized()) {
			mainWindow?.unmaximize();
		} else {
			mainWindow?.maximize();
		}
	});

	ipcMain.on('window-unmaximize', () => {
		windowManager.getWindow()?.unmaximize();
	});

	ipcMain.handle('window-is-maximized', () => {
		return windowManager.getWindow()?.isMaximized();
	});
}
