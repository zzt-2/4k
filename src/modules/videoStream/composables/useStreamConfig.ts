/**
 * 视频流配置 Composable
 * 管理网络配置、视频源选择和连接状态
 */

import { ref, inject, provide, onUnmounted, type InjectionKey } from 'vue';
import { networkAPI } from '@core/api';

// 状态类型定义
export interface StreamConfigState {
	// 网络配置
	localAddress: string;
	localPort: number;
	remoteAddress: string;
	remotePort: number;

	// 视频源配置
	sourceType: 'camera' | 'video';
	selectedFile: File | null;

	// 连接状态
	connectionId: number | null;
	connectionStatus: any;
	networkError: string | null;
}

export type StreamConfig = ReturnType<typeof createStreamConfig>;
const STREAM_CONFIG_KEY: InjectionKey<StreamConfig> = Symbol('stream-config');

function createStreamConfig() {
	// 网络配置
	const localAddress = ref('127.0.0.1');
	const localPort = ref(8888);
	const remoteAddress = ref('127.0.0.1');
	const remotePort = ref(8888);

	// 视频源配置
	const sourceType = ref<'camera' | 'video'>('camera');
	const selectedFile = ref<File | null>(null);

	// 连接状态
	const connectionId = ref<number | null>(null);
	const connectionStatus = ref<any>(null);
	const networkError = ref<string | null>(null);

	let statusInterval: number | null = null;

	// 创建 UDP 连接
	async function createConnection() {
		try {
			networkError.value = null;

			const result = await networkAPI.createConnection({
				type: 'udp',
				localAddress: localAddress.value,
				localPort: localPort.value,
			});

			if (result.success) {
				connectionId.value = result.connectionId;
				console.log('[useStreamConfig] Connection created:', connectionId.value);
			} else {
				networkError.value = result.error || '创建连接失败';
			}
		} catch (error) {
			networkError.value = error instanceof Error ? error.message : '创建连接失败';
			console.error('[useStreamConfig] Error creating connection:', error);
		}
	}

	// 关闭连接
	async function closeConnection() {
		try {
			if (connectionId.value === null) return;

			await networkAPI.closeConnection({
				connectionId: connectionId.value,
			});

			connectionId.value = null;
			connectionStatus.value = null;

			console.log('[useStreamConfig] Connection closed');
		} catch (error) {
			console.error('[useStreamConfig] Error closing connection:', error);
		}
	}

	onUnmounted(() => {
		if (connectionId.value !== null) {
			closeConnection();
		}
	});

	return {
		localAddress,
		localPort,
		remoteAddress,
		remotePort,
		sourceType,
		selectedFile,
		connectionId,
		connectionStatus,
		networkError,
		createConnection,
		closeConnection,
	};
}

// =============== Provide/Inject 函数 ===============

export function provideStreamConfig() {
	const manager = createStreamConfig();
	provideLocal(STREAM_CONFIG_KEY, manager);
	return manager;
}

export function useStreamConfig() {
	const manager = injectLocal(STREAM_CONFIG_KEY);
	if (!manager) {
		throw new Error('useFrameManager must be called within provideFrameManager');
	}
	return manager;
}
