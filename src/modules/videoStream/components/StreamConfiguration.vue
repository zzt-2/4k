<template>
	<q-card class="q-mb-md">
		<q-card-section>
			<div class="text-h6 q-mb-md">配置</div>

			<!-- 网络配置 -->
			<div class="text-subtitle2 q-mb-sm text-grey-7">网络设置</div>
			<div class="row q-col-gutter-sm q-mb-md">
				<div class="col-12">
					<q-input v-model="localAddress" label="本地地址" placeholder="127.0.0.1" outlined dense />
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

			<!-- 连接控制 -->
			<div class="row q-gutter-sm q-mb-lg">
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

			<q-separator class="q-mb-md" />

			<!-- 视频源配置 -->
			<div class="text-subtitle2 q-mb-sm text-grey-7">视频源设置</div>
			<div class="q-gutter-sm q-mb-md">
				<q-radio v-model="sourceType" val="camera" label="摄像头" dense />
				<q-radio v-model="sourceType" val="video" label="视频文件" dense />
			</div>

			<!-- 文件选择 -->
			<div v-if="sourceType === 'video'" class="q-mb-md">
				<q-file v-model="selectedFile" label="选择视频文件" outlined dense accept="video/*">
					<template v-slot:prepend>
						<q-icon name="movie" />
					</template>
				</q-file>
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
</template>

<script setup lang="ts">
import { useStreamConfig } from '../composables/useStreamConfig';

const {
	localAddress,
	localPort,
	remoteAddress,
	remotePort,
	sourceType,
	selectedFile,
	connectionId,
	connectionStatus,
	networkError,
	createConnection,
	closeConnection,
} = useStreamConfig();
</script>
