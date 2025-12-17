/**
 * FCP - First Contentful Paint
 * Initial render: time until first content appears
 */

import type { MetricCallbacks, WebVitalsMetrics } from "../types";
import { onBFCacheRestore } from "../utils/bfcache";
import { doubleRAF, getActivationStart } from "../utils/helpers";
import { visibilityWatcher } from "../utils/visibility";

export function measureFCP(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	debug: boolean = false,
): void {
	try {
		let observer: PerformanceObserver;

		const reportFCP = (value: number) => {
			vitals.FCP = value;
			callbacks.onMetric("FCP", vitals.FCP);
			callbacks.onUpdate();
		};

		const handleEntries = (entries: PerformanceEntryList) => {
			const fcpEntry = entries.find((e) => e.name === "first-contentful-paint");
			if (fcpEntry) {
				if (fcpEntry.startTime < visibilityWatcher.firstHiddenTime) {
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

		onBFCacheRestore((event) => {
			delete vitals.FCP;
			doubleRAF(() => {
				reportFCP(Math.round(performance.now() - event.timeStamp));
			});
		});
	} catch (e) {
		if (debug) console.warn("[@casoon/astro-webvitals] FCP not supported:", e);
	}
}
