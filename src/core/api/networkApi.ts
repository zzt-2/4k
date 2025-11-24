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
		data: ArrayBuffer;
		remoteAddress?: string;
		remotePort?: number;
	}) => window.electron.networkAPI.sendData(params),

	closeConnection: (params: { connectionId: number }) =>
		window.electron.networkAPI.closeConnection(params),

	getConnectionStatus: (params: { connectionId: number }) =>
		window.electron.networkAPI.getConnectionStatus(params),

	/**
	 * 监听视频帧接收
	 */
	onVideoFrame: (callback: (event: any, data: any) => void) =>
		window.electron.networkAPI.onVideoFrame(callback),

	/**
	 * 监听数据帧接收
	 */
	onDataFrame: (callback: (event: any, data: any) => void) =>
		window.electron.networkAPI.onDataFrame(callback),
};
