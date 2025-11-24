import dgram from 'dgram';
import { BaseConnection } from './BaseConnection';
import { ConnectionInfo } from './types';

interface UDPConnectionParams {
	localAddress: string;
	localPort: number;
}

export class UDPConnection extends BaseConnection {
	private socket: dgram.Socket;
	private localAddress: string;
	private localPort: number;

	constructor(id: number, params: UDPConnectionParams) {
		super(id);
		this.localAddress = params.localAddress;
		this.localPort = params.localPort;

		// 创建 UDP socket
		this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

		// 绑定端口
		this.socket.bind(this.localPort, this.localAddress, () => {
			// 设置 UDP 缓冲区大小为 8MB（用于 4K 视频流）
			try {
				this.socket.setRecvBufferSize(32 * 1024 * 1024); // 8MB 接收缓冲区
				this.socket.setSendBufferSize(32 * 1024 * 1024); // 8MB 发送缓冲区
				const recvSize = this.socket.getRecvBufferSize();
				const sendSize = this.socket.getSendBufferSize();
				console.log(`[UDPConnection] Buffer sizes set. Recv: ${recvSize}, Send: ${sendSize}`);
			} catch (error) {
				console.warn('[UDPConnection] Failed to set buffer size:', error);
			}

			this.setState('connected');
		});

		// 监听接收数据
		this.socket.on('message', (msg, rinfo) => {
			this.handleDataReceived(msg, rinfo.address, rinfo.port);
		});

		// 监听错误
		this.socket.on('error', (err) => {
			this.setError(err.message);
		});
	}

	get type(): 'udp' | 'tcp-server' | 'tcp-client' {
		return 'udp';
	}

	/**
	 * 发送数据
	 * 注意：数据应该已经由 fragmenter 分片并添加协议头
	 */
	async send(data: Buffer, target?: { address: string; port: number }): Promise<number> {
		if (!target || !target.address || !target.port) {
			throw new Error('UDP 发送需要指定目标地址和端口');
		}

		return new Promise<number>((resolve, reject) => {
			this.socket.send(data, target.port, target.address, (err, bytes) => {
				if (err) {
					this.setError(err.message);
					reject(err);
				} else {
					this.updateSendStats(bytes);
					resolve(bytes);
				}
			});
		});
	}

	/**
	 * 关闭连接
	 */
	close(): void {
		this.destroy(); // 清理帧重组器
		this.socket.close();
		this.setState('disconnected');
	}

	/**
	 * 获取连接信息
	 */
	getInfo(): ConnectionInfo {
		return {
			id: this._id,
			type: 'udp',
			localAddress: this.localAddress,
			localPort: this.localPort,
		};
	}
}
