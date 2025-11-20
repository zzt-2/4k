<template>
	<q-layout view="hHh lpR fFf" class="h-100vh flex flex-col">
		<TopMenuBar />
		<div class="hologram-grid min-h-0 flex-1 overflow-y-auto">
			<TestPage />
			<ParticleEffect />
			<router-view />
		</div>

		<!-- 设置面板 -->
		<q-drawer
			v-model="settingsStore.isSettingsPanelOpen"
			side="left"
			:width="600"
			:breakpoint="0"
			overlay
			elevated
		>
			<SettingsPanel />
		</q-drawer>
	</q-layout>
</template>

<script setup lang="ts">
import { provideAppManagers, useSettingsStore } from '@core/stores';

const appManagers = provideAppManagers({
	debugMode: import.meta.env.DEV, // 开发环境启用调试
});

const settingsStore = useSettingsStore();

// 初始化所有管理器
onMounted(async () => {
	await appManagers.initialize();
});

// 清理
onUnmounted(() => {
	appManagers.destroy();
});
</script>

<style scoped lang="scss">
.hologram-grid {
	background-image:
		linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
		linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
	background-size: 10px 10px;
}
</style>
