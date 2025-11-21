/**
 * H.265 解码器 Composable
 * 使用 WebCodecs API 进行硬件加速的 H.265 解码
 */

import { ref, onUnmounted } from 'vue';

export function useH265Decoder() {
	const decoder = ref<VideoDecoder | null>(null);
	const isDecoding = ref(false);
	const error = ref<string | null>(null);

	// 解码帧回调
	let onDecodedFrameCallback: ((videoFrame: VideoFrame) => void) | null = null;

	/**
	 * 初始化解码器
	 * @param width 视频宽度
	 * @param height 视频高度
	 */
	async function initDecoder(width: number = 3840, height: number = 2160) {
		try {
			error.value = null;

			// 检查 H.265 支持
			const config: VideoDecoderConfig = {
				codec: 'hevc', // H.265
				codedWidth: width,
				codedHeight: height,
				hardwareAcceleration: 'prefer-hardware',
			};

			const support = await VideoDecoder.isConfigSupported(config);
			if (!support.supported) {
				throw new Error('H.265 解码不受支持，请安装 HEVC 视频扩展');
			}

			// 创建解码器
			decoder.value = new VideoDecoder({
				output: handleDecodedFrame,
				error: (err) => {
					error.value = err.message;
					console.error('[useH265Decoder] Decoder error:', err);
				},
			});

			decoder.value.configure(config);
			isDecoding.value = true;

			console.log('[useH265Decoder] Decoder initialized:', config);
		} catch (err) {
			error.value = err instanceof Error ? err.message : '解码器初始化失败';
			console.error('[useH265Decoder] Error initializing decoder:', err);
		}
	}

	/**
	 * 处理解码后的视频帧
	 */
	function handleDecodedFrame(videoFrame: VideoFrame) {
		if (onDecodedFrameCallback) {
			onDecodedFrameCallback(videoFrame);
		} else {
			// 如果没有回调，立即释放帧
			videoFrame.close();
		}
	}

	/**
	 * 解码编码数据
	 * @param data 编码后的数据
	 * @param timestamp 时间戳
	 * @param isKeyFrame 是否为关键帧
	 */
	function decodeChunk(data: Uint8Array, timestamp: number, isKeyFrame: boolean = false) {
		if (!decoder.value || !isDecoding.value) {
			console.warn('[useH265Decoder] Decoder not initialized');
			return;
		}

		try {
			const chunk = new EncodedVideoChunk({
				type: isKeyFrame ? 'key' : 'delta',
				timestamp,
				data,
			});

			decoder.value.decode(chunk);
		} catch (err) {
			console.error('[useH265Decoder] Error decoding chunk:', err);
		}
	}

	/**
	 * 设置解码帧回调
	 * @param callback 解码完成后的回调函数
	 */
	function onDecodedFrame(callback: (videoFrame: VideoFrame) => void) {
		onDecodedFrameCallback = callback;
	}

	/**
	 * 绘制 VideoFrame 到 Canvas
	 * @param videoFrame VideoFrame 对象
	 * @param canvas Canvas 元素
	 */
	function drawFrameToCanvas(videoFrame: VideoFrame, canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// 设置 canvas 尺寸
		if (canvas.width !== videoFrame.displayWidth || canvas.height !== videoFrame.displayHeight) {
			canvas.width = videoFrame.displayWidth;
			canvas.height = videoFrame.displayHeight;
		}

		// 绘制帧
		ctx.drawImage(videoFrame, 0, 0, canvas.width, canvas.height);

		// 释放帧
		videoFrame.close();
	}

	/**
	 * 停止解码
	 */
	async function stopDecoding() {
		if (decoder.value) {
			await decoder.value.flush();
			decoder.value.close();
			decoder.value = null;
		}
		isDecoding.value = false;
		onDecodedFrameCallback = null;
		console.log('[useH265Decoder] Decoder stopped');
	}

	// 组件卸载时自动停止解码
	onUnmounted(() => {
		stopDecoding();
	});

	return {
		decoder,
		isDecoding,
		error,
		initDecoder,
		decodeChunk,
		onDecodedFrame,
		drawFrameToCanvas,
		stopDecoding,
	};
}
