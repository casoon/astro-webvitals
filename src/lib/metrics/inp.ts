/**
 * INP - Interaction to Next Paint
 * Responsiveness: 98th percentile of all interaction delays
 */

import type { MetricCallbacks, WebVitalsMetrics } from "../types";
import { onBFCacheRestore } from "../utils/bfcache";
import { whenIdleOrHidden } from "../utils/helpers";

export function measureINP(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	_debug: boolean = false,
): void {
	console.log("[WV] measureINP called");

	try {
		const interactionMap = new Map<number, number>();
		let observer: PerformanceObserver;

		const getP98 = (): number => {
			const durations = Array.from(interactionMap.values()).sort(
				(a, b) => b - a,
			);
			if (durations.length === 0) return 0;

			const len = durations.length;
			if (len <= 10) {
				return durations[0];
			} else if (len <= 50) {
				return durations[Math.min(1, len - 1)];
			} else {
				const index = Math.max(0, Math.ceil(len * 0.02) - 1);
				return durations[index];
			}
		};

		const reportINP = () => {
			const p98 = getP98();
			if (p98 > 0) {
				vitals.INP = Math.round(p98);
				callbacks.onMetric("INP", vitals.INP);
				callbacks.onUpdate();
			}
		};

		const handleEntries = (entries: PerformanceEntryList) => {
			console.log("[WV] INP handleEntries, count:", entries.length);
			whenIdleOrHidden(() => {
				for (const entry of entries) {
					const eventEntry = entry as PerformanceEventTiming;
					if (eventEntry.interactionId) {
						const existingDuration =
							interactionMap.get(eventEntry.interactionId) || 0;
						if (eventEntry.duration > existingDuration) {
							interactionMap.set(eventEntry.interactionId, eventEntry.duration);
							console.log(
								"[WV] INP interaction recorded:",
								eventEntry.interactionId,
								eventEntry.duration,
							);
						}
					}
				}
				reportINP();
			});
		};

		observer = new PerformanceObserver((list) => {
			console.log("[WV] INP observer callback");
			handleEntries(list.getEntries());
		});

		console.log("[WV] INP observer registering...");
		observer.observe({
			type: "event",
			buffered: true,
			durationThreshold: 40,
		} as any);
		console.log("[WV] INP observer registered");

		try {
			observer.observe({ type: "first-input", buffered: true });
		} catch (_e) {
			// first-input might not be supported with event observer
		}

		document.addEventListener(
			"visibilitychange",
			() => {
				if (document.visibilityState === "hidden") {
					handleEntries(observer.takeRecords());
					reportINP();
				}
			},
			{ capture: true },
		);

		onBFCacheRestore(() => {
			interactionMap.clear();
			delete vitals.INP;
		});
	} catch (e) {
		console.error("[WV] INP error:", e);
	}
}
