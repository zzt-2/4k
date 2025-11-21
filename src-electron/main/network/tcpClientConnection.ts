import net from 'net';
import { BaseConnection } from './BaseConnection';
import { ConnectionInfo } from './types';

interface TCPClientConnectionParams {
	remoteAddress: string;
	remotePort: number;
}

export class TCPClientConnection extends BaseConnection {
	private socket: net.Socket;
	private remoteAddress: string;
	private remotePort: number;
	private isConnected: boolean;

	constructor(id: number, params: TCPClientConnectionParams) {
		super(id);
		this.remoteAddress = params.remoteAddress;
		this.remotePort = params.remotePort;
		this.isConnected = false;

		// 创建 TCP Client
		this.socket = new net.Socket();

		// 连接到服务器
		this.socket.connect(this.remotePort, this.remoteAddress, () => {
			this.isConnected = true;
			this.setState('connected');
		});

		// 监听接收数据
		this.socket.on('data', (data) => {
			this.handleDataReceived(data, this.remoteAddress, this.remotePort);
		});

		// 监听连接关闭
		this.socket.on('close', () => {
			this.isConnected = false;
			this.setState('disconnected');
		});

		// 监听错误
		this.socket.on('error', (err) => {
			this.isConnected = false;
			this.setError(err.message);
		});
	}

	get type(): 'udp' | 'tcp-server' | 'tcp-client' {
		return 'tcp-client';
	}

	/**
	 * 发送数据
	 */
	async send(data: Buffer): Promise<number> {
		if (!this.isConnected) {
			throw new Error('TCP 客户端未连接');
		}

		return new Promise((resolve, reject) => {
			this.socket.write(data, (err) => {
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
	 * 关闭连接
	 */
	close(): void {
		this.socket.destroy();
		this.isConnected = false;
		this.setState('disconnected');
	}

	/**
	 * 获取连接信息
	 */
	getInfo(): ConnectionInfo {
		return {
			id: this._id,
			type: 'tcp-client',
			remoteAddress: this.remoteAddress,
			remotePort: this.remotePort,
		};
	}
}
