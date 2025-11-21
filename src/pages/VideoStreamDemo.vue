<template>
	<div class="q-pa-md">
		<div class="text-h4 q-mb-lg">4K 视频流传输演示</div>

		<div class="row q-col-gutter-md">
			<!-- 左侧：配置和状态 -->
			<div class="col-md-4 col-12">
				<!-- 网络配置 -->
				<q-card class="q-mb-md">
					<q-card-section>
						<div class="text-h6 q-mb-md">网络配置</div>

						<div class="row q-col-gutter-sm">
							<div class="col-12">
								<q-input
									v-model="localAddress"
									label="本地地址"
									placeholder="127.0.0.1"
									outlined
									dense
								/>
							</div>
							<div class="col-12">
								<q-input
									v-model.number="localPort"
									label="本地端口"
									placeholder="8888"
									type="number"
									outlined
									dense
								/>
							</div>
							<div class="col-12">
								<q-input
									v-model="remoteAddress"
									label="远程地址"
									placeholder="127.0.0.1"
									outlined
									dense
								/>
							</div>
							<div class="col-12">
								<q-input
									v-model.number="remotePort"
									label="远程端口"
									placeholder="8888"
									type="number"
									outlined
									dense
								/>
							</div>
						</div>

						<div class="row q-mt-md q-gutter-sm">
							<q-btn
								color="primary"
								label="创建 UDP 连接"
								icon="mdi-connection"
								@click="createConnection"
								:disable="connectionId !== null"
								class="col-grow"
							/>
							<q-btn
								color="negative"
								label="断开连接"
								icon="mdi-close-network"
								@click="closeConnection"
								:disable="connectionId === null"
								class="col-grow"
							/>
						</div>
					</q-card-section>
				</q-card>

				<!-- 连接状态 -->
				<q-card v-if="connectionStatus" class="q-mb-md">
					<q-card-section>
						<div class="text-h6 q-mb-sm">连接状态</div>
						<q-list dense>
							<q-item>
								<q-item-section>
									<q-item-label caption>连接 ID</q-item-label>
									<q-item-label>{{ connectionId }}</q-item-label>
								</q-item-section>
							</q-item>
							<q-item>
								<q-item-section>
									<q-item-label caption>状态</q-item-label>
									<q-item-label>
										<q-badge
											:color="connectionStatus.status?.state === 'connected' ? 'positive' : 'grey'"
										>
											{{ connectionStatus.status?.state }}
										</q-badge>
									</q-item-label>
								</q-item-section>
							</q-item>
							<q-item>
								<q-item-section>
									<q-item-label caption>已发送</q-item-label>
									<q-item-label>{{ connectionStatus.status?.bytesSent }} 字节</q-item-label>
								</q-item-section>
							</q-item>
							<q-item>
								<q-item-section>
									<q-item-label caption>已接收</q-item-label>
									<q-item-label>{{ connectionStatus.status?.bytesReceived }} 字节</q-item-label>
								</q-item-section>
							</q-item>
						</q-list>
					</q-card-section>
				</q-card>

				<q-banner v-if="networkError" class="bg-negative q-mb-md rounded-borders text-white">
					{{ networkError }}
				</q-banner>

				<!-- 说明 -->
				<q-card>
					<q-card-section>
						<div class="text-h6 q-mb-sm">使用说明</div>
						<q-list dense bordered separator>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-1-circle" color="primary" />
								</q-item-section>
								<q-item-section
									>配置本地和远程地址/端口（回环测试可使用 127.0.0.1:8888）</q-item-section
								>
							</q-item>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-2-circle" color="primary" />
								</q-item-section>
								<q-item-section>点击"创建 UDP 连接"建立网络连接</q-item-section>
							</q-item>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-3-circle" color="primary" />
								</q-item-section>
								<q-item-section>点击"开始采集"启动摄像头并开始编码传输</q-item-section>
							</q-item>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-4-circle" color="primary" />
								</q-item-section>
								<q-item-section>右侧将显示接收到的视频流</q-item-section>
							</q-item>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-5-circle" color="primary" />
								</q-item-section>
								<q-item-section>观察帧率、延迟等统计信息</q-item-section>
							</q-item>
						</q-list>
						<div class="q-mt-md text-warning bg-yellow-1 q-pa-sm rounded-borders border-warning">
							<strong>注意：</strong>需要安装 HEVC 视频扩展以支持 H.265 编解码
						</div>
					</q-card-section>
				</q-card>
			</div>

			<!-- 右侧：视频流 -->
			<div class="col-md-8 col-12">
				<div v-if="connectionId !== null" class="row q-col-gutter-md">
					<div class="col-lg-6 col-12">
						<q-card class="full-height">
							<q-card-section>
								<div class="text-h6 q-mb-sm">本地采集预览</div>
								<CameraPreview
									:connection-id="connectionId"
									:remote-address="remoteAddress"
									:remote-port="remotePort"
								/>
							</q-card-section>
						</q-card>
					</div>
					<div class="col-lg-6 col-12">
						<q-card class="full-height">
							<q-card-section>
								<div class="text-h6 q-mb-sm">远程接收画面</div>
								<RemoteVideoDisplay />
							</q-card-section>
						</q-card>
					</div>
				</div>
				<div
					v-else
					class="flex-center text-grey-5 flex"
					style="height: 400px; border: 2px dashed currentColor; border-radius: 8px"
				>
					<div class="text-center">
						<q-icon name="mdi-video-off" size="4rem" />
						<div class="text-h6 q-mt-sm">请先创建连接</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import CameraPreview from '../modules/videoStream/components/CameraPreview.vue';
import RemoteVideoDisplay from '../modules/videoStream/components/RemoteVideoDisplay.vue';
import { networkAPI } from '@core/api';

// 网络配置
const localAddress = ref('127.0.0.1');
const localPort = ref(8888);
const remoteAddress = ref('127.0.0.1');
const remotePort = ref(8888);

const connectionId = ref<number | null>(null);
const connectionStatus = ref<any>(null);
const networkError = ref<string | null>(null);

let statusInterval: number | null = null;

// 创建 UDP 连接
async function createConnection() {
	try {
		networkError.value = null;

		const result = await networkAPI.createConnection({
			type: 'udp',
			localAddress: localAddress.value,
			localPort: localPort.value,
		});

		if (result.success) {
			connectionId.value = result.connectionId;
			console.log('[VideoStreamDemo] Connection created:', connectionId.value);

			// 定期查询连接状态
			startStatusPolling();
		} else {
			networkError.value = result.error || '创建连接失败';
		}
	} catch (error) {
		networkError.value = error instanceof Error ? error.message : '创建连接失败';
		console.error('[VideoStreamDemo] Error creating connection:', error);
	}
}

// 关闭连接
async function closeConnection() {
	try {
		if (connectionId.value === null || !window.electronAPI) return;

		await networkAPI.closeConnection({
			connectionId: connectionId.value,
		});

		connectionId.value = null;
		connectionStatus.value = null;
		stopStatusPolling();

		console.log('[VideoStreamDemo] Connection closed');
	} catch (error) {
		console.error('[VideoStreamDemo] Error closing connection:', error);
	}
}

// 开始状态轮询
function startStatusPolling() {
	statusInterval = window.setInterval(async () => {
		if (connectionId.value === null || !window.electronAPI) return;

		try {
			const status = await window.electronAPI.invoke('network-get-status', {
				connectionId: connectionId.value,
			});
			connectionStatus.value = status;
		} catch (error) {
			console.error('[VideoStreamDemo] Error getting status:', error);
		}
	}, 1000);
}

// 停止状态轮询
function stopStatusPolling() {
	if (statusInterval !== null) {
		clearInterval(statusInterval);
		statusInterval = null;
	}
}

onUnmounted(() => {
	stopStatusPolling();
	if (connectionId.value !== null) {
		closeConnection();
	}
});
</script>
