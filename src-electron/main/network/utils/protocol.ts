/**
 * 视频流传输协议定义（主进程专用）
 * 类型定义从 @/core/types/protocol 导入
 */

import {
	FRAME_DEFINITIONS,
	getFrameDefinitionByMagic,
	type FrameDefinition,
} from '../../../../src/core/types/protocol';

// video-frame 的固定帧头大小
export const VIDEO_FRAME_HEADER_SIZE = 12;

/**
 * 帧头结构（仅用于 video-frame）
 */
export interface VideoFrameHeader {
	/** 帧定义 */
	definition: FrameDefinition;
	/** 帧 ID (0-65535 循环) */
	frameId: number;
	/** 分片序号 */
	packetIndex: number;
	/** 总分片数 */
	totalPackets: number;
	/** 时间戳 (毫秒) */
	timestamp: number;
}

/**
 * 从 Buffer 解析帧头（仅用于 video-frame）
 * @param buffer 包含帧头的 Buffer（至少 12 字节）
 * @returns 解析后的帧头对象
 */
export function parseFrameHeader(buffer: Buffer): VideoFrameHeader {
	if (buffer.length < VIDEO_FRAME_HEADER_SIZE) {
		throw new Error(
			`Buffer too small for frame header: ${buffer.length} < ${VIDEO_FRAME_HEADER_SIZE}`
		);
	}

	const magic = buffer.readUInt32BE(0);
	const definition = getFrameDefinitionByMagic(magic);

	if (!definition || definition.category !== 'video-frame') {
		throw new Error(`Not a video frame: 0x${magic.toString(16).toUpperCase()}`);
	}

	return {
		definition,
		frameId: buffer.readUInt16BE(4),
		packetIndex: buffer.readUInt16BE(6),
		totalPackets: buffer.readUInt16BE(8),
		timestamp: buffer.readUInt16BE(10),
	};
}

/**
 * 创建帧头 Buffer（仅用于 video-frame）
 * @param frameId 帧 ID
 * @param packetIndex 分片序号
 * @param totalPackets 总分片数
 * @param timestamp 时间戳
 * @returns 12 字节的 Buffer
 */
export function createFrameHeader(
	frameId: number,
	packetIndex: number,
	totalPackets: number,
	timestamp: number
): Buffer {
	const buffer = Buffer.allocUnsafe(VIDEO_FRAME_HEADER_SIZE);

	buffer.writeUInt32BE(FRAME_DEFINITIONS.VIDEO_FRAME.magic, 0);
	buffer.writeUInt16BE(frameId & 0xffff, 4);
	buffer.writeUInt16BE(packetIndex & 0xffff, 6);
	buffer.writeUInt16BE(totalPackets & 0xffff, 8);
	buffer.writeUInt16BE(timestamp & 0xffff, 10);

	return buffer;
}

/**
 * 检测帧类别
 * @param buffer 数据 Buffer
 * @returns 帧类别
 */
export function detectFrameCategory(buffer: Buffer): 'video-frame' | 'data-frame' | 'unknown' {
	if (buffer.length < 4) return 'unknown';

	const magic = buffer.readUInt32BE(0);
	const definition = getFrameDefinitionByMagic(magic);

	return definition?.category || 'unknown';
}

/**
 * 获取帧类型名称（用于调试）
 * @param magic 魔数
 * @returns 类型名称
 */
export function getFrameTypeName(magic: number): string {
	const definition = getFrameDefinitionByMagic(magic);
	return definition ? definition.name : `UNKNOWN(0x${magic.toString(16).toUpperCase()})`;
}
