import type { api } from './preload';

declare namespace NodeJS {
	interface ProcessEnv {
		QUASAR_PUBLIC_FOLDER: string;
		QUASAR_ELECTRON_PRELOAD_FOLDER: string;
		QUASAR_ELECTRON_PRELOAD_EXTENSION: string;
		APP_URL: string;
	}
}

declare global {
	interface Window {
		electron: typeof api;
	}
}
