/**
 * 帧管理器
 * 统一管理所有帧类型的收发、组帧和解析操作
 */

import { ref, computed } from 'vue';
import type { InjectionKey } from 'vue';
import {
	FRAME_DEFINITIONS,
	getFrameDefinitionById,
	type FrameId,
	type FrameDefinition,
	type FrameField,
	type ParsedFrame,
	type ParsedDataFrame,
} from '../types/protocol';
import { networkAPI } from '@core/api';

// =============== 类型定义 ===============

export type FrameManager = ReturnType<typeof createFrameManager>;
const FRAME_MANAGER_KEY: InjectionKey<FrameManager> = Symbol('frame-manager');

type VideoFrameCallback = (frame: ParsedFrame) => void;
type DataFrameCallback = (frame: ParsedDataFrame) => void;

// =============== 创建管理器 ===============

function createFrameManager() {
	// =============== 状态管理 ===============

	// 视频帧回调
	const videoFrameCallbacks = new Set<VideoFrameCallback>();

	// 数据帧回调（按帧ID分类）
	const dataFrameCallbacks = new Map<FrameId, Set<DataFrameCallback>>();

	// 帧数据存储（用于组帧）
	const frames = ref<Record<FrameId, FrameDefinition & { fields: FrameField[] }>>({} as any);

	// 统计信息
	const frameCounters = new Map<FrameId, number>();

	// =============== 计算属性 ===============

	const totalFrameCount = computed(() => {
		let total = 0;
		frameCounters.forEach((count) => (total += count));
		return total;
	});

	// =============== 组帧操作 ===============

	/**
	 * 组装 video-frame（添加魔数前缀）
	 * @param data 视频数据
	 * @returns 带魔数的完整数据
	 */
	const assembleVideoFrame = (data: Uint8Array): Uint8Array => {
		const magic = FRAME_DEFINITIONS.VIDEO_FRAME.magic;
		const result = new Uint8Array(4 + data.length);

		// 写入魔数（大端序）
		result[0] = (magic >> 24) & 0xff;
		result[1] = (magic >> 16) & 0xff;
		result[2] = (magic >> 8) & 0xff;
		result[3] = magic & 0xff;

		// 复制数据
		result.set(data, 4);

		return result;
	};

	/**
	 * 组装 data-frame（根据字段定义）
	 * @param frameId 帧ID
	 * @returns 组装后的数据
	 */
	const assembleDataFrame = (frameId: FrameId): Uint8Array => {
		const frame = frames.value[frameId];
		if (!frame) {
			throw new Error(`Frame not found: ${frameId}`);
		}

		// 计算总长度
		let totalLength = 0;
		for (const field of frame.fields) {
			totalLength += field.length;
		}

		const buffer = new Uint8Array(totalLength);
		let offset = 0;

		// 写入各字段
		for (const field of frame.fields) {
			writeField(buffer, offset, field);
			offset += field.length;
		}

		return buffer;
	};

	/**
	 * 写入字段值到 buffer
	 */
	const writeField = (buffer: Uint8Array, offset: number, field: FrameField): void => {
		const value = field.value;

		switch (field.type) {
			case 'uint8':
				buffer[offset] = value & 0xff;
				break;
			case 'uint16':
				buffer[offset] = (value >> 8) & 0xff;
				buffer[offset + 1] = value & 0xff;
				break;
			case 'uint32':
				buffer[offset] = (value >> 24) & 0xff;
				buffer[offset + 1] = (value >> 16) & 0xff;
				buffer[offset + 2] = (value >> 8) & 0xff;
				buffer[offset + 3] = value & 0xff;
				break;
			case 'string':
				const encoder = new TextEncoder();
				const encoded = encoder.encode(value);
				buffer.set(encoded.slice(0, field.length), offset);
				break;
			case 'buffer':
				buffer.set(value.slice(0, field.length), offset);
				break;
		}
	};

	// =============== 解析操作 ===============

	/**
	 * 解析 data-frame
	 */
	const parseDataFrame = (data: Uint8Array): ParsedDataFrame | null => {
		if (data.length < 4) return null;

		// 读取魔数
		const magic = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
		const definition = Object.values(FRAME_DEFINITIONS).find(
			(def) => def.magic === magic && def.category === 'data-frame'
		);

		if (!definition) return null;

		// 解析字段
		const fieldValues: Record<string, any> = {};
		let offset = 0;

		for (const field of definition.fields) {
			fieldValues[field.name] = readField(data, offset, field);
			offset += field.length;
		}

		return {
			connectionId: 0, // 将由调用者设置
			definition,
			frameId: 0,
			timestamp: Date.now(),
			fields: fieldValues,
		};
	};

	/**
	 * 从 buffer 读取字段值
	 */
	const readField = (buffer: Uint8Array, offset: number, field: FrameField): any => {
		switch (field.type) {
			case 'uint8':
				return buffer[offset];
			case 'uint16':
				return (buffer[offset] << 8) | buffer[offset + 1];
			case 'uint32':
				return (
					(buffer[offset] << 24) |
					(buffer[offset + 1] << 16) |
					(buffer[offset + 2] << 8) |
					buffer[offset + 3]
				);
			case 'string':
				const decoder = new TextDecoder();
				return decoder.decode(buffer.slice(offset, offset + field.length)).replace(/\0/g, '');
			case 'buffer':
				return buffer.slice(offset, offset + field.length);
			default:
				return null;
		}
	};

	// =============== 回调注册 ===============

	/**
	 * 注册 video-frame 回调
	 */
	const onVideoFrame = (callback: VideoFrameCallback): (() => void) => {
		videoFrameCallbacks.add(callback);
		return () => videoFrameCallbacks.delete(callback);
	};

	/**
	 * 注册 data-frame 回调
	 */
	const onDataFrame = (frameId: FrameId, callback: DataFrameCallback): (() => void) => {
		if (!dataFrameCallbacks.has(frameId)) {
			dataFrameCallbacks.set(frameId, new Set());
		}
		dataFrameCallbacks.get(frameId)!.add(callback);

		return () => {
			dataFrameCallbacks.get(frameId)?.delete(callback);
		};
	};

	// =============== 帧处理 ===============

	/**
	 * 处理接收到的 video-frame
	 */
	const handleVideoFrame = (frame: ParsedFrame): void => {
		frameCounters.set('VIDEO_FRAME', (frameCounters.get('VIDEO_FRAME') || 0) + 1);

		const frameData = {
			...frame,
			data: new Uint8Array(frame.data as any),
		};

		videoFrameCallbacks.forEach((cb) => cb(frameData));
	};

	/**
	 * 处理接收到的 data-frame
	 */
	const handleDataFrameReceived = (data: { connectionId: number; data: number[] }): void => {
		const parsed = parseDataFrame(new Uint8Array(data.data));
		if (!parsed) return;

		parsed.connectionId = data.connectionId;

		const frameId = parsed.definition.id as FrameId;
		frameCounters.set(frameId, (frameCounters.get(frameId) || 0) + 1);

		const callbacks = dataFrameCallbacks.get(frameId);
		if (callbacks) {
			callbacks.forEach((cb) => cb(parsed));
		}
	};

	// =============== 发送帧 ===============

	/**
	 * 发送 video-frame
	 */
	const sendVideoFrame = async (
		connectionId: number,
		data: Uint8Array,
		remoteAddress: string,
		remotePort: number
	): Promise<{ success: boolean; error?: string }> => {
		try {
			if (!window.electron?.networkAPI) {
				throw new Error('Network API not available');
			}

			const frameData = assembleVideoFrame(data);

			const result = await networkAPI.sendData({
				connectionId,
				data: Array.from(frameData),
				remoteAddress,
				remotePort,
			});

			return result;
		} catch (error) {
			console.error('[FrameManager] Error sending video frame:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	};

	/**
	 * 发送 data-frame
	 */
	const sendDataFrame = async (
		connectionId: number,
		frameId: FrameId,
		remoteAddress: string,
		remotePort: number
	): Promise<{ success: boolean; error?: string }> => {
		try {
			if (!window.electron?.networkAPI) {
				throw new Error('Network API not available');
			}

			const frameData = assembleDataFrame(frameId);

			const result = await networkAPI.sendData({
				connectionId,
				data: Array.from(frameData),
				remoteAddress,
				remotePort,
			});

			return result;
		} catch (error) {
			console.error('[FrameManager] Error sending data frame:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	};

	/**
	 * 设置 data-frame 字段值
	 */
	const setFrameField = (frameId: FrameId, fieldName: string, value: any): void => {
		if (!frames.value[frameId]) {
			// 初始化帧
			const definition = getFrameDefinitionById(frameId);
			frames.value[frameId] = {
				...definition,
				fields: definition.fields.map((f) => ({ ...f })),
			};
		}

		const field = frames.value[frameId].fields.find((f) => f.name === fieldName);
		if (field) {
			field.value = value;
		}
	};

	/**
	 * 获取帧计数
	 */
	const getFrameCount = (frameId: FrameId): number => {
		return frameCounters.get(frameId) || 0;
	};

	// =============== 初始化 ===============

	const initialize = async (): Promise<void> => {
		// 初始化所有帧定义
		Object.entries(FRAME_DEFINITIONS).forEach(([key, def]) => {
			if (def.category === 'data-frame') {
				frames.value[key as FrameId] = {
					...def,
					fields: def.fields.map((f: FrameField) => ({ ...f })),
				};
			}
		});

		// 使用 networkAPI 监听主进程发送的帧
		if (window.electron?.networkAPI) {
			// 监听视频帧
			networkAPI.onVideoFrame((_event: any, frame: any) => {
				const parsedFrame: ParsedFrame = {
					connectionId: frame.connectionId,
					definition: FRAME_DEFINITIONS.VIDEO_FRAME,
					frameId: frame.frameId,
					timestamp: frame.timestamp,
					data: new Uint8Array(frame.data),
					isKeyFrame: frame.isKeyFrame,
				};
				handleVideoFrame(parsedFrame);
			});

			// 监听数据帧
			networkAPI.onDataFrame((_event: any, data: any) => {
				handleDataFrameReceived(data);
			});
		}
	};

	const destroy = (): void => {
		videoFrameCallbacks.clear();
		dataFrameCallbacks.clear();
		frameCounters.clear();
	};

	// =============== 返回所有内容 ===============

	return {
		// 状态
		frames,
		totalFrameCount,

		// 组帧
		assembleVideoFrame,
		assembleDataFrame,
		setFrameField,

		// 解析
		parseDataFrame,

		// 回调
		onVideoFrame,
		onDataFrame,

		// 发送
		sendVideoFrame,
		sendDataFrame,

		// 工具
		getFrameCount,
		initialize,
		destroy,
	};
}

// =============== Provide/Inject 函数 ===============

export function provideFrameManager() {
	const manager = createFrameManager();
	provideLocal(FRAME_MANAGER_KEY, manager);
	return manager;
}

export function useFrameManager() {
	const manager = injectLocal(FRAME_MANAGER_KEY);
	if (!manager) {
		throw new Error('useFrameManager must be called within provideFrameManager');
	}
	return manager;
}
