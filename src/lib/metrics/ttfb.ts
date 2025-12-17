/**
 * TTFB - Time to First Byte
 * Server response: time until first byte received
 */

import type { MetricCallbacks, WebVitalsMetrics } from "../types";
import { onBFCacheRestore } from "../utils/bfcache";
import { doubleRAF, getActivationStart } from "../utils/helpers";

export function measureTTFB(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	debug: boolean = false,
): void {
	try {
		const reportTTFB = () => {
			const navEntry = performance.getEntriesByType(
				"navigation",
			)[0] as PerformanceNavigationTiming;
			if (navEntry) {
				const value = Math.max(
					navEntry.responseStart - getActivationStart(),
					0,
				);
				vitals.TTFB = Math.round(value);
				callbacks.onMetric("TTFB", vitals.TTFB);
				callbacks.onUpdate();
			}
		};

		const whenReady = (callback: () => void) => {
			if (document.readyState === "complete") {
				setTimeout(callback, 0);
			} else {
				addEventListener("load", () => setTimeout(callback, 0), { once: true });
			}
		};

		whenReady(reportTTFB);

		onBFCacheRestore((event) => {
			delete vitals.TTFB;
			doubleRAF(() => {
				vitals.TTFB = Math.round(performance.now() - event.timeStamp);
				callbacks.onMetric("TTFB", vitals.TTFB);
				callbacks.onUpdate();
			});
		});
	} catch (e) {
		if (debug) console.warn("[@casoon/astro-webvitals] TTFB not supported:", e);
	}
}
