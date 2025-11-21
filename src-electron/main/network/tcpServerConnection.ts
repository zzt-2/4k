import net from 'net';
import { BaseConnection } from './BaseConnection';
import { ConnectionInfo, ClientInfo } from './types';

interface TCPServerConnectionParams {
	localAddress: string;
	localPort: number | undefined;
}

export class TCPServerConnection extends BaseConnection {
	private server: net.Server;
	private localAddress: string;
	private localPort: number | undefined;
	private clients: Map<string, net.Socket>;
	private clientIdCounter: number;

	constructor(id: number, params: TCPServerConnectionParams) {
		super(id);
		this.localAddress = params.localAddress;
		this.localPort = params.localPort;
		this.clients = new Map();
		this.clientIdCounter = 1;

		// 创建 TCP Server
		this.server = net.createServer((socket) => {
			this.handleClientConnection(socket);
		});

		// 监听端口
		this.server.listen(this.localPort || 0, this.localAddress, () => {
			const address = this.server.address() as net.AddressInfo;
			this.localPort = address.port;
			this.setState('connected');
		});

		// 监听错误
		this.server.on('error', (err) => {
			this.setError(err.message);
		});
	}

	get type(): 'udp' | 'tcp-server' | 'tcp-client' {
		return 'tcp-server';
	}

	/**
	 * 处理客户端连接
	 */
	private handleClientConnection(socket: net.Socket): void {
		const clientId = `client_${this.clientIdCounter++}`;
		this.clients.set(clientId, socket);

		// 监听客户端数据
		socket.on('data', (data) => {
			this.handleDataReceived(data, socket.remoteAddress || '', socket.remotePort || 0);
		});

		// 监听客户端断开
		socket.on('close', () => {
			this.clients.delete(clientId);
		});

		// 监听客户端错误
		socket.on('error', (err) => {
			this.setError(err.message);
			this.clients.delete(clientId);
		});
	}

	/**
	 * 发送数据
	 * @param data 要发送的数据
	 * @param target 目标客户端（可选），不指定则广播给所有客户端
	 */
	async send(data: Buffer, target?: { address: string; port: number }): Promise<number> {
		let totalBytesSent = 0;

		if (target) {
			// 发送给指定客户端
			const targetClient = this.findClientByAddress(target.address, target.port);
			if (targetClient) {
				const bytesSent = await this.sendToClient(targetClient, data);
				totalBytesSent += bytesSent;
			} else {
				throw new Error(`未找到目标客户端: ${target.address}:${target.port}`);
			}
		} else {
			// 广播给所有客户端
			for (const socket of this.clients.values()) {
				const bytesSent = await this.sendToClient(socket, data);
				totalBytesSent += bytesSent;
			}
		}

		return totalBytesSent;
	}

	/**
	 * 向单个客户端发送数据
	 */
	private async sendToClient(socket: net.Socket, data: Buffer): Promise<number> {
		return new Promise((resolve, reject) => {
			socket.write(data, (err) => {
				if (err) {
					this.setError(err.message);
					reject(err);
				} else {
					this.updateSendStats(data.length);
					resolve(data.length);
				}
			});
		});
	}

	/**
	 * 根据地址和端口查找客户端
	 */
	private findClientByAddress(address: string, port: number): net.Socket | undefined {
		for (const socket of this.clients.values()) {
			if (socket.remoteAddress === address && socket.remotePort === port) {
				return socket;
			}
		}
		return undefined;
	}

	/**
	 * 获取所有已连接的客户端
	 */
	getClients(): ClientInfo[] {
		const clientList: ClientInfo[] = [];
		for (const [clientId, socket] of this.clients.entries()) {
			clientList.push({
				id: clientId,
				address: socket.remoteAddress || '',
				port: socket.remotePort || 0,
			});
		}
		return clientList;
	}

	/**
	 * 关闭服务器和所有客户端连接
	 */
	close(): void {
		// 关闭所有客户端连接
		for (const socket of this.clients.values()) {
			socket.destroy();
		}
		this.clients.clear();

		// 关闭服务器
		this.server.close();
		this.setState('disconnected');
	}

	/**
	 * 获取连接信息
	 */
	getInfo(): ConnectionInfo {
		const info: ConnectionInfo = {
			id: this._id,
			type: 'tcp-server',
		};
		if (this.localAddress !== undefined) {
			info.localAddress = this.localAddress;
		}
		if (this.localPort !== undefined) {
			info.localPort = this.localPort;
		}
		return info;
	}
}
