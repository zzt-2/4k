/**
 * 网络API封装
 * 提供网络连接操作的统一接口
 */

// 导出网络API
export const networkAPI = {
	createConnection: (params: {
		type: 'udp' | 'tcp-server' | 'tcp-client';
		localAddress?: string;
		localPort?: number;
		remoteAddress?: string;
		remotePort?: number;
	}) => window.electron.networkAPI.createConnection(params),

	getAllConnections: () => window.electron.networkAPI.getAllConnections(),

	sendData: (params: {
		connectionId: number;
		data: number[];
		remoteAddress?: string;
		remotePort?: number;
	}) => window.electron.networkAPI.sendData(params),

	closeConnection: (params: { connectionId: number }) =>
		window.electron.networkAPI.closeConnection(params),

	getConnectionStatus: (params: { connectionId: number }) =>
		window.electron.networkAPI.getConnectionStatus(params),

	// TODO: 预留数据接收监听
	// onDataReceived: (callback: (data: any) => void) => { ... }
};
