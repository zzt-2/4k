import { setupWindowIPC } from './windowHandlers';
import { setupNetworkIPC } from './networkHandlers';

export function setupIPC() {
	setupWindowIPC();
	setupNetworkIPC();
}
