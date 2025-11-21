/**
 * 帧重组工具
 * 将接收到的分片重组为完整数据包
 */

import {
	parseFrameHeader,
	VIDEO_FRAME_HEADER_SIZE,
	getFrameTypeName,
	type VideoFrameHeader,
} from './protocol';
import type { FrameDefinition } from '../../../../src/core/types/protocol';

/**
 * 分片信息
 */
interface PacketFragment {
	/** 分片序号 */
	packetIndex: number;
	/** 分片数据（不含协议头） */
	data: Buffer;
	/** 接收时间戳 */
	receivedAt: number;
}

/**
 * 帧缓存信息
 */
interface FrameBuffer {
	/** 帧定义 */
	definition: FrameDefinition;
	/** 帧 ID */
	frameId: number;
	/** 总分片数 */
	totalPackets: number;
	/** 时间戳 */
	timestamp: number;
	/** 已接收的分片 */
	fragments: Map<number, PacketFragment>;
	/** 首次接收时间 */
	firstReceivedAt: number;
}

/**
 * 完整帧数据
 */
export interface CompleteFrame {
	/** 帧定义 */
	definition: FrameDefinition;
	/** 帧 ID */
	frameId: number;
	/** 时间戳 */
	timestamp: number;
	/** 完整数据 */
	data: Buffer;
}

/**
 * 帧重组器
 * 管理多个帧的并发重组
 */
export class FrameReassembler {
	/** 帧缓存 Map：key 为 frameId */
	private frameBuffers: Map<number, FrameBuffer>;

	/** 超时时间（毫秒），默认 2 秒 */
	private timeout: number;

	/** 清理定时器 */
	private cleanupTimer: NodeJS.Timeout | null;

	/** 完整帧回调 */
	private onCompleteFrame: (frame: CompleteFrame) => void;

	/**
	 * 构造函数
	 * @param onCompleteFrame 完整帧回调函数
	 * @param timeout 超时时间（毫秒），默认 2000ms
	 */
	constructor(onCompleteFrame: (frame: CompleteFrame) => void, timeout: number = 2000) {
		this.frameBuffers = new Map();
		this.timeout = timeout;
		this.cleanupTimer = null;
		this.onCompleteFrame = onCompleteFrame;

		// 启动定期清理任务
		this.startCleanupTimer();
	}

	/**
	 * 处理接收到的数据包
	 * @param packet 包含协议头的完整数据包
	 */
	public processPacket(packet: Buffer): void {
		if (packet.length < VIDEO_FRAME_HEADER_SIZE) {
			console.warn(`[FrameReassembler] Packet too small: ${packet.length} bytes`);
			return;
		}

		try {
			// 解析帧头
			const header = parseFrameHeader(packet);
			const { definition, frameId, packetIndex, totalPackets, timestamp } = header;

			// 提取数据部分（去掉协议头）
			const data = packet.subarray(VIDEO_FRAME_HEADER_SIZE);

			// 获取或创建帧缓存
			let frameBuffer = this.frameBuffers.get(frameId);
			if (!frameBuffer) {
				frameBuffer = {
					definition,
					frameId,
					totalPackets,
					timestamp,
					fragments: new Map(),
					firstReceivedAt: Date.now(),
				};
				this.frameBuffers.set(frameId, frameBuffer);
			}

			// 验证帧信息一致性
			if (frameBuffer.totalPackets !== totalPackets) {
				console.warn(
					`[FrameReassembler] Frame ${frameId}: totalPackets mismatch (${frameBuffer.totalPackets} vs ${totalPackets})`
				);
				return;
			}

			// 存储分片
			if (!frameBuffer.fragments.has(packetIndex)) {
				frameBuffer.fragments.set(packetIndex, {
					packetIndex,
					data,
					receivedAt: Date.now(),
				});
			}

			// 检查是否所有分片都已接收
			if (frameBuffer.fragments.size === totalPackets) {
				this.assembleAndEmit(frameBuffer);
				this.frameBuffers.delete(frameId);
			}
		} catch (error) {
			console.error('[FrameReassembler] Error processing packet:', error);
		}
	}

	/**
	 * 组装完整帧并触发回调
	 * @param frameBuffer 帧缓存
	 */
	private assembleAndEmit(frameBuffer: FrameBuffer): void {
		const { definition, frameId, totalPackets, timestamp, fragments } = frameBuffer;

		// 按分片序号排序并拼接数据
		const sortedFragments: Buffer[] = [];
		for (let i = 0; i < totalPackets; i++) {
			const fragment = fragments.get(i);
			if (!fragment) {
				console.error(`[FrameReassembler] Frame ${frameId}: missing fragment ${i}`);
				return;
			}
			sortedFragments.push(fragment.data);
		}

		const completeData = Buffer.concat(sortedFragments);

		// 触发回调
		const completeFrame: CompleteFrame = {
			definition,
			frameId,
			timestamp,
			data: completeData,
		};

		this.onCompleteFrame(completeFrame);

		console.log(
			`[FrameReassembler] Assembled frame ${frameId} (${getFrameTypeName(definition.magic)}): ${completeData.length} bytes from ${totalPackets} packets`
		);
	}

	/**
	 * 启动定期清理任务
	 */
	private startCleanupTimer(): void {
		this.cleanupTimer = setInterval(() => {
			this.cleanupExpiredFrames();
		}, 1000); // 每秒检查一次
	}

	/**
	 * 清理超时的帧缓存
	 */
	private cleanupExpiredFrames(): void {
		const now = Date.now();
		const expiredFrameIds: number[] = [];

		for (const [frameId, frameBuffer] of this.frameBuffers.entries()) {
			if (now - frameBuffer.firstReceivedAt > this.timeout) {
				expiredFrameIds.push(frameId);
				console.warn(
					`[FrameReassembler] Frame ${frameId} timeout: received ${frameBuffer.fragments.size}/${frameBuffer.totalPackets} packets`
				);
			}
		}

		// 删除超时的帧
		for (const frameId of expiredFrameIds) {
			this.frameBuffers.delete(frameId);
		}
	}

	/**
	 * 销毁重组器
	 */
	public destroy(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
		this.frameBuffers.clear();
	}

	/**
	 * 获取当前缓存的帧数量
	 */
	public getBufferedFrameCount(): number {
		return this.frameBuffers.size;
	}
}
