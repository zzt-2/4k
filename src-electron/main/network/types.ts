/**
 * 网络连接相关的类型定义
 */

export interface ConnectionInfo {
	id: number;
	type: 'udp' | 'tcp-server' | 'tcp-client';
	localAddress?: string;
	localPort?: number;
	remoteAddress?: string;
	remotePort?: number;
}

export interface ConnectionStatus {
	state: 'connected' | 'disconnected' | 'error';
	bytesSent: number;
	bytesReceived: number;
	packetsSent: number;
	packetsReceived: number;
	lastError?: string;
}

export interface ClientInfo {
	id: string;
	address: string;
	port: number;
}
