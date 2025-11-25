/**
 * 视频文件流采集 Composable
 * 负责处理视频文件播放并获取 MediaStream
 * * 修复版：内部创建离屏 Video 元素，解决大屏/小屏分辨率不一致问题
 */

import { ref, onUnmounted } from 'vue';

export function useVideoFileSource() {
	const stream = ref<MediaStream | null>(null);
	const videoTrack = ref<MediaStreamTrack | null>(null);
	const error = ref<string | null>(null);
	const isActive = ref(false);

	// 内部私有变量，不依赖外部传入 DOM
	let internalVideo: HTMLVideoElement | null = null;

	/**
	 * 启动视频文件流
	 * @param file 视频文件
	 */
	async function start(file: File) {
		try {
			error.value = null;

			// 1. 创建 Video 元素
			internalVideo = document.createElement('video');
			internalVideo.muted = true; // 必须静音才能自动播放
			internalVideo.playsInline = true;
			internalVideo.loop = true;
			internalVideo.crossOrigin = 'anonymous';

			// 挂载到 DOM 但隐藏，确保浏览器分配渲染资源（解决部分浏览器 captureStream 问题）
			internalVideo.style.position = 'absolute';
			internalVideo.style.top = '-9999px';
			internalVideo.style.left = '-9999px';
			internalVideo.style.width = '1px';
			internalVideo.style.height = '1px';
			document.body.appendChild(internalVideo);

			// 2. 创建 URL
			const url = URL.createObjectURL(file);
			internalVideo.src = url;

			// 等待元数据加载
			await new Promise((resolve, reject) => {
				if (!internalVideo) return reject(new Error('Internal video is null'));

				const timeout = setTimeout(() => reject(new Error('视频元数据加载超时')), 5000);

				internalVideo.onloadedmetadata = () => {
					clearTimeout(timeout);
					resolve(true);
				};
				internalVideo.onerror = () => {
					clearTimeout(timeout);
					reject(new Error(`视频加载失败: ${internalVideo?.error?.message || '未知错误'}`));
				};
			});

			// 3. 播放并捕获流
			try {
				await internalVideo.play();
			} catch (e) {
				throw new Error(
					'无法播放视频(可能格式不支持): ' + (e instanceof Error ? e.message : String(e))
				);
			}

			// @ts-ignore: captureStream 在 Chrome/Electron 中可用
			const mediaStream = internalVideo.captureStream() as MediaStream;

			if (!mediaStream) {
				throw new Error('无法从视频元素捕获流');
			}

			// 移除音频轨道
			const audioTracks = mediaStream.getAudioTracks();
			audioTracks.forEach((track) => track.stop());

			stream.value = mediaStream;
			videoTrack.value = mediaStream.getVideoTracks()[0] || null;
			isActive.value = true;

			console.log(
				'[useVideoFileSource] Started. Resolution:',
				videoTrack.value?.getSettings().width,
				'x',
				videoTrack.value?.getSettings().height
			);
		} catch (err) {
			error.value = err instanceof Error ? err.message : '视频文件启动失败';
			console.error('[useVideoFileSource] Error:', err);
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

		if (internalVideo) {
			internalVideo.pause();
			if (internalVideo.src) {
				URL.revokeObjectURL(internalVideo.src);
				internalVideo.removeAttribute('src');
			}
			internalVideo.load();

			// 移除 DOM 元素
			if (internalVideo.parentNode) {
				internalVideo.parentNode.removeChild(internalVideo);
			}
			internalVideo = null;
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
		start, // 注意：这里的 start 不需要传 videoEl 了
		stop,
	};
}
