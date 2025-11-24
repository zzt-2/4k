<template>
	<q-card class="remote-video-display fit column no-wrap">
		<q-card-section class="row q-py-sm col-auto items-center justify-between">
			<div class="text-subtitle1 text-weight-bold text-primary">远程视频</div>
			<div class="row q-gutter-sm items-center">
				<q-btn
					flat
					round
					dense
					:icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
					@click="toggleFullscreen"
					color="accent"
				>
					<q-tooltip>{{ isFullscreen ? '退出全屏' : '全屏' }}</q-tooltip>
				</q-btn>
			</div>
		</q-card-section>

		<q-card-section
			class="col relative-position q-pa-none video-container overflow-hidden bg-black"
			ref="containerRef"
		>
			<canvas ref="canvasRef" class="fit absolute-center" style="object-fit: contain"></canvas>

			<transition name="fade">
				<div v-if="error" class="absolute-top q-ma-md z-top">
					<q-banner class="bg-negative rounded-borders shadow-2 text-white" dense>
						<template v-slot:avatar>
							<q-icon name="mdi-alert-circle" color="white" />
						</template>
						{{ error }}
					</q-banner>
				</div>
			</transition>

			<transition name="fade">
				<div
					v-if="!isDecoding && !error"
					class="absolute-center text-grey-5 column flex-center text-center"
				>
					<q-icon name="mdi-television-off" size="4rem" class="q-mb-md opacity-50" />
					<div class="text-h6 opacity-75">等待接收视频...</div>
					<div class="text-caption q-mt-sm opacity-50">请确保发送端已开启采集</div>
				</div>
			</transition>

			<transition name="slide-up">
				<div
					v-if="isDecoding || receivedFrameCount > 0"
					class="absolute-bottom q-pa-sm bg-dark-transparent text-caption text-white backdrop-blur"
				>
					<div class="row q-gutter-x-lg items-center justify-center">
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="mdi-counter" color="primary" />
							<span>接收帧数: {{ receivedFrameCount }}</span>
						</div>
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="mdi-speedometer" color="secondary" />
							<span>帧率: {{ fps.toFixed(1) }} fps</span>
						</div>
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="mdi-clock-outline" color="accent" />
							<span>延迟: {{ latency }} ms</span>
						</div>
					</div>
				</div>
			</transition>
		</q-card-section>
	</q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useH265Decoder } from '../composables/useH265Decoder';
import { useFrameManager } from '../../../core/stores/frame-manager';
import type { ParsedFrame } from '../../../core/types/protocol';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const receivedFrameCount = ref(0);
const fps = ref(0);
const latency = ref(0);
const error = ref<string | null>(null);
const isFullscreen = ref(false);

const {
	isDecoding,
	error: decoderError,
	initDecoder,
	decodeChunk,
	onDecodedFrame,
	drawFrameToCanvas,
} = useH265Decoder();

const frameManager = useFrameManager();
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

	// 使用帧管理器监听视频帧
	unsubscribe = frameManager.onVideoFrame(handleReceivedFrame);

	document.addEventListener('fullscreenchange', onFullscreenChange);
});

onUnmounted(() => {
	if (unsubscribe) {
		unsubscribe();
	}
	document.removeEventListener('fullscreenchange', onFullscreenChange);
});

function onFullscreenChange() {
	if (containerRef.value) {
		isFullscreen.value = document.fullscreenElement === containerRef.value;
	}
}

function toggleFullscreen() {
	if (!containerRef.value) return;

	if (!document.fullscreenElement) {
		containerRef.value.requestFullscreen().catch((err) => {
			console.error(`Error attempting to enable fullscreen: ${err.message}`);
		});
	} else {
		document.exitFullscreen();
	}
}

function handleReceivedFrame(frame: ParsedFrame) {
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
	decodeChunk(frame.data, frame.timestamp, frame.isKeyFrame || false);
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
	min-height: 500px;
	border: 1px solid var(--accent);
	box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
}

.video-container {
	background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
}

.bg-dark-transparent {
	background: rgba(0, 0, 0, 0.7);
	border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.backdrop-blur {
	backdrop-filter: blur(4px);
}

.opacity-50 {
	opacity: 0.5;
}

.opacity-75 {
	opacity: 0.75;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
	transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
	transform: translateY(100%);
}
</style>
