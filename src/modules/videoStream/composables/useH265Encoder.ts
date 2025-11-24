/**
 * H.265 编码器 Composable
 * 使用 WebCodecs API 进行硬件加速的 H.265 编码
 */

import { ref, onUnmounted } from 'vue';

/**
 * 编码后的帧数据
 */
export interface EncodedFrameData {
	frameId: number;
	timestamp: number;
	data: Uint8Array;
	isKeyFrame: boolean;
}

export function useH265Encoder() {
	const encoder = ref<VideoEncoder | null>(null);
	const isEncoding = ref(false);
	const error = ref<string | null>(null);
	const frameCounter = ref(0);
	const frameRate = ref(30);

	// 编码帧回调
	let onEncodedFrameCallback: ((frameData: EncodedFrameData) => void) | null = null;

	/**
	 * 初始化编码器
	 * @param width 视频宽度
	 * @param height 视频高度
	 * @param bitrate 码率 (bps)，默认 20Mbps
	 * @param framerate 帧率，默认 30fps
	 */
	async function initEncoder(
		width: number,
		height: number,
		bitrate: number = 5_000_000,
		framerate: number = 60
	) {
		try {
			error.value = null;

			// 检查 H.265 支持
			const config: VideoEncoderConfig = {
				// codec: 'avc1.640033', // H.264
				codec: 'hvc1.1.6.L153.B0', // H.265
				width,
				height,
				bitrate,
				framerate,
				hardwareAcceleration: 'prefer-hardware',
				avc: { format: 'annexb' },
			};

			const support = await VideoEncoder.isConfigSupported(config);
			if (!support.supported) {
				throw new Error('H.265 编码器不支持当前配置');
			}

			// 创建编码器
			encoder.value = new VideoEncoder({
				output: handleEncodedChunk,
				error: (err) => {
					error.value = err.message;
					console.error('[useH265Encoder] Encoder error:', err);
				},
			});

			encoder.value.configure(config);
			isEncoding.value = true;
			frameRate.value = framerate;

			console.log('[useH265Encoder] Encoder initialized:', config);
		} catch (err) {
			error.value = err instanceof Error ? err.message : '编码器初始化失败';
			console.error('[useH265Encoder] Error initializing encoder:', err);
		}
	}

	/**
	 * 处理编码后的数据块
	 */
	function handleEncodedChunk(chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) {
		if (!onEncodedFrameCallback) return;

		// 将 EncodedVideoChunk 转换为 Uint8Array
		const data = new Uint8Array(chunk.byteLength);
		chunk.copyTo(data);

		const frameData: EncodedFrameData = {
			frameId: frameCounter.value,
			timestamp: chunk.timestamp,
			data,
			isKeyFrame: chunk.type === 'key',
		};

		frameCounter.value = (frameCounter.value + 1) % 65536; // 循环使用 0-65535

		onEncodedFrameCallback(frameData);
	}

	/**
	 * 编码视频帧
	 * @param videoFrame VideoFrame 对象
	 */
	function encodeFrame(videoFrame: VideoFrame) {
		if (!encoder.value || !isEncoding.value) {
			console.warn('[useH265Encoder] Encoder not initialized');
			return;
		}

		try {
			// 每 30 帧插入一个关键帧
			const keyFrame = frameCounter.value % frameRate.value === 0;
			encoder.value.encode(videoFrame, { keyFrame });
		} catch (err) {
			console.error('[useH265Encoder] Error encoding frame:', err);
		}
	}

	/**
	 * 从 MediaStreamTrack 读取帧并编码
	 * @param track 视频轨道
	 * @param onEncodedFrame 编码完成回调
	 */
	async function startEncodingFromTrack(
		track: MediaStreamTrack,
		onEncodedFrame: (frameData: EncodedFrameData) => void
	) {
		onEncodedFrameCallback = onEncodedFrame;

		// 使用 MediaStreamTrackProcessor 读取帧
		// @ts-ignore - MediaStreamTrackProcessor 可能不在所有类型定义中
		const processor = new MediaStreamTrackProcessor({ track });
		const reader = processor.readable.getReader();

		const processFrame = async () => {
			while (isEncoding.value) {
				try {
					const { done, value } = await reader.read();
					if (done) break;

					encodeFrame(value);
					value.close(); // 释放 VideoFrame
				} catch (err) {
					console.error('[useH265Encoder] Error processing frame:', err);
					break;
				}
			}
		};

		processFrame();
	}

	/**
	 * 停止编码
	 */
	async function stopEncoding() {
		if (encoder.value) {
			await encoder.value.flush();
			encoder.value.close();
			encoder.value = null;
		}
		isEncoding.value = false;
		onEncodedFrameCallback = null;
		frameCounter.value = 0;
		console.log('[useH265Encoder] Encoder stopped');
	}

	// 组件卸载时自动停止编码
	onUnmounted(() => {
		stopEncoding();
	});

	return {
		encoder,
		isEncoding,
		error,
		initEncoder,
		encodeFrame,
		startEncodingFromTrack,
		stopEncoding,
	};
}
