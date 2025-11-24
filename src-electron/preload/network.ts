import { ipcRenderer } from 'electron';

export const networkAPI = {
	createConnection: (params: {
		type: 'udp' | 'tcp-server' | 'tcp-client';
		localAddress?: string;
		localPort?: number;
		remoteAddress?: string;
		remotePort?: number;
	}) => ipcRenderer.invoke('network-create-connection', params),

	getAllConnections: () => ipcRenderer.invoke('network-get-all-connections'),

	sendData: (params: {
		connectionId: number;
		data: ArrayBuffer;
		remoteAddress?: string;
		remotePort?: number;
	}) => ipcRenderer.invoke('network-send-data', params),

	closeConnection: (params: { connectionId: number }) =>
		ipcRenderer.invoke('network-close-connection', params),

	getConnectionStatus: (params: { connectionId: number }) =>
		ipcRenderer.invoke('network-get-status', params),

	/**
	 * 监听视频帧接收
	 */
	onVideoFrame: (callback: (event: any, data: any) => void) => {
		ipcRenderer.on('network:video-frame', callback);
		return () => ipcRenderer.removeListener('network:video-frame', callback);
	},

	/**
	 * 监听数据帧接收
	 */
	onDataFrame: (callback: (event: any, data: any) => void) => {
		ipcRenderer.on('network:data-frame', callback);
		return () => ipcRenderer.removeListener('network:data-frame', callback);
	},
};
