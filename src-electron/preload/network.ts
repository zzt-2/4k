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
		data: number[];
		remoteAddress?: string;
		remotePort?: number;
	}) => ipcRenderer.invoke('network-send-data', params),

	closeConnection: (params: { connectionId: number }) =>
		ipcRenderer.invoke('network-close-connection', params),

	getConnectionStatus: (params: { connectionId: number }) =>
		ipcRenderer.invoke('network-get-status', params),

	// TODO: 预留数据接收监听
	// onDataReceived: (callback: (data: any) => void) => { ... }
};
