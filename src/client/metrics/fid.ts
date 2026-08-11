// FID - First Input Delay
// Input responsiveness: delay between first interaction and browser response
// Deprecated in favor of INP, but still tracked for compatibility

import { recordMetric } from "../reporting";
import { state } from "../state";
import { updateDebugOverlay } from "../ui/debug-overlay";
import { onBFCacheRestore, visibilityWatcher } from "../visibility";

export function measureFID(): void {
	try {
		let observer: PerformanceObserver | undefined;

		const handleEntries = (entries: PerformanceEntry[]) => {
			const firstEntry = entries[0] as any;
			if (firstEntry) {
				// Only report if the page wasn't hidden before this input
				if (firstEntry.startTime < visibilityWatcher.firstHiddenTime) {
					const fidValue = Math.round(
						firstEntry.processingStart - firstEntry.startTime,
					);
					state.vitals.FID = fidValue;
					recordMetric("FID", state.vitals.FID);
					updateDebugOverlay();
				}
				if (observer) observer.disconnect();
			}
		};

		observer = new PerformanceObserver((list) => {
			handleEntries(list.getEntries());
		});

		observer.observe({ type: "first-input", buffered: true });

		// Handle BFCache - reset FID on restore
		onBFCacheRestore(() => {
			if (observer) observer.disconnect();
			delete state.vitals.FID;
			observer = new PerformanceObserver((list) => {
				handleEntries(list.getEntries());
			});
			observer.observe({ type: "first-input", buffered: true });
		});
	} catch (e) {
		console.error("[WV] FID error:", e);
	}
}
