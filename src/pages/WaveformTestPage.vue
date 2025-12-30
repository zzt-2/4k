<template>
	<div class="q-pa-md">
		<div class="text-h4 q-mb-lg">Perfetto 波形查看器</div>

		<div class="row q-col-gutter-md">
			<div class="col-12">
				<q-card>
					<q-card-section>
						<div class="row q-gutter-md items-center">
							<div class="col-md-4 col-12">
								<q-file
									v-model="waveFile"
									label="选择波形文件 (.json.gz, .json)"
									outlined
									dense
									accept=".json,.gz,.pftrace"
									@update:model-value="handleFileChange"
								>
									<template v-slot:prepend>
										<q-icon name="mdi-chart-timeline" />
									</template>
								</q-file>
							</div>
							<div class="col-md-8 row col-12 items-center">
								<div v-if="loading" class="text-primary row items-center">
									<q-spinner class="q-mr-sm" size="20px" />
									<span>{{ statusMsg }}</span>
								</div>
								<div v-else class="text-grey-7">
									<q-icon name="mdi-information-outline" class="q-mr-xs" />
									{{ statusMsg || '请上传生成的 wave.json.gz 文件' }}
								</div>
							</div>
						</div>
					</q-card-section>
				</q-card>
			</div>

			<div class="col-12">
				<q-card class="viewer-card">
					<q-card-section class="no-padding full-height">
						<iframe
							ref="iframeRef"
							:src="perfettoUrl"
							class="perfetto-iframe"
							title="Perfetto UI"
							allowfullscreen
							@load="onIframeLoad"
						></iframe>
					</q-card-section>
				</q-card>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// ==========================================
// 配置
// ==========================================
// 官方在线版 (最稳定，但需要外网)
const perfettoUrl = 'https://ui.perfetto.dev';
// 如果本地部署: const perfettoUrl = 'http://localhost:10000';

// ==========================================
// 状态
// ==========================================
const waveFile = ref<File | null>(null);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const statusMsg = ref<string>('');
const loading = ref<boolean>(false);
const isIframeReady = ref<boolean>(false);

// ==========================================
// 逻辑
// ==========================================

function onIframeLoad() {
	isIframeReady.value = true;
	console.log('Perfetto iframe loaded');
}

async function handleFileChange(file: File | null) {
	if (!file) return;

	if (!isIframeReady.value) {
		statusMsg.value = 'UI 尚未加载完成，请稍候...';
		return;
	}

	statusMsg.value = `正在加载: ${file.name}...`;
	loading.value = true;

	try {
		// 1. 读取为 ArrayBuffer (Perfetto 要求二进制流，尤其是 gzip 文件)
		const arrayBuffer = await readFileAsArrayBuffer(file);

		// 2. 发送给 Perfetto
		openTraceInPerfetto(arrayBuffer, file.name);

		statusMsg.value = `已显示: ${file.name}`;
	} catch (err: any) {
		statusMsg.value = `加载失败: ${err.message}`;
		console.error(err);
	} finally {
		loading.value = false;
	}
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
		reader.onerror = () => reject(new Error('File read error'));
		reader.readAsArrayBuffer(file);
	});
}

// 核心: Perfetto PostMessage 协议
// 参考: https://perfetto.dev/docs/visualization/deep-linking
function openTraceInPerfetto(buffer: ArrayBuffer, fileName: string) {
	if (!iframeRef.value?.contentWindow) return;

	// Perfetto 期望的数据格式
	// 必须指定 'perfetto.ui.open_trace'
	const payload = {
		perfetto: {
			buffer: buffer,
			title: fileName,
			fileName: fileName,
		},
	};

	// 注意：需要将 buffer 放入 transfer list 以提高性能
	iframeRef.value.contentWindow.postMessage(
		payload,
		perfettoUrl,
		[buffer] // Transferable objects
	);
}
</script>

<style scoped>
.viewer-card {
	height: 80vh;
	display: flex;
	flex-direction: column;
}

.perfetto-iframe {
	width: 100%;
	height: 100%;
	border: none;
	background-color: #ffffff;
}

.no-padding {
	padding: 0 !important;
}

.full-height {
	height: 100%;
}
</style>
