/**
 * 视频流模块类型定义
 */

/**
 * 数据类型魔数枚举（与主进程保持一致）
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
 * 编码帧数据结构
 */
export interface EncodedFrameData {
	/** 帧类型魔数 */
	frameTypeMagic: FrameTypeMagic;
	/** 帧 ID */
	frameId: number;
	/** 时间戳 */
	timestamp: number;
	/** 编码后的数据 */
	data: Uint8Array;
	/** 是否为关键帧 */
	isKeyFrame?: boolean;
}

/**
 * 接收到的完整帧数据
 */
export interface ReceivedFrameData {
	/** 连接 ID */
	connectionId: number;
	/** 帧类型魔数 */
	frameTypeMagic: FrameTypeMagic;
	/** 帧 ID */
	frameId: number;
	/** 时间戳 */
	timestamp: number;
	/** 数据（数组格式，来自 IPC） */
	data: number[];
}

/**
 * 视频统计信息
 */
export interface VideoStats {
	/** 帧率 (fps) */
	fps: number;
	/** 码率 (kbps) */
	bitrate: number;
	/** 延迟 (ms) */
	latency: number;
	/** 丢帧数 */
	droppedFrames: number;
	/** 总帧数 */
	totalFrames: number;
}

/**
 * 控制信号类型
 */
export interface ControlSignal {
	/** 信号类型 */
	type: 'start' | 'stop' | 'adjust-bitrate' | 'adjust-resolution';
	/** 信号参数 */
	params?: Record<string, any>;
}
