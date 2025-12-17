/**
 * LCP - Largest Contentful Paint
 * Loading performance: time until largest visible element renders
 */

import type { MetricCallbacks, WebVitalsMetrics } from "../types";
import { onBFCacheRestore } from "../utils/bfcache";
import {
	doubleRAF,
	getActivationStart,
	runOnce,
	whenIdleOrHidden,
} from "../utils/helpers";
import { visibilityWatcher } from "../utils/visibility";

export function measureLCP(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	debug: boolean = false,
): void {
	if (
		!PerformanceObserver ||
		!PerformanceObserver.supportedEntryTypes?.includes(
			"largest-contentful-paint",
		)
	) {
		if (debug) console.warn("[@casoon/astro-webvitals] LCP not supported");
		return;
	}

	try {
		let lcpValue = 0;
		let lcpEntries: PerformanceEntry[] = [];
		let observer: PerformanceObserver;

		const reportLCP = () => {
			if (lcpValue > 0) {
				vitals.LCP = lcpValue;
				callbacks.onMetric("LCP", vitals.LCP);
				callbacks.onUpdate();
			}
		};

		const handleEntries = (entries: PerformanceEntryList) => {
			for (const entry of entries) {
				if (entry.startTime < visibilityWatcher.firstHiddenTime) {
					const value = Math.max(entry.startTime - getActivationStart(), 0);
					if (value > 0) {
						lcpValue = Math.round(value);
						lcpEntries.push(entry);
						// Live update
						vitals.LCP = lcpValue;
						callbacks.onUpdate();
					}
				}
			}
		};

		const stopListening = runOnce(() => {
			whenIdleOrHidden(() => {
				if (observer) {
					handleEntries(observer.takeRecords());
					observer.disconnect();
				}
				reportLCP();
			});
		});

		["keydown", "click"].forEach((type) => {
			addEventListener(type, () => stopListening(), {
				capture: true,
				once: true,
			});
		});

		document.addEventListener(
			"visibilitychange",
			() => {
				if (document.visibilityState === "hidden") {
					stopListening();
				}
			},
			{ capture: true },
		);

		observer = new PerformanceObserver((list) => {
			handleEntries(list.getEntries());
		});

		observer.observe({ type: "largest-contentful-paint", buffered: true });

		onBFCacheRestore((event) => {
			lcpValue = 0;
			lcpEntries = [];
			doubleRAF(() => {
				lcpValue = Math.round(performance.now() - event.timeStamp);
				reportLCP();
			});
		});
	} catch (e) {
		if (debug) console.warn("[@casoon/astro-webvitals] LCP error:", e);
	}
}
