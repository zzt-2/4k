import { ConnectionInfo, ConnectionStatus } from './types';
import { FrameReassembler, CompleteFrame } from './utils/reassembler';
import { detectFrameCategory } from './utils/protocol';
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

		// 检测帧类别
		const category = detectFrameCategory(data);

		if (category === 'video-frame') {
			// 视频帧：传递给帧重组器处理（会自动调用 handleCompleteFrame）
			this.frameReassembler.processPacket(data);
		} else if (category === 'data-frame') {
			// 数据帧：直接发送到渲染进程（不需要分片重组）
			this.handleDataFrame(data);
		}
	}

	/**
	 * 处理数据帧（不需要重组）
	 * @param data 数据帧
	 */
	protected handleDataFrame(data: Buffer): void {
		const mainWindow = BrowserWindow.getAllWindows()[0];
		if (mainWindow) {
			mainWindow.webContents.send('network:data-frame', {
				connectionId: this._id,
				data: data,
			});
		}
	}

	/**
	 * 处理完整帧（重组完成后的回调，仅用于视频帧）
	 * @param frame 完整帧数据
	 */
	protected handleCompleteFrame(frame: CompleteFrame): void {
		// 通过 IPC 发送到渲染进程
		const mainWindow = BrowserWindow.getAllWindows()[0];
		if (mainWindow) {
			mainWindow.webContents.send('network:video-frame', {
				connectionId: this._id,
				frameId: frame.frameId,
				data: frame.data, // 纯数据，已移除帧头
				isKeyFrame: this.isKeyFrame(frame.data),
			});
		}
	}

	/**
	 * 检测是否为关键帧
	 * @param data 帧数据
	 */
	private isKeyFrame(data: Buffer): boolean {
		if (data.length < 5) return false;

		const len = data.length;
		let i = 0;

		while (i < len - 4) {
			// 1. 寻找 Start Code (00 00 01 或 00 00 00 01)
			if (data[i] === 0 && data[i + 1] === 0) {
				let naluIndex = -1;

				// 00 00 01
				if (data[i + 2] === 1) {
					naluIndex = i + 3;
					i += 3;
				}
				// 00 00 00 01
				else if (data[i + 2] === 0 && data[i + 3] === 1) {
					naluIndex = i + 4;
					i += 4;
				}

				if (naluIndex !== -1) {
					const header = data[naluIndex];

					// === H.264 判断逻辑 ===
					// 标识位: forbidden(1) + ref_idc(2) + type(5)
					const avcType = header & 0x1f;
					if (avcType === 5) return true; // IDR

					// === H.265 判断逻辑 ===
					// 标识位: forbidden(1) + type(6) + layer(6) + tid(3)
					// 需要右移1位取中间6位
					const hevcType = (header >> 1) & 0x3f;

					// 16-21 都是关键帧类型 (BLA, IDR, CRA)
					// 19 (IDR_W_RADL) 和 20 (IDR_N_LP) 是最常见的 IDR
					if (hevcType >= 16 && hevcType <= 21) {
						// console.log('Found H.265 Keyframe, type:', hevcType);
						return true;
					}

					continue;
				}
			}
			i++;
		}

		return false;
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
