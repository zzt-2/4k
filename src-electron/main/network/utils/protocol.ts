/**
 * 视频流传输协议定义
 * 12 字节协议头：数据类型标志(4) + 帧ID(2) + 分片序号(2) + 总分片数(2) + 时间戳(2)
 */

/**
 * 数据类型魔数枚举
 * 使用 4 字节魔数标识不同的数据类型
 */
export enum FrameTypeMagic {
	/** 视频帧数据 - 'VIDF' */
	VIDEO_FRAME = 0x56494446,
	/** 统计数据 - 'STAT' */
	STATS_DATA = 0x53544154,
	/** 控制信号 - 'CTRL' */
	CONTROL_SIGNAL = 0x4354524c,
}

/**
 * 帧头结构接口
 */
export interface FrameHeader {
	/** 数据类型标志 (4 字节) */
	frameTypeMagic: FrameTypeMagic;
	/** 帧/数据包 ID (2 字节，0-65535 循环) */
	frameId: number;
	/** 分片序号 (2 字节，从 0 开始) */
	packetIndex: number;
	/** 总分片数 (2 字节) */
	totalPackets: number;
	/** 相对时间戳 (2 字节，毫秒级，循环使用) */
	timestamp: number;
}

/**
 * 协议头大小常量 (字节)
 */
export const FRAME_HEADER_SIZE = 12;

/**
 * 从 Buffer 解析帧头
 * @param buffer 包含帧头的 Buffer（至少 12 字节）
 * @returns 解析后的帧头对象
 */
export function parseFrameHeader(buffer: Buffer): FrameHeader {
	if (buffer.length < FRAME_HEADER_SIZE) {
		throw new Error(`Buffer too small for frame header: ${buffer.length} < ${FRAME_HEADER_SIZE}`);
	}

	return {
		frameTypeMagic: buffer.readUInt32BE(0),
		frameId: buffer.readUInt16BE(4),
		packetIndex: buffer.readUInt16BE(6),
		totalPackets: buffer.readUInt16BE(8),
		timestamp: buffer.readUInt16BE(10),
	};
}

/**
 * 创建帧头 Buffer
 * @param header 帧头对象
 * @returns 12 字节的 Buffer
 */
export function createFrameHeader(header: FrameHeader): Buffer {
	const buffer = Buffer.allocUnsafe(FRAME_HEADER_SIZE);

	buffer.writeUInt32BE(header.frameTypeMagic, 0);
	buffer.writeUInt16BE(header.frameId & 0xffff, 4); // 确保在 0-65535 范围内
	buffer.writeUInt16BE(header.packetIndex & 0xffff, 6);
	buffer.writeUInt16BE(header.totalPackets & 0xffff, 8);
	buffer.writeUInt16BE(header.timestamp & 0xffff, 10);

	return buffer;
}

/**
 * 获取数据类型名称（用于调试）
 * @param magic 魔数
 * @returns 类型名称
 */
export function getFrameTypeName(magic: number): string {
	switch (magic) {
		case FrameTypeMagic.VIDEO_FRAME:
			return 'VIDEO_FRAME';
		case FrameTypeMagic.STATS_DATA:
			return 'STATS_DATA';
		case FrameTypeMagic.CONTROL_SIGNAL:
			return 'CONTROL_SIGNAL';
		default:
			return `UNKNOWN(0x${magic.toString(16).toUpperCase()})`;
	}
}
