<template>
	<!--
    根容器：高度 h-12 (48px)
    背景色/字体色/边框色 绑定 CSS 变量
  -->
	<div
		class="relative flex h-12 items-center justify-between overflow-hidden transition-colors duration-300 select-none"
		style="
			background-color: var(--bg-secondary);
			color: var(--text-primary);
			border-bottom: 1px solid var(--border);
		"
	>
		<!-- 拖拽区域 -->
		<div class="app-drag-region absolute inset-0 z-0"></div>

		<!-- 标题 + 副标题区域 -->
		<div class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
			<!-- 左装饰线 -->
			<div
				class="mr-4 h-1 w-16 opacity-40 transition-all duration-300 sm:w-32"
				style="background: linear-gradient(to right, transparent, var(--text-secondary))"
			></div>

			<!-- 标题容器 -->
			<div class="flex flex-col items-center justify-center leading-none">
				<h1
					class="font-orbitron m-0 text-lg tracking-[0.15em] whitespace-nowrap uppercase drop-shadow-md"
					style="color: var(--text-primary)"
				>
					{{ '标题Title' }}
				</h1>

				<span
					class="mt-[2px] text-[0.6rem] font-medium tracking-widest uppercase opacity-60"
					style="color: var(--text-secondary)"
				>
					System Ready
				</span>
			</div>

			<!-- 右装饰线 -->
			<div
				class="ml-4 h-1 w-16 opacity-40 transition-all duration-300 sm:w-32"
				style="background: linear-gradient(to left, transparent, var(--text-secondary))"
			></div>
		</div>

		<!-- 左侧：按钮组 (gap-4 防止斜切重叠) -->
		<div class="app-no-drag relative z-10 ml-2 flex items-center gap-4">
			<SciFiButton icon="settings" label="SET" @click="handleSettings" />
		</div>

		<!-- 右侧：窗口控制 -->
		<div class="app-no-drag relative z-10 flex h-full items-center">
			<q-btn
				icon="remove"
				class="h-full w-16 rounded-none"
				size="sm"
				unelevated
				@click="handleMinimize"
			/>
			<q-btn
				:icon="isMaximized ? 'filter_none' : 'crop_square'"
				class="h-full w-16 rounded-none"
				size="sm"
				unelevated
				@click="handleMaximize"
			/>
			<q-btn
				icon="close"
				class="close-btn h-full w-16 rounded-none"
				size="sm"
				unelevated
				@click="handleClose"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
// 假设你的API路径
import { windowAPI } from '@core/api';
import { useSettingsStore } from '@core/stores';

const isMaximized = ref(false);
const settingsStore = useSettingsStore();

const handleSettings = () => {
	settingsStore.toggleSettingsPanel();
};

const handleMinimize = () => {
	windowAPI.minimize();
};

const handleMaximize = async () => {
	windowAPI.maximize();
	isMaximized.value = await windowAPI.isMaximized();
};

const handleClose = () => {
	windowAPI.close();
};

onMounted(async () => {
	// 确保 windowAPI 存在 (开发环境容错)
	if (windowAPI) {
		isMaximized.value = await windowAPI.isMaximized();
	}
});
</script>

<style scoped>
.app-drag-region {
	-webkit-app-region: drag;
}

.app-no-drag {
	-webkit-app-region: no-drag;
}

/* 窗口控制按钮 */
.win-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 32px;
	border: none;
	background: transparent;
	color: var(--text-secondary);
	transition: all 0.2s ease;
	cursor: pointer;
}

.win-btn:hover {
	background-color: var(--border);
	color: var(--text-primary);
}

.close-btn:hover {
	background-color: #e81123;
	/* Win11 风格红 */
	color: white;
}
</style>
