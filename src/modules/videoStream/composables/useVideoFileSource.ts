/**
 * useVideoFileSource.ts
 * 视频文件流采集 Composable - 高清修复版
 */

import { ref, onUnmounted } from 'vue';

export function useVideoFileSource() {
	const stream = ref<MediaStream | null>(null);
	const videoTrack = ref<MediaStreamTrack | null>(null);
	const error = ref<string | null>(null);
	const isActive = ref(false);

	let internalVideo: HTMLVideoElement | null = null;

	/**
	 * 启动视频文件流
	 */
	async function start(file: File) {
		try {
			error.value = null;

			// 1. 创建 Video 元素
			internalVideo = document.createElement('video');
			internalVideo.muted = true;
			internalVideo.playsInline = true;
			internalVideo.loop = true;
			internalVideo.crossOrigin = 'anonymous';

			// === 核心修复 1: 确保浏览器全分辨率渲染 ===
			// 使用 fixed 定位而不是 absolute，防止页面滚动影响
			internalVideo.style.position = 'fixed';
			internalVideo.style.top = '0';
			internalVideo.style.left = '0';
			// 极低透明度，但不是 0，防止浏览器彻底丢弃渲染层
			internalVideo.style.opacity = '0.01';
			internalVideo.style.zIndex = '-9999';
			// 关键：不设置 CSS 的 width/height 为 1px，
			// 而是等待 metadata 加载后设置 HTML 属性
			internalVideo.style.pointerEvents = 'none';

			document.body.appendChild(internalVideo);

			const url = URL.createObjectURL(file);
			internalVideo.src = url;

			// 2. 等待元数据并锁定分辨率
			await new Promise((resolve, reject) => {
				if (!internalVideo) return reject(new Error('Internal video is null'));

				const timeout = setTimeout(() => reject(new Error('视频加载超时')), 5000);

				internalVideo.onloadedmetadata = () => {
					clearTimeout(timeout);
					if (internalVideo) {
						// === 核心修复 2: 强制 HTML 属性等于原始视频尺寸 ===
						// 这告诉 captureStream：“请按这个分辨率给我数据”
						internalVideo.width = internalVideo.videoWidth;
						internalVideo.height = internalVideo.videoHeight;

						console.log(
							`[useVideoFileSource] Source Dimensions: ${internalVideo.videoWidth}x${internalVideo.videoHeight}`
						);
					}
					resolve(true);
				};

				internalVideo.onerror = () => {
					clearTimeout(timeout);
					reject(new Error(`视频加载错误: ${internalVideo?.error?.message}`));
				};
			});

			try {
				await internalVideo.play();
			} catch (e) {
				throw new Error('无法播放: ' + (e instanceof Error ? e.message : String(e)));
			}

			// 3. 捕获流
			// @ts-ignore
			const mediaStream = internalVideo.captureStream() as MediaStream;
			if (!mediaStream) throw new Error('捕获流失败');

			// 移除音频
			mediaStream.getAudioTracks().forEach((t) => t.stop());

			stream.value = mediaStream;
			videoTrack.value = mediaStream.getVideoTracks()[0] || null;
			isActive.value = true;

			// 再次打印确认最终轨道的设置
			const settings = videoTrack.value?.getSettings();
			console.log(
				'[useVideoFileSource] Final Stream Settings:',
				settings?.width,
				'x',
				settings?.height
			);
		} catch (err) {
			error.value = err instanceof Error ? err.message : '启动失败';
			console.error('[useVideoFileSource]', err);
			stop();
		}
	}

	function stop() {
		if (stream.value) {
			stream.value.getTracks().forEach((track) => track.stop());
			stream.value = null;
			videoTrack.value = null;
		}

		if (internalVideo) {
			internalVideo.pause();
			if (internalVideo.src) URL.revokeObjectURL(internalVideo.src);
			internalVideo.load();
			if (internalVideo.parentNode) {
				internalVideo.parentNode.removeChild(internalVideo);
			}
			internalVideo = null;
		}

		isActive.value = false;
	}

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
