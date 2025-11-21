/**
 * IPC 通信 Composable
 * 负责与主进程的视频帧通信
 */

import { onMounted, onUnmounted } from 'vue';
import type { ReceivedFrameData } from '../types';

// Electron IPC API (通过 preload 暴露)
declare global {
	interface Window {
		electronAPI?: {
			invoke: (channel: string, ...args: any[]) => Promise<any>;
			on: (channel: string, callback: (...args: any[]) => void) => void;
			removeListener: (channel: string, callback: (...args: any[]) => void) => void;
		};
	}
}

export function useVideoIPC() {
	/**
	 * 发送数据到主进程（自动分片）
	 * @param connectionId 连接 ID
	 * @param data 数据（已包含帧类型标志在前 4 字节）
	 * @param remoteAddress 远程地址
	 * @param remotePort 远程端口
	 */
	async function sendData(
		connectionId: number,
		data: Uint8Array,
		remoteAddress: string,
		remotePort: number
	): Promise<{ success: boolean; error?: string }> {
		try {
			if (!window.electronAPI) {
				throw new Error('Electron API not available');
			}

			const result = await window.electronAPI.invoke('network-send-data', {
				connectionId,
				data: Array.from(data),
				remoteAddress,
				remotePort,
			});

			return result;
		} catch (error) {
			console.error('[useVideoIPC] Error sending data:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * 监听主进程发送的完整帧
	 * @param callback 接收到完整帧时的回调函数
	 */
	function onFrameReceived(callback: (frame: ReceivedFrameData) => void) {
		if (!window.electronAPI) {
			console.error('[useVideoIPC] Electron API not available');
			return () => {};
		}

		const handler = (_event: any, frame: ReceivedFrameData) => {
			callback(frame);
		};

		window.electronAPI.on('network:frame-received', handler);

		// 返回取消监听的函数
		return () => {
			if (window.electronAPI) {
				window.electronAPI.removeListener('network:frame-received', handler);
			}
		};
	}

	return {
		sendData,
		onFrameReceived,
	};
}
