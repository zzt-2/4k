<template>
	<q-card class="camera-preview fit column no-wrap">
		<q-card-section class="row q-py-sm col-auto items-center justify-between">
			<div class="text-subtitle1 text-weight-bold text-primary">本地摄像头</div>
			<div class="row q-gutter-sm items-center">
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
				<q-separator vertical color="accent" />
				<q-btn
					:color="isActive ? 'negative' : 'primary'"
					:label="isActive ? '停止采集' : '开始采集'"
					:icon="isActive ? 'no_photography' : 'camera_alt'"
					@click="toggleCamera"
					:disable="isEncoding"
					size="sm"
					glossy
				/>
			</div>
		</q-card-section>

		<div
			class="col relative-position q-pa-none video-container overflow-hidden bg-black"
			ref="containerRef"
		>
			<video
				ref="videoRef"
				autoplay
				muted
				playsinline
				class="fit absolute-center z-top"
				style="object-fit: contain"
			></video>

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

			<transition name="slide-up">
				<div
					v-if="isActive"
					class="absolute-bottom q-pa-sm bg-dark-transparent text-caption text-white backdrop-blur"
				>
					<div class="row q-gutter-x-lg items-center justify-center">
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="dvr" color="accent" />
							<span>{{ videoSettings?.width }} x {{ videoSettings?.height }}</span>
						</div>
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="speed" color="secondary" />
							<span>{{ videoSettings?.frameRate }} fps</span>
						</div>
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="analytics" color="primary" />
							<span>编码帧数: {{ encodedFrameCount }}</span>
						</div>
					</div>
				</div>
			</transition>
		</div>
	</q-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useCamera } from '../composables/useCamera';
import { useH265Encoder, type EncodedFrameData } from '../composables/useH265Encoder';
import { useFrameManager } from '../../../core/stores/frame-manager';

const props = defineProps<{
	connectionId: number;
	remoteAddress: string;
	remotePort: number;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const videoSettings = ref<MediaTrackSettings | null>(null);
const encodedFrameCount = ref(0);
const isFullscreen = ref(false);

const { stream, videoTrack, error: cameraError, isActive, startCamera, stopCamera } = useCamera();
const {
	error: encoderError,
	isEncoding,
	initEncoder,
	startEncodingFromTrack,
	stopEncoding,
} = useH265Encoder();

const frameManager = useFrameManager();
const error = ref<string | null>(null);

// 合并错误信息
watch([cameraError, encoderError], ([camErr, encErr]) => {
	error.value = camErr || encErr;
});

// 当摄像头启动后，显示预览
watch(stream, (newStream) => {
	if (newStream && videoRef.value) {
		videoRef.value.srcObject = newStream;
	}
});

// 当视频轨道可用时，获取设置
watch(videoTrack, (track) => {
	if (track) {
		videoSettings.value = track.getSettings();
	}
});

onMounted(() => {
	document.addEventListener('fullscreenchange', onFullscreenChange);
});

onUnmounted(() => {
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

async function toggleCamera() {
	if (isActive.value) {
		await stopEncoding();
		stopCamera();
		encodedFrameCount.value = 0;
	} else {
		// 启动摄像头
		await startCamera({ width: 3840, height: 2160 });

		if (!videoTrack.value) {
			error.value = '无法获取视频轨道';
			return;
		}

		// 初始化编码器
		const settings = videoTrack.value.getSettings();
		await initEncoder(
			settings.width || 3840,
			settings.height || 2160,
			5_000_000,
			settings.frameRate || 60
		);

		// 开始编码
		await startEncodingFromTrack(videoTrack.value, handleEncodedFrame);
	}
}

async function handleEncodedFrame(frameData: EncodedFrameData) {
	encodedFrameCount.value++;

	// 使用帧管理器发送视频帧
	const result = await frameManager.sendVideoFrame(
		props.connectionId,
		frameData.data,
		props.remoteAddress,
		props.remotePort
	);

	if (!result.success) {
		console.error('[CameraPreview] Error sending frame:', result.error);
	}
}
</script>

<style scoped>
.camera-preview {
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
