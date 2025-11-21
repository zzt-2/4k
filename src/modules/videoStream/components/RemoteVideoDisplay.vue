<template>
	<div class="remote-video-display fit">
		<div class="column full-height">
			<div class="row q-mb-sm items-center justify-between">
				<div class="text-subtitle1">远程视频</div>
				<div class="row q-gutter-sm">
					<q-badge color="primary" outline>接收帧数: {{ receivedFrameCount }}</q-badge>
					<q-badge color="secondary" outline>帧率: {{ fps.toFixed(1) }} fps</q-badge>
					<q-badge color="accent" outline>延迟: {{ latency }} ms</q-badge>
				</div>
			</div>

			<div class="col relative-position rounded-borders flex-center flex overflow-hidden bg-black">
				<canvas ref="canvasRef" class="fit" style="object-fit: contain"></canvas>

				<div v-if="error" class="absolute-top q-ma-sm">
					<q-banner class="bg-negative rounded-borders text-white" dense>
						{{ error }}
					</q-banner>
				</div>

				<div v-if="!isDecoding" class="absolute-center text-grey-5 text-center">
					<q-icon name="mdi-television-off" size="3rem" class="q-mb-sm" />
					<div class="text-subtitle1">等待接收视频...</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useH265Decoder } from '../composables/useH265Decoder';
import { networkAPI } from '@core/api';
import type { ReceivedFrameData } from '../types';
import { FrameTypeMagic } from '../types';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const receivedFrameCount = ref(0);
const fps = ref(0);
const latency = ref(0);
const error = ref<string | null>(null);

const {
	isDecoding,
	error: decoderError,
	initDecoder,
	decodeChunk,
	onDecodedFrame,
	drawFrameToCanvas,
} = useH265Decoder();

let unsubscribe: (() => void) | null = null;
let frameTimestamps: number[] = [];

onMounted(async () => {
	// 初始化解码器
	await initDecoder(3840, 2160);

	// 设置解码帧回调
	onDecodedFrame((videoFrame) => {
		if (canvasRef.value) {
			drawFrameToCanvas(videoFrame, canvasRef.value);
		}
	});

	// 监听接收到的完整帧
	unsubscribe = networkAPI.onFrameReceived(handleReceivedFrame);
});

onUnmounted(() => {
	if (unsubscribe) {
		unsubscribe();
	}
});

function handleReceivedFrame(frame: ReceivedFrameData) {
	// 只处理视频帧
	if (frame.frameTypeMagic !== FrameTypeMagic.VIDEO_FRAME) {
		return;
	}

	receivedFrameCount.value++;

	// 计算延迟
	const now = Date.now();
	latency.value = now - frame.timestamp;

	// 计算帧率
	frameTimestamps.push(now);
	if (frameTimestamps.length > 30) {
		frameTimestamps.shift();
	}
	if (frameTimestamps.length > 1) {
		const duration = frameTimestamps[frameTimestamps.length - 1] - frameTimestamps[0];
		fps.value = ((frameTimestamps.length - 1) / duration) * 1000;
	}

	// 解码帧
	const data = new Uint8Array(frame.data);
	decodeChunk(data, frame.timestamp, receivedFrameCount.value % 30 === 1);
}

// 监听解码器错误
watch(decoderError, (err) => {
	if (err) {
		error.value = err;
	}
});
</script>

<script lang="ts">
export default {
	name: 'RemoteVideoDisplay',
};
</script>

<style scoped>
.remote-video-display {
	min-height: 400px;
}
</style>
