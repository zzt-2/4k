<template>
	<div class="q-pa-md">
		<div class="text-h4 q-mb-lg">网络连接测试</div>

		<div class="row q-col-gutter-md">
			<!-- 左侧：连接管理和发送数据 -->
			<div class="col-md-6 col-12">
				<!-- 连接管理 -->
				<q-card class="q-mb-md">
					<q-card-section>
						<div class="text-h6 q-mb-md">创建连接</div>

						<q-select
							v-model="connectionType"
							:options="connectionTypeOptions"
							label="连接类型"
							outlined
							emit-value
							map-options
							class="q-mb-md"
						/>

						<q-input
							v-if="connectionType !== 'tcp-client'"
							v-model="localAddress"
							label="本地地址"
							outlined
							class="q-mb-md"
						/>

						<q-input
							v-if="connectionType !== 'tcp-client'"
							v-model.number="localPort"
							label="本地端口"
							type="number"
							outlined
							class="q-mb-md"
						/>

						<q-input
							v-if="connectionType === 'tcp-client'"
							v-model="remoteAddress"
							label="远程地址"
							outlined
							class="q-mb-md"
						/>

						<q-input
							v-if="connectionType === 'tcp-client'"
							v-model.number="remotePort"
							label="远程端口"
							type="number"
							outlined
							class="q-mb-md"
						/>

						<q-btn
							color="primary"
							label="创建连接"
							icon="mdi-plus"
							@click="createConnection"
							class="full-width"
						/>
					</q-card-section>
				</q-card>

				<!-- 数据发送 -->
				<q-card>
					<q-card-section>
						<div class="text-h6 q-mb-md">发送数据</div>

						<q-input
							v-model.number="selectedConnectionId"
							label="连接 ID"
							type="number"
							outlined
							class="q-mb-md"
						/>

						<q-input
							v-model="targetAddress"
							label="目标地址 (UDP/TCP Server)"
							outlined
							class="q-mb-md"
						/>

						<q-input
							v-model.number="targetPort"
							label="目标端口 (UDP/TCP Server)"
							type="number"
							outlined
							class="q-mb-md"
						/>

						<q-input
							v-model="sendDataHex"
							label="数据 (十六进制，空格分隔)"
							outlined
							class="q-mb-md"
							hint="例如: 48 65 6C 6C 6F"
						/>

						<q-btn
							color="accent"
							label="发送数据"
							icon="mdi-send"
							@click="sendData"
							class="full-width"
						/>
					</q-card-section>
				</q-card>
			</div>

			<!-- 右侧：连接列表和状态 -->
			<div class="col-md-6 col-12">
				<!-- 当前连接列表 -->
				<q-card class="q-mb-md">
					<q-card-section>
						<div class="row q-mb-md items-center">
							<div class="text-h6 col">当前连接</div>
							<q-btn flat dense round icon="mdi-refresh" @click="refreshConnections" />
						</div>

						<q-list bordered separator v-if="connections.length > 0">
							<q-item
								v-for="conn in connections"
								:key="conn.connectionId"
								clickable
								:active="selectedConnectionId === conn.connectionId"
								@click="selectConnection(conn.connectionId)"
							>
								<q-item-section>
									<q-item-label>
										<q-badge color="accent" class="q-mr-sm"> ID: {{ conn.connectionId }} </q-badge>
										<q-badge color="secondary" class="q-mr-sm">
											{{ conn.type }}
										</q-badge>
									</q-item-label>
									<q-item-label caption>
										{{ conn.localAddress }}:{{ conn.localPort }}
									</q-item-label>
								</q-item-section>

								<q-item-section side>
									<q-btn
										flat
										dense
										round
										color="negative"
										icon="mdi-close"
										@click.stop="closeConnection(conn.connectionId)"
									/>
								</q-item-section>
							</q-item>
						</q-list>

						<div v-else class="text-grey q-pa-md text-center">暂无连接</div>
					</q-card-section>
				</q-card>

				<!-- 连接状态 -->
				<q-card>
					<q-card-section>
						<div class="text-h6 q-mb-md">连接状态</div>

						<div v-if="connectionStatus && connectionStatus.exists">
							<q-list bordered>
								<q-item>
									<q-item-section>
										<q-item-label caption>状态</q-item-label>
										<q-item-label>
											<q-badge
												:color="
													connectionStatus.status?.state === 'connected'
														? 'positive'
														: connectionStatus.status?.state === 'error'
															? 'negative'
															: 'grey'
												"
											>
												{{ connectionStatus.status?.state }}
											</q-badge>
										</q-item-label>
									</q-item-section>
								</q-item>

								<q-item>
									<q-item-section>
										<q-item-label caption>已发送</q-item-label>
										<q-item-label>
											{{ connectionStatus.status?.bytesSent }} 字节 /
											{{ connectionStatus.status?.packetsSent }} 包
										</q-item-label>
									</q-item-section>
								</q-item>

								<q-item>
									<q-item-section>
										<q-item-label caption>已接收</q-item-label>
										<q-item-label>
											{{ connectionStatus.status?.bytesReceived }} 字节 /
											{{ connectionStatus.status?.packetsReceived }} 包
										</q-item-label>
									</q-item-section>
								</q-item>

								<q-item v-if="connectionStatus.clients && connectionStatus.clients.length > 0">
									<q-item-section>
										<q-item-label caption>客户端列表</q-item-label>
										<q-item-label>
											<q-chip
												v-for="client in connectionStatus.clients"
												:key="client.id"
												color="info"
												text-color="white"
												size="sm"
											>
												{{ client.id }}: {{ client.address }}:{{ client.port }}
											</q-chip>
										</q-item-label>
									</q-item-section>
								</q-item>
							</q-list>
						</div>

						<div v-else class="text-grey q-pa-md text-center">请选择一个连接</div>
					</q-card-section>
				</q-card>
			</div>

			<!-- 底部：操作日志 -->
			<div class="col-12">
				<q-card>
					<q-card-section>
						<div class="row q-mb-md items-center">
							<div class="text-h6 col">操作日志</div>
							<q-btn flat dense label="清空" icon="mdi-delete" @click="clearLogs" />
						</div>

						<q-scroll-area style="height: 300px">
							<q-list bordered separator>
								<q-item v-for="(log, index) in logs" :key="index">
									<q-item-section avatar>
										<q-icon
											:name="
												log.type === 'success'
													? 'mdi-check-circle'
													: log.type === 'error'
														? 'mdi-alert-circle'
														: 'mdi-information'
											"
											:color="
												log.type === 'success'
													? 'positive'
													: log.type === 'error'
														? 'negative'
														: 'info'
											"
										/>
									</q-item-section>

									<q-item-section>
										<q-item-label caption>{{ log.time }}</q-item-label>
										<q-item-label>{{ log.message }}</q-item-label>
									</q-item-section>
								</q-item>
							</q-list>
						</q-scroll-area>
					</q-card-section>
				</q-card>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { networkAPI } from '@core/api';

// 连接类型选项
const connectionTypeOptions = [
	{ label: 'UDP', value: 'udp' },
	{ label: 'TCP Server', value: 'tcp-server' },
	{ label: 'TCP Client', value: 'tcp-client' },
];

// 连接配置
const connectionType = ref<'udp' | 'tcp-server' | 'tcp-client'>('udp');
const localAddress = ref('0.0.0.0');
const localPort = ref(8080);
const remoteAddress = ref('127.0.0.1');
const remotePort = ref(9000);

// 连接列表
const connections = ref<any[]>([]);
const selectedConnectionId = ref<number | null>(null);
const connectionStatus = ref<any>(null);

// 发送数据
const targetAddress = ref('127.0.0.1');
const targetPort = ref(8080);
const sendDataHex = ref('48 65 6C 6C 6F'); // "Hello"

// 日志
const logs = ref<{ time: string; message: string; type: string }[]>([]);

// 添加日志
function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
	const time = new Date().toLocaleTimeString();
	logs.value.unshift({ time, message, type });
	if (logs.value.length > 100) {
		logs.value.pop();
	}
}

// 创建连接
async function createConnection() {
	try {
		const params: any = {
			type: connectionType.value,
		};

		if (connectionType.value === 'tcp-client') {
			params.remoteAddress = remoteAddress.value;
			params.remotePort = remotePort.value;
		} else {
			params.localAddress = localAddress.value;
			params.localPort = localPort.value;
		}

		const result = await networkAPI.createConnection(params);

		if (result.success) {
			addLog(`创建连接成功，ID: ${result.connectionId}`, 'success');
			await refreshConnections();
		} else {
			addLog(`创建连接失败: ${result.error}`, 'error');
		}
	} catch (error: any) {
		addLog(`创建连接异常: ${error.message}`, 'error');
	}
}

// 刷新连接列表
async function refreshConnections() {
	try {
		connections.value = await networkAPI.getAllConnections();
		addLog(`刷新连接列表，共 ${connections.value.length} 个连接`, 'info');
	} catch (error: any) {
		addLog(`刷新连接列表失败: ${error.message}`, 'error');
	}
}

// 选择连接
async function selectConnection(id: number) {
	selectedConnectionId.value = id;
	try {
		connectionStatus.value = await networkAPI.getConnectionStatus({
			connectionId: id,
		});
		addLog(`查询连接 ${id} 状态`, 'info');
	} catch (error: any) {
		addLog(`查询连接状态失败: ${error.message}`, 'error');
	}
}

// 关闭连接
async function closeConnection(id: number) {
	try {
		const result = await networkAPI.closeConnection({ connectionId: id });
		if (result.success) {
			addLog(`关闭连接 ${id} 成功`, 'success');
			await refreshConnections();
			if (selectedConnectionId.value === id) {
				selectedConnectionId.value = null;
				connectionStatus.value = null;
			}
		} else {
			addLog(`关闭连接失败: ${result.error}`, 'error');
		}
	} catch (error: any) {
		addLog(`关闭连接异常: ${error.message}`, 'error');
	}
}

// 发送数据
async function sendData() {
	if (selectedConnectionId.value === null) {
		addLog('请先选择一个连接', 'error');
		return;
	}

	try {
		// 解析十六进制数据
		const hexValues = sendDataHex.value.trim().split(/\s+/);
		const data = hexValues.map((hex) => parseInt(hex, 16));

		const params: any = {
			connectionId: selectedConnectionId.value,
			data,
		};

		if (targetAddress.value && targetPort.value) {
			params.remoteAddress = targetAddress.value;
			params.remotePort = targetPort.value;
		}

		const result = await networkAPI.sendData(params);

		if (result.success) {
			addLog(`发送数据成功，${result.bytesSent} 字节`, 'success');
			await selectConnection(selectedConnectionId.value);
		} else {
			addLog(`发送数据失败: ${result.error}`, 'error');
		}
	} catch (error: any) {
		addLog(`发送数据异常: ${error.message}`, 'error');
	}
}

// 清空日志
function clearLogs() {
	logs.value = [];
}

// 监听选中连接变化
watch(selectedConnectionId, async (newId) => {
	if (newId !== null) {
		await selectConnection(newId);
	}
});

// 初始化
refreshConnections();
</script>
