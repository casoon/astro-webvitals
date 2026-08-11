// FCP - First Contentful Paint
// Initial render: time until first content appears

import { config } from "../config";
import { recordMetric } from "../reporting";
import { state } from "../state";
import { updateDebugOverlay } from "../ui/debug-overlay";
import {
	doubleRAF,
	getActivationStart,
	onBFCacheRestore,
	visibilityWatcher,
} from "../visibility";

export function measureFCP(): void {
	try {
		let observer: PerformanceObserver | undefined;

		const reportFCP = (value: number) => {
			state.vitals.FCP = value;
			recordMetric("FCP", state.vitals.FCP);
			updateDebugOverlay();
		};

		const handleEntries = (entries: PerformanceEntry[]) => {
			const fcpEntry = entries.find((e) => e.name === "first-contentful-paint");
			if (fcpEntry) {
				// Only report if the page wasn't hidden before FCP
				if (fcpEntry.startTime < visibilityWatcher.firstHiddenTime) {
					// Subtract activationStart for prerendered pages
					const value = Math.max(fcpEntry.startTime - getActivationStart(), 0);
					reportFCP(Math.round(value));
				}
				if (observer) observer.disconnect();
			}
		};

		observer = new PerformanceObserver((list) => {
			handleEntries(list.getEntries());
		});

		observer.observe({ type: "paint", buffered: true });

		// Handle BFCache restoration
		onBFCacheRestore((event) => {
			delete state.vitals.FCP;
			doubleRAF(() => {
				reportFCP(Math.round(performance.now() - event.timeStamp));
			});
		});
	} catch (e) {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] FCP not supported:", e);
	}
}
