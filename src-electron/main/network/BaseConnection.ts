import { ConnectionInfo, ConnectionStatus } from './types';
import { FrameReassembler, CompleteFrame } from './utils/reassembler';
import { BrowserWindow } from 'electron';

/**
 * 网络连接基类
 * 提供所有连接类型的共同功能
 */
export abstract class BaseConnection {
	protected _id: number;
	protected stats: ConnectionStatus;
	protected frameReassembler: FrameReassembler;

	constructor(id: number) {
		this._id = id;
		this.stats = {
			state: 'disconnected',
			bytesSent: 0,
			bytesReceived: 0,
			packetsSent: 0,
			packetsReceived: 0,
		};

		// 初始化帧重组器
		this.frameReassembler = new FrameReassembler(
			this.handleCompleteFrame.bind(this),
			2000 // 2 秒超时
		);
	}

	/**
	 * 获取连接 ID
	 */
	get id(): number {
		return this._id;
	}

	/**
	 * 获取连接类型（子类必须实现）
	 */
	abstract get type(): 'udp' | 'tcp-server' | 'tcp-client';

	/**
	 * 获取连接状态
	 */
	getStatus(): ConnectionStatus {
		return { ...this.stats };
	}

	/**
	 * 更新发送统计
	 */
	protected updateSendStats(bytes: number): void {
		this.stats.bytesSent += bytes;
		this.stats.packetsSent += 1;
	}

	/**
	 * 更新接收统计
	 */
	protected updateReceiveStats(bytes: number): void {
		this.stats.bytesReceived += bytes;
		this.stats.packetsReceived += 1;
	}

	/**
	 * 设置错误状态
	 */
	protected setError(error: string): void {
		this.stats.state = 'error';
		this.stats.lastError = error;
	}

	/**
	 * 设置连接状态
	 */
	protected setState(state: 'connected' | 'disconnected' | 'error'): void {
		this.stats.state = state;
	}

	/**
	 * 处理接收到的数据
	 * 子类在接收到数据时调用此方法
	 */
	protected handleDataReceived(data: Buffer, remoteAddress: string, remotePort: number): void {
		// 更新接收统计
		this.updateReceiveStats(data.length);

		// 传递给帧重组器处理
		this.frameReassembler.processPacket(data);

		// 保留旧的回调接口（用于非视频流数据）
		this.onDataReceived(data, remoteAddress, remotePort);
	}

	/**
	 * 处理完整帧（重组完成后的回调）
	 * @param frame 完整帧数据
	 */
	protected handleCompleteFrame(frame: CompleteFrame): void {
		// 通过 IPC 发送到渲染进程
		const mainWindow = BrowserWindow.getAllWindows()[0];
		if (mainWindow) {
			mainWindow.webContents.send('network:frame-received', {
				connectionId: this._id,
				frameTypeMagic: frame.frameTypeMagic,
				frameId: frame.frameId,
				timestamp: frame.timestamp,
				data: Array.from(frame.data), // 转换为数组以便 IPC 传输
			});
		}
	}

	/**
	 * 数据接收回调（预留接口）
	 * 子类可以重写此方法以自定义处理逻辑
	 */
	protected onDataReceived(data: Buffer, remoteAddress: string, remotePort: number): void {
		// 默认实现：暂不处理
		// 用于非视频流数据的处理
	}

	/**
	 * 发送数据（子类必须实现）
	 */
	abstract send(data: Buffer, target?: { address: string; port: number }): Promise<number>;

	/**
	 * 关闭连接（子类必须实现）
	 */
	abstract close(): void;

	/**
	 * 获取连接信息（子类必须实现）
	 */
	abstract getInfo(): ConnectionInfo;

	/**
	 * 销毁连接（清理资源）
	 */
	destroy(): void {
		this.frameReassembler.destroy();
	}
}
