// TTFB - Time to First Byte
// Server response: time until first byte received

import { config } from "../config";
import { recordMetric } from "../reporting";
import { state } from "../state";
import { updateDebugOverlay } from "../ui/debug-overlay";
import { doubleRAF, getActivationStart, onBFCacheRestore } from "../visibility";

export function measureTTFB(): void {
	try {
		const reportTTFB = () => {
			const navEntry = performance.getEntriesByType(
				"navigation",
			)[0] as PerformanceNavigationTiming;
			if (navEntry) {
				// Subtract activationStart for prerendered pages
				const value = Math.max(
					navEntry.responseStart - getActivationStart(),
					0,
				);
				state.vitals.TTFB = Math.round(value);
				recordMetric("TTFB", state.vitals.TTFB);
				updateDebugOverlay();
			}
		};

		// Wait until loadEventEnd is available for complete navigation data
		const whenReady = (callback: () => void) => {
			if (document.readyState === "complete") {
				// Use setTimeout to ensure loadEventEnd is populated
				setTimeout(callback, 0);
			} else {
				addEventListener("load", () => setTimeout(callback, 0), { once: true });
			}
		};

		whenReady(reportTTFB);

		// Handle BFCache restoration
		onBFCacheRestore((event) => {
			delete state.vitals.TTFB;
			doubleRAF(() => {
				state.vitals.TTFB = Math.round(performance.now() - event.timeStamp);
				recordMetric("TTFB", state.vitals.TTFB);
				updateDebugOverlay();
			});
		});
	} catch (e) {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] TTFB not supported:", e);
	}
}
