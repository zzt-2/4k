import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetWind4,
	transformerDirectives,
	transformerVariantGroup,
} from 'unocss';

export default defineConfig({
	presets: [
		presetWind4(),
		presetAttributify(),
		presetIcons({
			prefix: 'i-',
			extraProperties: {
				display: 'inline-block',
			},
		}),
	],
	content: {
		pipeline: {
			include: [/\.(vue|[jt]sx|vine.ts)($|\?)/, /src\/.*.ts$/],
		},
	},
	transformers: [transformerVariantGroup(), transformerDirectives()],
	theme: {
		colors: {
			// 主题色紫色
			primary: 'rgb(168, 85, 247)',
		},
	},
	shortcuts: {
		'flex-center': 'flex items-center justify-center',
		'grid-center': 'grid place-items-center',
	},
});
