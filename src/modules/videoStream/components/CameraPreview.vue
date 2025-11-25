<template>
	<q-card class="camera-preview fit column no-wrap">
		<q-card-section class="row q-py-sm col-auto items-center justify-between">
			<div class="text-subtitle1 text-weight-bold my-text-secondary">
				{{ sourceType === 'camera' ? '本地摄像头' : '本地视频文件' }}
			</div>
			<div class="row q-gutter-sm items-center">
				<q-btn
					unelevated
					size="sm"
					:color="isActive ? 'negative' : 'primary'"
					:label="isActive ? '停止发送' : '开始发送'"
					:icon="isActive ? 'stop' : 'play_arrow'"
					@click="toggleCapture"
					glossy
				>
					<q-tooltip>{{ isActive ? '停止视频发送' : '开始视频发送' }}</q-tooltip>
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
			<video
				ref="videoRef"
				autoplay
				playsinline
				class="fit absolute-center z-1000"
				style="object-fit: contain"
				@resize="updateVideoSettings"
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
					class="absolute-bottom q-pa-sm z-top bg-dark-transparent text-caption text-white backdrop-blur"
				>
					<div class="row q-gutter-x-lg items-center justify-center">
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="dvr" color="accent" />
							<span>{{ videoSettings?.width }} x {{ videoSettings?.height }}</span>
						</div>
						<div class="row q-gutter-x-xs items-center">
							<q-icon name="speed" color="secondary" />
							<span>帧率：{{ Math.round(videoSettings?.frameRate || 0) }} fps</span>
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
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useCamera } from '../composables/useCamera';
import { useVideoFileSource } from '../composables/useVideoFileSource';
import { useH265Encoder, type EncodedFrameData } from '../composables/useH265Encoder';
import { useFrameManager } from '../../../core/stores/frame-manager';
import { useStreamConfig } from '../composables/useStreamConfig';

// 获取注入的配置
const { connectionId, remoteAddress, remotePort, sourceType, selectedFile } = useStreamConfig();

const videoRef = ref<HTMLVideoElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const videoSettings = ref<{ width: number; height: number; frameRate?: number } | null>(null);
const encodedFrameCount = ref(0);
const isFullscreen = ref(false);

const camera = useCamera();
const videoFileSource = useVideoFileSource();

const {
	error: encoderError,
	isEncoding,
	initEncoder,
	startEncodingFromTrack,
	stopEncoding,
} = useH265Encoder();

const frameManager = useFrameManager();
const error = ref<string | null>(null);

// 当前使用的源
const currentSource = computed(() => {
	return sourceType.value === 'camera' ? camera : videoFileSource;
});

const isActive = computed(() => currentSource.value.isActive.value);

// 合并错误信息
watch([camera.error, videoFileSource.error, encoderError], ([camErr, fileErr, encErr]) => {
	error.value = camErr || fileErr || encErr;
});

// 监听流变化 (统一处理 Camera 和 VideoFile)
watch(
	() => currentSource.value.stream.value,
	(newStream) => {
		if (!videoRef.value) return;

		// 以前只处理 camera，现在统一处理
		// 因为 useVideoFileSource 现在返回流，而不是操作 DOM
		if (newStream) {
			videoRef.value.srcObject = newStream;
			// 确保静音，避免预览产生回音（如果是带音频的文件）
			videoRef.value.muted = true;
		} else {
			videoRef.value.srcObject = null;
		}

		error.value = null;
	}
);

// 监听视频轨道变化
watch(
	() => currentSource.value.videoTrack.value,
	(track) => {
		if (track) {
			// 先尝试获取一次
			const settings = track.getSettings();
			// 如果宽或高缺失/为0，不要急着赋值，等待 resize 事件
			if (settings.width && settings.height) {
				videoSettings.value = settings;
			}
		}
	}
);

onMounted(() => {
	document.addEventListener('fullscreenchange', onFullscreenChange);
});

onUnmounted(() => {
	document.removeEventListener('fullscreenchange', onFullscreenChange);
	stopAll();
});

function updateVideoSettings() {
	if (videoRef.value && videoRef.value.videoWidth) {
		// 以 video 元素的实际源尺寸为准
		videoSettings.value = {
			width: videoRef.value.videoWidth,
			height: videoRef.value.videoHeight,
			// 帧率还是得从 track 拿，或者默认为 0
			frameRate: currentSource.value.videoTrack.value?.getSettings().frameRate,
		};

		// 可选：同时更新编码器配置（如果支持动态调整）
		// console.log('Resolution update:', videoSettings.value);
	}
}

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

async function stopAll() {
	await stopEncoding();
	camera.stopCamera();
	videoFileSource.stop();
	encodedFrameCount.value = 0;
	if (videoRef.value) {
		videoRef.value.srcObject = null;
	}
}

async function toggleCapture() {
	if (isActive.value) {
		await stopAll();
		// 停止后清理
		if (videoRef.value) {
			videoRef.value.srcObject = null;
		}
	} else {
		// 启动源
		if (sourceType.value === 'camera') {
			if (videoRef.value) {
				videoRef.value.srcObject = null;
				videoRef.value.removeAttribute('src');
				videoRef.value.load();
			}
			await camera.startCamera({ width: 3840, height: 2160 });
		} else {
			if (!selectedFile.value || !videoRef.value) {
				error.value = '请选择视频文件';
				return;
			}
			// 注意：这里我们需要先清空 srcObject，因为 useVideoFileSource 会设置 src
			if (videoRef.value.srcObject) {
				videoRef.value.srcObject = null;
			}
			await videoFileSource.start(selectedFile.value);
		}

		const track = currentSource.value.videoTrack.value;
		if (!track) {
			error.value = '无法获取视频轨道';
			return;
		}

		// 初始化编码器
		const settings = track.getSettings();
		let width = settings.width || 3840;
		let height = settings.height || 2160;

		if (width % 2 !== 0) width -= 1;
		if (height % 2 !== 0) height -= 1;

		await initEncoder(
			width,
			height,
			50_000_000, // 码率
			settings.frameRate || 30
		);

		// 开始编码
		await startEncodingFromTrack(track, handleEncodedFrame);
	}
}

async function handleEncodedFrame(frameData: EncodedFrameData) {
	if (connectionId.value === null) return;

	encodedFrameCount.value++;

	// 使用帧管理器发送视频帧
	const result = await frameManager.sendVideoFrame(
		connectionId.value,
		frameData.data,
		remoteAddress.value,
		remotePort.value
	);

	if (!result.success) {
		console.error('[CameraPreview] Error sending frame:', result.error);
	}
}
</script>

<style scoped>
.camera-preview {
	min-height: 300px;
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
