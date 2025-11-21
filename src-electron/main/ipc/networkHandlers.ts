import { ipcMain } from 'electron';
import { connectionManager } from '../network/connectionManager';

export function setupNetworkIPC() {
	// 创建连接
	ipcMain.handle('network-create-connection', async (_, params) => {
		return connectionManager.createConnection(params);
	});

	// 获取所有连接
	ipcMain.handle('network-get-all-connections', async () => {
		return connectionManager.getAllConnections();
	});

	// 发送数据
	ipcMain.handle('network-send-data', async (_, params) => {
		return await connectionManager.sendData(params);
	});

	// 断开连接
	ipcMain.handle('network-close-connection', async (_, params) => {
		return connectionManager.closeConnection(params.connectionId);
	});

	// 查询连接状态
	ipcMain.handle('network-get-status', async (_, params) => {
		return connectionManager.getConnectionStatus(params.connectionId);
	});

	// 注意：接收到的完整帧通过 'network:frame-received' 事件发送到渲染进程
	// 在 BaseConnection.handleCompleteFrame() 中处理
}
