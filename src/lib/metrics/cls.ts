/**
 * CLS - Cumulative Layout Shift
 * Visual stability: measures unexpected layout movements
 * Uses session windows (max 5s, 1s gap)
 */

import type { MetricCallbacks, WebVitalsMetrics } from "../types";
import { onBFCacheRestore } from "../utils/bfcache";

export function measureCLS(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	debug: boolean = false,
): void {
	try {
		let clsValue = 0;
		let sessionValue = 0;
		let sessionEntries: PerformanceEntry[] = [];
		let observer: PerformanceObserver;

		const MAX_SESSION_DURATION = 5000;
		const SESSION_GAP = 1000;

		const reportCLS = () => {
			vitals.CLS = Math.round(clsValue * 1000) / 1000;
			callbacks.onMetric("CLS", vitals.CLS);
			callbacks.onUpdate();
		};

		const handleEntries = (entries: PerformanceEntryList) => {
			for (const entry of entries) {
				const layoutShift = entry as PerformanceEntry & {
					hadRecentInput: boolean;
					value: number;
				};
				if (!layoutShift.hadRecentInput) {
					const firstEntry = sessionEntries[0];
					const lastEntry = sessionEntries[sessionEntries.length - 1];

					if (
						sessionValue > 0 &&
						(entry.startTime - lastEntry.startTime > SESSION_GAP ||
							entry.startTime - firstEntry.startTime > MAX_SESSION_DURATION)
					) {
						sessionValue = 0;
						sessionEntries = [];
					}

					sessionEntries.push(entry);
					sessionValue += layoutShift.value;

					if (sessionValue > clsValue) {
						clsValue = sessionValue;
						reportCLS();
					}
				}
			}
		};

		observer = new PerformanceObserver((list) => {
			handleEntries(list.getEntries());
		});

		observer.observe({ type: "layout-shift", buffered: true });

		// Initialize CLS to 0 immediately (no shifts = good)
		vitals.CLS = 0;
		callbacks.onUpdate();

		document.addEventListener(
			"visibilitychange",
			() => {
				if (document.visibilityState === "hidden") {
					handleEntries(observer.takeRecords());
					reportCLS();
				}
			},
			{ capture: true },
		);

		onBFCacheRestore(() => {
			clsValue = 0;
			sessionValue = 0;
			sessionEntries = [];
			reportCLS();
		});
	} catch (e) {
		if (debug) console.warn("[@casoon/astro-webvitals] CLS not supported:", e);
	}
}
