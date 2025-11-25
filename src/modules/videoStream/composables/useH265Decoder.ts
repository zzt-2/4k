/**
 * H.265 解码器 Composable
 * 使用 WebCodecs API 进行硬件加速的 H.265 解码
 */

import { ref, onUnmounted } from 'vue';

export function useH265Decoder() {
	const decoder = ref<VideoDecoder | null>(null);
	const isDecoding = ref(false);
	const error = ref<string | null>(null);

	let pendingFrame: VideoFrame | null = null;
	let renderLoopId: number | null = null;
	let canvasRef: HTMLCanvasElement | null = null;

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
			const baseConfig: VideoEncoderConfig = {
				codec: 'hvc1.1.6.L153.B0', // H.265
				// @ts-ignore: TS定义缺失，但运行时支持
				hevc: { format: 'annexb' },
				width: 3840,
				height: 2160,
				bitrate: 50_000_000,
				framerate: 60,
				hardwareAcceleration: 'prefer-hardware',
			};

			const support = await VideoEncoder.isConfigSupported(baseConfig);

			let config: VideoDecoderConfig = {
				codec: 'hvc1.1.6.L153.B0', // H.265
				codedWidth: width,
				codedHeight: height,
				hardwareAcceleration: 'prefer-hardware',
			};
			if (!support.supported) {
				console.warn('H.265 解码不受支持');
				config = {
					codec: 'avc1.420033', // H.264
					codedWidth: Math.min(width, 1920),
					codedHeight: Math.min(height, 1080),
					hardwareAcceleration: 'no-preference', // 既然没显卡，就不要强求 prefer-hardware 了，避免浏览器反复尝试
				};
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
	function decodeChunk(data: Uint8Array, isKeyFrame: boolean = false) {
		if (!decoder.value || !isDecoding.value) {
			console.warn('[useH265Decoder] Decoder not initialized');
			return;
		}

		try {
			const chunk = new EncodedVideoChunk({
				type: isKeyFrame ? 'key' : 'delta',
				timestamp: Date.now(),
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
		// 1. 保存 Canvas 引用
		canvasRef = canvas;

		// 2. 如果已经有待绘制的帧，说明上一帧还没画出去又来了一帧
		// 这时候直接丢弃上一帧（因为它已经过时了），只保留最新的
		if (pendingFrame) {
			pendingFrame.close();
		}

		// 3. 保存当前帧为待绘制帧
		pendingFrame = videoFrame;

		// 4. 启动渲染循环（如果还没启动）
		if (!renderLoopId) {
			renderLoopId = requestAnimationFrame(renderLoop);
		}
	}

	// 独立的渲染循环函数
	function renderLoop() {
		if (!pendingFrame || !canvasRef) {
			renderLoopId = null; // 没有帧了，停止循环
			return;
		}

		const frame = pendingFrame;
		pendingFrame = null; // 清空引用，准备接下一帧

		const ctx = canvasRef.getContext('2d', {
			alpha: false,
			desynchronized: true, // 关键：低延迟模式
		});

		if (ctx) {
			// 只有当内部尺寸不匹配时才调整，减少重排
			if (canvasRef.width !== frame.displayWidth || canvasRef.height !== frame.displayHeight) {
				canvasRef.width = frame.displayWidth;
				canvasRef.height = frame.displayHeight;
			}
			ctx.drawImage(frame, 0, 0, canvasRef.width, canvasRef.height);
		}

		// 画完一定要关闭！
		frame.close();

		// 继续下一轮渲染
		// 注意：这里我们不需要立即 requestAnimationFrame，
		// 而是等待 drawFrameToCanvas 再次触发时判断。
		// 但为了保持动画连贯性，通常有两种写法。
		// 针对你的场景，"有新帧才画"是更省资源的。
		renderLoopId = null;
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
		if (pendingFrame) {
			pendingFrame.close();
			pendingFrame = null;
		}
		if (renderLoopId) {
			cancelAnimationFrame(renderLoopId);
			renderLoopId = null;
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
