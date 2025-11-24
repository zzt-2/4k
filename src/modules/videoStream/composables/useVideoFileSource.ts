/**
 * 视频文件流采集 Composable
 * 负责处理视频文件播放并获取 MediaStream
 */

import { ref, onUnmounted } from 'vue';

export function useVideoFileSource() {
	const stream = ref<MediaStream | null>(null);
	const videoTrack = ref<MediaStreamTrack | null>(null);
	const error = ref<string | null>(null);
	const isActive = ref(false);
	let videoElement: HTMLVideoElement | null = null;

	/**
	 * 启动视频文件流
	 * @param file 视频文件
	 * @param videoEl 视频元素引用
	 */
	async function start(file: File, videoEl: HTMLVideoElement) {
		try {
			error.value = null;
			videoElement = videoEl;

			// 创建 URL 并播放
			const url = URL.createObjectURL(file);
			videoElement.src = url;
			videoElement.loop = true;

			await videoElement.play();

			// 获取流 (captureStream 是非标准 API，但在 Chrome/Electron 中可用)
			// @ts-ignore: captureStream exists in Chrome/Electron
			const mediaStream = videoElement.captureStream() as MediaStream;

			if (!mediaStream) {
				throw new Error('无法从视频元素捕获流');
			}

			const audioTracks = mediaStream.getAudioTracks();
			audioTracks.forEach((track) => track.stop());

			stream.value = mediaStream;
			videoTrack.value = mediaStream.getVideoTracks()[0] || null;
			isActive.value = true;

			console.log(
				'[useVideoFileSource] Video file stream started:',
				videoTrack.value?.getSettings()
			);
		} catch (err) {
			error.value = err instanceof Error ? err.message : '视频文件启动失败';
			console.error('[useVideoFileSource] Error starting video file:', err);
			stop();
		}
	}

	/**
	 * 停止视频文件流
	 */
	function stop() {
		if (stream.value) {
			stream.value.getTracks().forEach((track) => track.stop());
			stream.value = null;
			videoTrack.value = null;
		}

		if (videoElement) {
			videoElement.pause();
			if (videoElement.src) {
				URL.revokeObjectURL(videoElement.src);
				videoElement.removeAttribute('src');
			}
			videoElement.load();
			videoElement = null;
		}

		isActive.value = false;
		console.log('[useVideoFileSource] Video file stream stopped');
	}

	// 组件卸载时自动停止
	onUnmounted(() => {
		stop();
	});

	return {
		stream,
		videoTrack,
		error,
		isActive,
		start,
		stop,
	};
}
