import { ref, computed } from 'vue';
import type { InjectionKey } from 'vue';

// =============== 类型定义 ===============

export interface Theme {
	id: string;
	label: string;
	previewColors: [string, string]; // 两种颜色用于预览
}

export type ThemeManager = ReturnType<typeof createThemeManager>;
const THEME_MANAGER_KEY: InjectionKey<ThemeManager> = Symbol('theme-manager');

// =============== 工具函数 ===============

// 主题定义（颜色定义在 src/css/color.scss）
const THEMES: Record<string, Theme> = {
	light: {
		id: 'light',
		label: '浅色',
		previewColors: ['#f0f4f8', '#ffffff'],
	},
	warm: {
		id: 'warm',
		label: '暖色',
		previewColors: ['#ffffef', '#fff9e6'],
	},
	blue: {
		id: 'blue',
		label: '淡蓝色',
		previewColors: ['#e2f7ff', '#ddfdff'],
	},
	mint: {
		id: 'mint',
		label: '薄荷绿',
		previewColors: ['#eefffc', '#d8fff4'],
	},
	dark: {
		id: 'dark',
		label: '深色',
		previewColors: ['#1a1f2e', '#0f1419'],
	},
	ocean: {
		id: 'ocean',
		label: '海洋蓝',
		previewColors: ['#0a1628', '#1a3a4d'],
	},
	forest: {
		id: 'forest',
		label: '森林绿',
		previewColors: ['#0d2f1a', '#1a4d2e'],
	},
	'stardust-gray': {
		id: 'stardust-gray',
		label: '星尘灰',
		previewColors: ['#121217', '#1d1d28'],
	},
	'quantum-purple': {
		id: 'quantum-purple',
		label: '量子紫',
		previewColors: ['#100a27', '#1d1240'],
	},
};

// =============== 创建图层管理器 ===============

function createThemeManager() {
	// =============== 状态管理 ===============

	const currentThemeId = ref<string>('dark');

	// =============== 计算属性 ===============

	const currentTheme = computed(() => {
		return THEMES[currentThemeId.value] || THEMES.dark;
	});

	const themeList = computed(() => {
		return Object.values(THEMES);
	});

	// =============== 方法实现 ===============

	const setTheme = (themeId: string): void => {
		if (THEMES[themeId]) {
			currentThemeId.value = themeId;
			applyTheme(themeId);
		}
	};

	const applyTheme = (themeId: string): void => {
		const theme = THEMES[themeId];
		if (!theme) return;

		const root = document.documentElement;

		// 设置主题属性（颜色由 color.scss 中的 [data-theme] 选择器定义）
		root.setAttribute('data-theme', themeId);
		localStorage.setItem('app-theme', themeId);
	};

	const initialize = async (): Promise<void> => {
		// 从 localStorage 读取保存的主题
		const savedTheme = localStorage.getItem('app-theme') || 'dark';
		setTheme(savedTheme);
	};

	// =============== 返回所有内容 ===============

	return {
		// 状态
		currentThemeId,
		currentTheme,
		themeList,
		themes: Object.values(THEMES),

		// 方法
		setTheme,
		initialize,
	};
}

// =============== Provide/Inject 函数 ===============

export function provideThemeManager(/* props: ThemeManagerProps */) {
	const manager = createThemeManager(/* props */);
	provideLocal(THEME_MANAGER_KEY, manager);
	return manager;
}

export function useThemeManager() {
	const manager = injectLocal(THEME_MANAGER_KEY);
	if (!manager) {
		throw new Error('useThemeManager must be called within provideThemeManager');
	}
	return manager;
}
