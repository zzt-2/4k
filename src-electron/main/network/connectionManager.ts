import { UDPConnection } from './udpConnection';
import { TCPServerConnection } from './tcpServerConnection';
import { TCPClientConnection } from './tcpClientConnection';
import { ConnectionInfo, ConnectionStatus, ClientInfo } from './types';
import { fragmentFrame, needsFragmentation, MTU } from './utils/fragmenter';

type Connection = UDPConnection | TCPServerConnection | TCPClientConnection;

interface CreateConnectionParams {
	type: 'udp' | 'tcp-server' | 'tcp-client';
	localAddress?: string;
	localPort?: number;
	remoteAddress?: string;
	remotePort?: number;
}

interface ConnectionInfoResponse {
	connectionId: number;
	type: 'udp' | 'tcp-server' | 'tcp-client';
	localAddress?: string;
	localPort?: number;
}

interface SendDataParams {
	connectionId: number;
	data: ArrayBuffer;
	remoteAddress?: string;
	remotePort?: number;
}

interface ConnectionStatusResponse {
	exists: boolean;
	connection?: ConnectionInfo;
	status?: ConnectionStatus;
	clients?: ClientInfo[];
}

class ConnectionManager {
	private connections: Map<number, Connection>;
	private nextId: number;
	private frameIdCounters: Map<number, number>; // 每个连接的帧 ID 计数器

	constructor() {
		this.connections = new Map();
		this.nextId = 1;
		this.frameIdCounters = new Map();
	}

	/**
	 * 创建连接
	 */
	createConnection(params: CreateConnectionParams): {
		success: boolean;
		connectionId?: number;
		error?: string;
	} {
		try {
			let connection: Connection;

			switch (params.type) {
				case 'udp':
					if (!params.localAddress || params.localPort === undefined) {
						return {
							success: false,
							error: 'UDP 连接需要指定 localAddress 和 localPort',
						};
					}
					connection = new UDPConnection(this.nextId, {
						localAddress: params.localAddress,
						localPort: params.localPort,
					});
					break;

				case 'tcp-server':
					if (!params.localAddress) {
						return {
							success: false,
							error: 'TCP Server 需要指定 localAddress',
						};
					}
					connection = new TCPServerConnection(this.nextId, {
						localAddress: params.localAddress,
						localPort: params.localPort,
					});
					break;

				case 'tcp-client':
					if (!params.remoteAddress || !params.remotePort) {
						return {
							success: false,
							error: 'TCP Client 需要指定 remoteAddress 和 remotePort',
						};
					}
					connection = new TCPClientConnection(this.nextId, {
						remoteAddress: params.remoteAddress,
						remotePort: params.remotePort,
					});
					break;

				default:
					return {
						success: false,
						error: `未知的连接类型: ${params.type}`,
					};
			}

			this.connections.set(this.nextId, connection);
			const connectionId = this.nextId;
			this.nextId++;

			return {
				success: true,
				connectionId,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * 获取所有连接
	 */
	getAllConnections(): ConnectionInfoResponse[] {
		const result: ConnectionInfoResponse[] = [];

		for (const connection of this.connections.values()) {
			const info = connection.getInfo();
			const item: ConnectionInfoResponse = {
				connectionId: info.id,
				type: info.type,
			};
			if (info.localAddress !== undefined) {
				item.localAddress = info.localAddress;
			}
			if (info.localPort !== undefined) {
				item.localPort = info.localPort;
			}
			result.push(item);
		}

		return result;
	}

	/**
	 * 发送数据（自动分片）
	 * 如果数据超过 MTU，自动分片发送
	 */
	async sendData(params: SendDataParams): Promise<{
		success: boolean;
		bytesSent?: number;
		packetsSent?: number;
		error?: string;
	}> {
		try {
			const connection = this.connections.get(params.connectionId);

			if (!connection) {
				return {
					success: false,
					error: `连接 ID ${params.connectionId} 不存在`,
				};
			}

			const buffer = Buffer.from(params.data);

			// 判断是否需要分片
			if (needsFragmentation(buffer.length)) {
				// 需要分片：获取或初始化帧 ID 计数器
				if (!this.frameIdCounters.has(params.connectionId)) {
					this.frameIdCounters.set(params.connectionId, 0);
				}

				const frameId = this.frameIdCounters.get(params.connectionId)!;
				this.frameIdCounters.set(params.connectionId, (frameId + 1) % 65536); // 循环使用 0-65535

				// 分片
				const packets = fragmentFrame(buffer, frameId);

				let totalBytesSent = 0;

				// 发送所有分片
				if (connection.type === 'udp') {
					if (!params.remoteAddress || !params.remotePort) {
						return {
							success: false,
							error: 'UDP 发送需要指定 remoteAddress 和 remotePort',
						};
					}

					for (const packet of packets) {
						const bytesSent = await connection.send(packet, {
							address: params.remoteAddress,
							port: params.remotePort,
						});
						totalBytesSent += bytesSent;
					}
				} else {
					return {
						success: false,
						error: '分片发送目前仅支持 UDP 连接',
					};
				}

				return {
					success: true,
					bytesSent: totalBytesSent,
					packetsSent: packets.length,
				};
			} else {
				// 不需要分片：直接发送
				let bytesSent: number;

				if (connection.type === 'udp') {
					if (!params.remoteAddress || !params.remotePort) {
						return {
							success: false,
							error: 'UDP 发送需要指定 remoteAddress 和 remotePort',
						};
					}
					bytesSent = await connection.send(buffer, {
						address: params.remoteAddress,
						port: params.remotePort,
					});
				} else if (connection.type === 'tcp-server') {
					if (params.remoteAddress && params.remotePort) {
						bytesSent = await connection.send(buffer, {
							address: params.remoteAddress,
							port: params.remotePort,
						});
					} else {
						bytesSent = await connection.send(buffer);
					}
				} else if (connection.type === 'tcp-client') {
					bytesSent = await connection.send(buffer);
				} else {
					return {
						success: false,
						error: '未知的连接类型',
					};
				}

				return {
					success: true,
					bytesSent,
					packetsSent: 1,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * 断开连接
	 */
	closeConnection(connectionId: number): {
		success: boolean;
		error?: string;
	} {
		try {
			const connection = this.connections.get(connectionId);

			if (!connection) {
				return {
					success: false,
					error: `连接 ID ${connectionId} 不存在`,
				};
			}

			connection.close();
			this.connections.delete(connectionId);

			return {
				success: true,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * 查询连接状态
	 */
	getConnectionStatus(connectionId: number): ConnectionStatusResponse {
		const connection = this.connections.get(connectionId);

		if (!connection) {
			return {
				exists: false,
			};
		}

		const info = connection.getInfo();
		const status = connection.getStatus();

		const response: ConnectionStatusResponse = {
			exists: true,
			connection: info,
			status,
		};

		// 如果是 TCP Server，添加客户端列表
		if (connection.type === 'tcp-server') {
			response.clients = (connection as TCPServerConnection).getClients();
		}

		return response;
	}
}

// 导出单例
export const connectionManager = new ConnectionManager();
