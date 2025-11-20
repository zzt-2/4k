<template>
	<q-card class="rounded-0 flex h-full flex-col">
		<!-- 头部 -->
		<div class="border-b px-6 py-3">
			<div class="flex items-center justify-between">
				<div class="my-text-secondary text-3xl font-semibold">设置</div>
				<q-btn flat round icon="close" @click="closeSettingsPanel" />
			</div>
		</div>

		<!-- 内容区域 -->
		<div class="flex-1 overflow-y-auto p-4">
			<!-- 主题设置 -->
			<div class="mb-6">
				<div class="my-text-secondary mb-4 text-xl font-semibold">主题设置</div>

				<div class="gap-8px p-16px my-bg-primary grid grid-cols-5 rounded-lg">
					<div v-for="theme in themeManager.themes" :key="theme.id" @click="selectTheme(theme.id)">
						<!-- 主题预览颜色 -->
						<div class="mb-2">
							<div class="h-30px mx-8px rounded-8px flex overflow-hidden">
								<div class="flex-1" :style="{ backgroundColor: theme.previewColors[0] }" />
								<div class="flex-1" :style="{ backgroundColor: theme.previewColors[1] }" />
							</div>
						</div>

						<!-- 主题名称 -->
						<div class="flex-center my-text-secondary">
							{{ theme.label }}{{ themeManager.currentThemeId.value === theme.id ? ' (当前)' : '' }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</q-card>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@core/stores';
import { useAppManagers } from '@core/stores';

const settingsStore = useSettingsStore();
const { themeManager } = useAppManagers();

// 关闭设置面板
const closeSettingsPanel = () => {
	settingsStore.closeSettingsPanel();
};

// 选择主题
const selectTheme = (themeId: string) => {
	themeManager.setTheme(themeId);
};
</script>

<style scoped lang="scss"></style>
