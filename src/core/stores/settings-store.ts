import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
	// =============== 状态定义 ===============

	/**
	 * 设置面板是否显示
	 */
	const isSettingsPanelOpen = ref(false);

	// =============== 方法定义 ===============

	/**
	 * 打开设置面板
	 */
	const openSettingsPanel = () => {
		isSettingsPanelOpen.value = true;
	};

	/**
	 * 关闭设置面板
	 */
	const closeSettingsPanel = () => {
		isSettingsPanelOpen.value = false;
	};

	/**
	 * 切换设置面板显示状态
	 */
	const toggleSettingsPanel = () => {
		isSettingsPanelOpen.value = !isSettingsPanelOpen.value;
	};

	// =============== 返回所有内容 ===============

	return {
		// 状态
		isSettingsPanelOpen,

		// 方法
		openSettingsPanel,
		closeSettingsPanel,
		toggleSettingsPanel,
	};
});
