<template>
	<q-card class="remote-video-display fit no-wrap column">
		<q-card-section class="row q-py-sm col-auto items-center justify-between">
			<div class="text-subtitle1 text-weight-bold my-text-secondary">远程视频</div>
			<div class="row q-gutter-sm items-center">
				<q-btn
					unelevated
					size="sm"
					:color="isActive ? 'negative' : 'primary'"
					:label="isActive ? '停止接收' : '开始接收'"
					:icon="isActive ? 'stop' : 'play_arrow'"
					@click="toggleReceive"
					glossy
				>
					<q-tooltip>{{ isActive ? '停止接收视频' : '开始接收视频' }}</q-tooltip>
				</q-btn>
				<q-btn
					flat
					round
					dense
					:icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
					@click="toggleFullscreen"
					color="accent"
				>
					<q-tooltip>{{ isFullscreen ? '退出全屏' : '全屏' }}</q-tooltip>
				</q-btn>
			</div>
		</q-card-section>

		<div
			class="col relative-position q-pa-none video-container overflow-hidden bg-black"
			ref="containerRef"
		>
			<canvas
				ref="canvasRef"
				class="fit absolute-center z-1000"
				style="object-fit: contain"
			></canvas>

			<transition name="fade">
				<div v-if="error" class="absolute-top q-ma-md z-top">
					<q-banner class="bg-negative rounded-borders shadow-2 text-white" dense>
						<template v-slot:avatar>
							<q-icon name="error" color="white" />
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
					<q-icon name="tv_off" size="4rem" class="q-mb-md opacity-50" />
					<div class="text-h6 opacity-75">等待接收视频...</div>
					<div class="text-caption q-mt-sm opacity-50">请确保发送端已开启采集</div>
				</div>
			</transition>

			<transition name="slide-up">
				<div
					v-if="isDecoding || receivedFrameCount > 0"
					class="absolute-bottom q-pa-sm z-top bg-dark-transparent text-caption text-white backdrop-blur"
				>
					<div class="row q-gutter-x-lg items-center justify-center">
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="analytics" color="primary" />
							<span>接收帧数: {{ receivedFrameCount }}</span>
						</div>
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="speed" color="secondary" />
							<span>帧率: {{ fps }} fps</span>
						</div>
					</div>
				</div>
			</transition>
		</div>
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
const error = ref<string | null>(null);
const isActive = ref(false);
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

function toggleReceive() {
	isActive.value = !isActive.value;
}

watch(
	() => isActive.value,
	async (newIsActive) => {
		if (newIsActive) {
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
		} else {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			// 清空统计
			receivedFrameCount.value = 0;
			fps.value = 0;
			frameTimestamps = [];
		}
	}
);

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

	// 计算帧率
	frameTimestamps.push(Date.now());
	if (frameTimestamps.length > 60) {
		frameTimestamps.shift();
	}
	if (frameTimestamps.length > 1) {
		const duration = frameTimestamps[frameTimestamps.length - 1]! - frameTimestamps[0]!;
		fps.value = Math.round(((frameTimestamps.length - 1) / duration) * 1000);
	}

	// 解码帧
	decodeChunk(frame.data, frame.isKeyFrame || false);
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
	min-height: 300px;
	border: 1px solid var(--accent);
	box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
}

.video-container {
	background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
}

.canvas {
	/* 1. 强制开启 GPU 独立图层，避免全屏重绘整个页面 */
	transform: translateZ(0);
	/* 2. 告诉浏览器这个元素会频繁变化 */
	will-change: transform;
	/* 3. 极其重要：全屏铺满，不要用 width/height 属性控制显示大小，用 CSS 控制 */
	width: 100%;
	height: 100%;
	object-fit: contain; /* 保持比例 */

	/* 4. 终极优化：像素化渲染 */
	/* 如果你的源是 1080P，屏幕是 4K，浏览器默认会做平滑模糊处理（费性能）。
     开启 pixelated 可以直接按像素放大，虽然有锯齿，但性能最好，延迟最低。 */
	image-rendering: pixelated;
	/* 备选：image-rendering: -webkit-optimize-contrast; */
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
