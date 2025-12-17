/**
 * FID - First Input Delay
 * Input responsiveness: delay between first interaction and browser response
 */

import type { MetricCallbacks, WebVitalsMetrics } from "../types";
import { onBFCacheRestore } from "../utils/bfcache";
import { visibilityWatcher } from "../utils/visibility";

export function measureFID(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	_debug: boolean = false,
): void {
	console.log("[WV] measureFID called");

	try {
		let observer: PerformanceObserver;

		const handleEntries = (entries: PerformanceEntryList) => {
			console.log("[WV] FID handleEntries called, entries:", entries.length);
			const firstEntry = entries[0] as PerformanceEventTiming;
			if (firstEntry) {
				console.log(
					"[WV] FID first entry:",
					firstEntry.startTime,
					visibilityWatcher.firstHiddenTime,
				);
				if (firstEntry.startTime < visibilityWatcher.firstHiddenTime) {
					const fidValue = Math.round(
						firstEntry.processingStart - firstEntry.startTime,
					);
					console.log("[WV] FID value:", fidValue);
					vitals.FID = fidValue;
					callbacks.onMetric("FID", vitals.FID);
					callbacks.onUpdate();
				}
				if (observer) observer.disconnect();
			}
		};

		observer = new PerformanceObserver((list) => {
			console.log("[WV] FID observer callback");
			handleEntries(list.getEntries());
		});

		console.log("[WV] FID observer registering...");
		observer.observe({ type: "first-input", buffered: true });
		console.log("[WV] FID observer registered");

		onBFCacheRestore(() => {
			delete vitals.FID;
			observer = new PerformanceObserver((list) => {
				handleEntries(list.getEntries());
			});
			observer.observe({ type: "first-input", buffered: true });
		});
	} catch (e) {
		console.error("[WV] FID error:", e);
	}
}
