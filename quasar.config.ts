// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers';
import UnoCSS from 'unocss/vite';
import unoConfig from './uno.config';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig((/* ctx */) => {
	return {
		// https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
		// preFetch: true,

		// app boot file (/src/boot)
		// --> boot files are part of "main.js"
		// https://v2.quasar.dev/quasar-cli-vite/boot-files
		boot: ['axios', 'unocss', 'pinia'],

		// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
		css: ['app.scss'],

		// https://github.com/quasarframework/quasar/tree/dev/extras
		extras: [
			// 'ionicons-v4',
			// 'mdi-v7',
			// 'fontawesome-v6',
			// 'eva-icons',
			// 'themify',
			// 'line-awesome',
			// 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

			'roboto-font', // optional, you are not bound to it
			'material-icons', // optional, you are not bound to it
		],

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
		build: {
			target: {
				browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
				node: 'node22',
			},

			typescript: {
				strict: true,
				vueShim: true,
				// extendTsConfig (tsConfig) {}
			},

			vueRouterMode: 'hash', // available values: 'hash', 'history'
			// vueRouterBase,
			// vueDevtools,
			// vueOptionsAPI: false,

			// rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

			// publicPath: '/',
			// analyze: true,
			// env: {},
			// rawDefine: {}
			// ignorePublicFolder: true,
			minify: false,
			// polyfillModulePreload: true,
			// distDir

			extendViteConf(viteConf) {
				// 使用配置文件初始化UnoCSS
				viteConf.plugins?.push(UnoCSS(unoConfig));
				viteConf.build!.sourcemap = true;
				viteConf.plugins?.unshift(vueDevTools());
				viteConf.resolve.alias = {
					...viteConf.resolve.alias,
					'@core': '/src/core',
				};
			},

			// viteVuePluginOptions: {},

			vitePlugins: [
				// [
				// 	'vite-plugin-checker',
				// 	{
				// 		vueTsc: true,
				// 		eslint: {
				// 			lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
				// 			useFlatConfig: true,
				// 		},
				// 	},
				// 	{ server: false },
				// ],
				[
					'unplugin-auto-import/vite',
					{
						imports: ['vue', 'vue-router', '@vueuse/core'],
						dirs: ['src/stores/**', 'src/types/**', 'src/components/**', 'src/core/composables/**'],
						dts: 'src/auto-imports.d.ts',
					},
				],
				[
					'unplugin-vue-components/vite',
					{
						dirs: ['src/core/components', 'src/pages', 'src/modules/**/components', 'src/ui'],
						dts: 'src/components.d.ts',
					},
				],
			],
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
		devServer: {
			// https: true,
			open: true, // opens browser window automatically
		},

		// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
		framework: {
			config: {},

			// iconSet: 'material-icons', // Quasar icon set
			// lang: 'en-US', // Quasar language pack

			// For special cases outside of where the auto-import strategy can have an impact
			// (like functional components as one of the examples),
			// you can manually specify Quasar components/directives to be available everywhere:
			//
			// components: [],
			// directives: [],

			// Quasar plugins
			plugins: [
				'Notify',
				'Dialog',
				'Loading',
				'Dark',
				// ...其他插件
			],
		},

		// animations: 'all', // --- includes all animations
		// https://v2.quasar.dev/options/animations
		animations: [],

		// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#sourcefiles
		// sourceFiles: {
		//   rootComponent: 'src/App.vue',
		//   router: 'src/router/index',
		//   store: 'src/store/index',
		//   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
		//   pwaServiceWorker: 'src-pwa/custom-service-worker',
		//   pwaManifestFile: 'src-pwa/manifest.json',
		//   electronMain: 'src-electron/electron-main',
		//   electronPreload: 'src-electron/electron-preload'
		//   bexManifestFile: 'src-bex/manifest.json
		// },

		// https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
		ssr: {
			prodPort: 3000, // The default port that the production server should use
			// (gets superseded if process.env.PORT is specified at runtime)

			middlewares: [
				'render', // keep this as last one
			],

			// extendPackageJson (json) {},
			// extendSSRWebserverConf (esbuildConf) {},

			// manualStoreSerialization: true,
			// manualStoreSsrContextInjection: true,
			// manualStoreHydration: true,
			// manualPostHydrationTrigger: true,

			pwa: false,
			// pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!

			// pwaExtendGenerateSWOptions (cfg) {},
			// pwaExtendInjectManifestOptions (cfg) {}
		},

		// https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
		pwa: {
			workboxMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
			// swFilename: 'sw.js',
			// manifestFilename: 'manifest.json',
			// extendManifestJson (json) {},
			// useCredentialsForManifestTag: true,
			// injectPwaMetaTags: false,
			// extendPWACustomSWConf (esbuildConf) {},
			// extendGenerateSWOptions (cfg) {},
			// extendInjectManifestOptions (cfg) {}
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
		cordova: {
			// noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
		capacitor: {
			hideSplashscreen: true,
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
		electron: {
			extendElectronMainConf: (esbuildConf) => {
				esbuildConf.entryPoints = {
					main: 'src-electron/main/index.ts',
				};
			},
			extendElectronPreloadConf: (esbuildConf) => {
				esbuildConf.entryPoints = {
					preload: 'src-electron/preload/index.ts',
				};
			},

			// extendPackageJson (json) {},

			// Electron preload scripts (if any) from /src-electron, WITHOUT file extension
			preloadScripts: ['electron-preload'],

			// specify the debugging port to use for the Electron app when running in development mode
			inspectPort: 5858,

			bundler: 'builder', // 'packager' or 'builder'

			packager: {
				// https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
				// OS X / Mac App Store
				// appBundleId: '',
				// appCategoryType: '',
				// osxSign: '',
				// protocol: 'myapp://path',
				// Windows only
				// win32metadata: { ... }
			},

			builder: {
				// https://www.electron.build/configuration/configuration

				appId: 'test',

				// 启用 asar 打包（默认启用）
				asar: true,

				// 排除 public 文件夹，不将其打包到 asar 中
				// 然后使用 extraResources 将其作为额外资源放在 resources/public
				files: [
					'**/*',
					'!public/**/*', // 排除 public 文件夹，不打包到 asar
				],

				extraResources: [
					{
						from: 'public',
						to: 'public',
						filter: ['**/*'],
					},
				],

				// 配置 Windows 特定的构建选项
				win: {
					target: [
						{
							target: 'nsis',
							arch: ['x64'],
						},
					],
				},

				// 配置 NSIS 安装程序选项
				nsis: {
					oneClick: false,
					allowToChangeInstallationDirectory: true,
				},

				// 配置 Linux 特定的构建选项
				linux: {
					target: [
						{
							target: 'AppImage',
							arch: ['x64'],
						},
						{
							target: 'deb',
							arch: ['x64'],
						},
					],
					icon: 'src-electron/icons/icon.png',
					category: 'Utility',
					// 可执行文件名（使用英文，避免路径问题）
					executableName: 'test',
					// deb 包描述信息
					synopsis: '测试用',
					description: '测试用应用程序',
					// desktop 文件配置
					desktop: {
						Name: '测试用',
						GenericName: '测试用',
						Comment: '测试用',
						Categories: 'Utility;',
						Keywords: 'test;commander;',
						// Exec 字段会自动生成，格式为: executableName %U
						// Terminal: false, // 默认 false，如果设置为 true，会在终端中运行
						StartupNotify: true, // 启用启动通知
					},
				},
			},
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
		bex: {
			// extendBexScriptsConf (esbuildConf) {},
			// extendBexManifestJson (json) {},

			/**
			 * The list of extra scripts (js/ts) not in your bex manifest that you want to
			 * compile and use in your browser extension. Maybe dynamic use them?
			 *
			 * Each entry in the list should be a relative filename to /src-bex/
			 *
			 * @example [ 'my-script.ts', 'sub-folder/my-other-script.js' ]
			 */
			extraScripts: [],
		},
	};
});
