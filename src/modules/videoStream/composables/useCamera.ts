/**
 * 摄像头采集 Composable
 * 负责请求摄像头权限并获取 MediaStream
 */

import { ref, onUnmounted } from 'vue';

export function useCamera() {
	const stream = ref<MediaStream | null>(null);
	const videoTrack = ref<MediaStreamTrack | null>(null);
	const error = ref<string | null>(null);
	const isActive = ref(false);

	/**
	 * 启动摄像头
	 * @param resolution 分辨率配置，默认 4K
	 */
	async function startCamera(
		resolution: { width: number; height: number } = { width: 3840, height: 2160 }
	) {
		try {
			error.value = null;

			// 请求摄像头权限
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: resolution.width },
					height: { ideal: resolution.height },
					frameRate: { ideal: 60 },
				},
				audio: false,
			});

			stream.value = mediaStream;
			videoTrack.value = mediaStream.getVideoTracks()[0];
			isActive.value = true;

			console.log('[useCamera] Camera started:', videoTrack.value?.getSettings());
		} catch (err) {
			error.value = err instanceof Error ? err.message : '摄像头启动失败';
			console.error('[useCamera] Error starting camera:', err);
		}
	}

	/**
	 * 停止摄像头
	 */
	function stopCamera() {
		if (stream.value) {
			stream.value.getTracks().forEach((track) => track.stop());
			stream.value = null;
			videoTrack.value = null;
			isActive.value = false;
			console.log('[useCamera] Camera stopped');
		}
	}

	// 组件卸载时自动停止摄像头
	onUnmounted(() => {
		stopCamera();
	});

	return {
		stream,
		videoTrack,
		error,
		isActive,
		startCamera,
		stopCamera,
	};
}
