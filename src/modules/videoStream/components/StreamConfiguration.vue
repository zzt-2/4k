<template>
	<div class="flex flex-col gap-2 font-sans text-[var(--text-primary)]">
		<q-card>
			<div class="mb-3 flex items-center justify-between border-b border-[var(--border)]/50 pb-1">
				<div class="flex items-center gap-2 text-sm font-bold tracking-wide">
					<q-icon name="settings" size="xs" class="text-[var(--accent)]" />
					连接配置
				</div>
				<div class="font-mono text-[10px] text-[var(--text-secondary)] opacity-60">NET.CONFIG</div>
			</div>

			<div class="mb-3 grid grid-cols-2 gap-x-3 gap-y-2">
				<q-input
					v-model="localAddress"
					label="本地地址"
					dense
					outlined
					class="font-mono text-xs"
					input-class="text-xs"
				/>
				<q-input
					v-model.number="localPort"
					label="本地端口"
					type="number"
					dense
					outlined
					class="font-mono text-xs"
					input-class="text-xs"
				/>
				<q-input
					v-model="remoteAddress"
					label="远程地址"
					dense
					outlined
					class="font-mono text-xs"
					input-class="text-xs"
				/>
				<q-input
					v-model.number="remotePort"
					label="远程端口"
					type="number"
					dense
					outlined
					class="font-mono text-xs"
					input-class="text-xs"
				/>
			</div>

			<div class="flex w-full flex-col gap-3">
				<div
					class="my-border-default flex items-center justify-between gap-3 bg-[var(--bg-tertiary)]/50 p-2"
				>
					<div class="my-text-secondary text-xs">视频源选择</div>
					<q-radio
						v-model="sourceType"
						val="camera"
						label="摄像头"
						dense
						size="xs"
						color="accent"
						class="text-xs"
					/>
					<q-radio
						v-model="sourceType"
						val="video"
						label="文件"
						dense
						size="xs"
						color="accent"
						class="text-xs"
					/>
				</div>

				<q-file
					v-model="selectedFile"
					v-if="sourceType === 'video'"
					label="选择视频文件"
					outlined
					dense
					input-class="text-xs"
					accept="video/*"
				>
					<template v-slot:prepend>
						<q-icon name="folder" size="xs" color="accent" />
					</template>
				</q-file>

				<div class="flex w-full gap-2">
					<q-btn
						unelevated
						size="sm"
						class="w-full px-4"
						@click="connectionId !== null ? closeConnection() : createConnection()"
						:color="connectionId !== null ? 'warning' : 'accent'"
					>
						<span>{{ connectionId !== null ? '断开连接' : '建立连接' }}</span>
					</q-btn>
				</div>
			</div>
		</q-card>
	</div>
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

<style scoped></style>
