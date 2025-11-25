<template>
	<div
		class="flex h-full overflow-hidden bg-[var(--bg-primary)] font-mono text-[var(--text-primary)]"
	>
		<div
			class="no-wrap flex h-full w-70 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]"
		>
			<div class="border-b border-[var(--border)] px-3 py-1">
				<div class="flex items-center gap-2 text-lg font-bold tracking-widest">
					<q-icon name="radar" class="text-[var(--accent)]" />
					LINK.SYS
				</div>
			</div>

			<div
				class="grid grid-cols-3 gap-3 border border-[var(--border)] bg-[var(--bg-tertiary)] px-2 py-1"
			>
				<button
					v-for="mode in modes"
					:key="mode.value"
					@click="currentMode = mode.value"
					class="py-1 text-xs transition-colors hover:text-[var(--accent)]"
					:class="{
						'bg-[var(--accent)] font-bold text-[var(--bg-secondary)] hover:text-[var(--text-primary)]':
							currentMode === mode.value,
					}"
				>
					{{ mode.label }}
				</button>
			</div>

			<StreamConfiguration class="p-2" />
			<StatusPanel class="flex-1 p-2" />
			<div
				class="flex justify-between border-t border-[var(--border)] p-2 text-[10px] text-[var(--text-secondary)]"
			>
				<span>当前状态: {{ connectionId ? '已连接' : '未连接' }}</span>
				<span>V2.0</span>
			</div>
		</div>

		<div class="flex min-w-0 flex-1 flex-col p-2">
			<header class="flex shrink-0 items-end justify-between px-2 pb-2">
				<div class="text-xs font-bold tracking-widest opacity-80">
					// 当前视图: {{ currentMode.toUpperCase() }}
				</div>
				<div v-if="connectionId" class="sys-text-main flex gap-4 text-xs">
					<span
						>链路ID: <span class="sys-text-highlight">#{{ connectionId }}</span></span
					>
				</div>
			</header>

			<div
				class="grid min-h-0 flex-1 gap-2"
				:class="currentMode === 'loopback' ? 'grid-cols-2' : 'grid-cols-1'"
			>
				<div v-show="showLocal" class="sys-video-box">
					<CameraPreview ref="localVideo" class="fit" />
				</div>

				<div v-show="showRemote" class="sys-video-box">
					<div
						v-if="!connectionId"
						class="absolute inset-0 z-10000 flex items-center justify-center backdrop-blur-sm"
					>
						<div class="text-xs tracking-widest">NO SIGNAL</div>
					</div>

					<RemoteVideoDisplay ref="remoteVideo" class="fit" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CameraPreview from '../modules/videoStream/components/CameraPreview.vue';
import RemoteVideoDisplay from '../modules/videoStream/components/RemoteVideoDisplay.vue';
import StreamConfiguration from '../modules/videoStream/components/StreamConfiguration.vue';
import { provideStreamConfig } from '../modules/videoStream/composables/useStreamConfig';

const { connectionId } = provideStreamConfig();

type Mode = 'sender' | 'receiver' | 'loopback';
const currentMode = ref<Mode>('loopback');

const modes = [
	{ label: '回环测试', value: 'loopback' },
	{ label: '发送端', value: 'sender' },
	{ label: '接收端', value: 'receiver' },
];

const showLocal = computed(() => ['sender', 'loopback'].includes(currentMode.value));
const showRemote = computed(() => ['receiver', 'loopback'].includes(currentMode.value));
</script>

<style lang="scss" scoped>
/* 极简科幻框：只保留边框和背景 */
.sys-video-box {
	position: relative;
	background: rgba(0, 0, 0, 0.2);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
</style>
