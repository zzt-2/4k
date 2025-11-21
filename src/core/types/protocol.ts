/**
 * 帧协议类型定义
 * 主进程和渲染进程共享
 */

/**
 * 帧字段定义（仅用于 data-frame）
 */
export interface FrameField {
	/** 字段名称 */
	name: string;
	/** 字段类型 */
	type: 'uint8' | 'uint16' | 'uint32' | 'string' | 'buffer';
	/** 字段长度（字节），-1 表示可变长度 */
	length: number;
	/** 字段值（用于组帧时） */
	value?: any;
	/** 字段描述 */
	description: string;
}

/**
 * 帧定义结构
 */
export interface FrameDefinition {
	/** 帧 ID（唯一标识） */
	id: string;
	/** 帧名称 */
	name: string;
	/** 帧类别：video-frame（视频帧，写死）、data-frame（数据帧，需要字段定义） */
	category: 'video-frame' | 'data-frame';
	/** 帧头标志（4字节魔数） */
	magic: number;
	/** 帧字段定义（仅 data-frame 需要，video-frame 为空数组） */
	fields: FrameField[];
}

/**
 * 预定义的帧类型
 * 修改帧定义只需更新此对象
 */
export const FRAME_DEFINITIONS = {
	VIDEO_FRAME: {
		id: 'VIDEO_FRAME',
		name: '视频帧',
		category: 'video-frame',
		magic: 0x56494446, // 'VIDF'
		fields: [], // video-frame 不需要字段定义
	},
	STATS_DATA: {
		id: 'STATS_DATA',
		name: '统计数据',
		category: 'data-frame',
		magic: 0x53544154, // 'STAT'
		fields: [
			{ name: 'magic', type: 'uint32', length: 4, description: '帧头标志' },
			{ name: 'fps', type: 'uint16', length: 2, description: '帧率' },
			{ name: 'bitrate', type: 'uint32', length: 4, description: '码率(kbps)' },
			{ name: 'latency', type: 'uint16', length: 2, description: '延迟(ms)' },
			{ name: 'droppedFrames', type: 'uint16', length: 2, description: '丢帧数' },
		],
	},
	CONTROL_SIGNAL: {
		id: 'CONTROL_SIGNAL',
		name: '控制信号',
		category: 'data-frame',
		magic: 0x4354524c, // 'CTRL'
		fields: [
			{ name: 'magic', type: 'uint32', length: 4, description: '帧头标志' },
			{ name: 'command', type: 'uint8', length: 1, description: '命令类型' },
			{ name: 'param1', type: 'uint32', length: 4, description: '参数1' },
			{ name: 'param2', type: 'uint32', length: 4, description: '参数2' },
		],
	},
} as const satisfies Record<string, FrameDefinition>;

// 自动生成类型（外部类型只定义一次）
export type FrameId = keyof typeof FRAME_DEFINITIONS;

/**
 * 根据魔数获取帧定义
 */
export function getFrameDefinitionByMagic(magic: number): FrameDefinition | undefined {
	return Object.values(FRAME_DEFINITIONS).find((def) => def.magic === magic);
}

/**
 * 根据 ID 获取帧定义
 */
export function getFrameDefinitionById(id: FrameId): FrameDefinition {
	return FRAME_DEFINITIONS[id];
}

/**
 * 解析后的完整帧（主进程 -> 渲染进程）
 */
export interface ParsedFrame {
	/** 连接 ID */
	connectionId: number;
	/** 帧定义 */
	definition: FrameDefinition;
	/** 帧 ID */
	frameId: number;
	/** 时间戳 */
	timestamp: number;
	/** 纯数据（已移除帧头） */
	data: Uint8Array;
	/** 是否为关键帧（仅 video-frame） */
	isKeyFrame?: boolean;
}

/**
 * 解析后的数据帧（带字段值）
 */
export interface ParsedDataFrame extends Omit<ParsedFrame, 'data'> {
	/** 字段值 */
	fields: Record<string, any>;
}
