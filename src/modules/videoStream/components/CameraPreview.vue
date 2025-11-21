<template>
	<div class="camera-preview fit">
		<div class="column full-height">
			<div class="row q-mb-sm items-center justify-between">
				<div class="text-subtitle1">本地摄像头</div>
				<q-btn
					:color="isActive ? 'negative' : 'primary'"
					:label="isActive ? '停止采集' : '开始采集'"
					:icon="isActive ? 'mdi-camera-off' : 'mdi-camera'"
					@click="toggleCamera"
					:disable="isEncoding"
					size="sm"
				/>
			</div>

			<div class="col relative-position rounded-borders overflow-hidden bg-black">
				<video
					ref="videoRef"
					autoplay
					muted
					playsinline
					class="fit"
					style="object-fit: cover"
				></video>
				<canvas ref="canvasRef" class="hidden"></canvas>

				<div v-if="error" class="absolute-top q-ma-sm">
					<q-banner class="bg-negative rounded-borders text-white" dense>
						{{ error }}
					</q-banner>
				</div>

				<div
					v-if="isActive"
					class="absolute-bottom q-pa-sm bg-dark-transparent text-caption text-white"
				>
					<div class="row q-gutter-x-md justify-center">
						<div>分辨率: {{ videoSettings?.width }} x {{ videoSettings?.height }}</div>
						<div>帧率: {{ videoSettings?.frameRate }} fps</div>
						<div>编码帧数: {{ encodedFrameCount }}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCamera } from '../composables/useCamera';
import { useH265Encoder } from '../composables/useH265Encoder';
import { networkAPI } from '@core/api';
import type { EncodedFrameData } from '../types';

const props = defineProps<{
	connectionId: number;
	remoteAddress: string;
	remotePort: number;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const videoSettings = ref<MediaTrackSettings | null>(null);
const encodedFrameCount = ref(0);

const { stream, videoTrack, error: cameraError, isActive, startCamera, stopCamera } = useCamera();
const {
	error: encoderError,
	isEncoding,
	initEncoder,
	startEncodingFromTrack,
	stopEncoding,
} = useH265Encoder();

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
		await initEncoder(settings.width, settings.height, 20_000_000, settings.frameRate || 30);

		// 开始编码
		await startEncodingFromTrack(videoTrack.value, handleEncodedFrame);
	}
}

async function handleEncodedFrame(frameData: EncodedFrameData) {
	encodedFrameCount.value++;

	// 在数据前添加帧类型标志（4 字节）
	const dataWithHeader = new Uint8Array(4 + frameData.data.length);
	// 写入帧类型魔数（大端序）
	dataWithHeader[0] = (frameData.frameTypeMagic >> 24) & 0xff;
	dataWithHeader[1] = (frameData.frameTypeMagic >> 16) & 0xff;
	dataWithHeader[2] = (frameData.frameTypeMagic >> 8) & 0xff;
	dataWithHeader[3] = frameData.frameTypeMagic & 0xff;
	// 复制实际数据
	dataWithHeader.set(frameData.data, 4);

	// 发送到主进程（自动分片）
	// 注意：networkAPI.sendData 需要 number[]，所以需要转换
	const result = await networkAPI.sendData({
		connectionId: props.connectionId,
		data: Array.from(dataWithHeader),
		remoteAddress: props.remoteAddress,
		remotePort: props.remotePort,
	});

	if (!result.success) {
		console.error('[CameraPreview] Error sending frame:', result.error);
	}
}
</script>

<style scoped>
.camera-preview {
	min-height: 400px;
}

.bg-dark-transparent {
	background: rgba(0, 0, 0, 0.6);
}
</style>
