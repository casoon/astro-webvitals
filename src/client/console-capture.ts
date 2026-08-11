/**
 * Console log capture - only needed when the debug overlay or console dock
 * can actually display it, to avoid patching window.console on every page load.
 */

import { config } from "./config";
import { state } from "./state";
import { updateConsoleDock } from "./ui/console-dock";
import { updateDebugOverlay } from "./ui/debug-overlay";

export function pushConsoleEntry(type: string, args: unknown[]): void {
	const message = args
		.map((arg) =>
			typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
		)
		.join(" ");

	state.consoleErrors.push({
		type,
		message,
		timestamp: new Date().toISOString(),
	});

	if (state.consoleErrors.length > 200) {
		state.consoleErrors.shift(); // Keep max 200 entries
	}
	if (state.debugContainer && state.activeTab === "console") {
		updateDebugOverlay();
	}
	if (state.consoleDockEnabled) {
		updateConsoleDock();
	}
}

export function initConsoleCapture(): void {
	if (config.debug || config.consoleDock) {
		const originalConsole = {
			log: console.log.bind(console),
			info: console.info.bind(console),
			warn: console.warn.bind(console),
			error: console.error.bind(console),
		};

		(["log", "info", "warn", "error"] as const).forEach((type) => {
			console[type] = (...args: unknown[]) => {
				originalConsole[type](...args);
				pushConsoleEntry(type, args);
			};
		});
	}

	// Custom console logging helper
	(window as any).webVitalsLog = {
		info: (...args: unknown[]) => pushConsoleEntry("info", args),
		warn: (...args: unknown[]) => pushConsoleEntry("warn", args),
		error: (...args: unknown[]) => pushConsoleEntry("error", args),
	};
}
