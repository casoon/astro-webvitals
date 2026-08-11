// LCP - Largest Contentful Paint
// Loading performance: time until largest visible element renders

import { config } from "../config";
import { recordMetric } from "../reporting";
import { state } from "../state";
import { updateDebugOverlay } from "../ui/debug-overlay";
import {
	doubleRAF,
	getActivationStart,
	onBFCacheRestore,
	runOnce,
	visibilityWatcher,
	whenIdleOrHidden,
} from "../visibility";

export function measureLCP(): void {
	if (
		!PerformanceObserver?.supportedEntryTypes?.includes(
			"largest-contentful-paint",
		)
	) {
		state.lcpUnsupported = true;
		return;
	}

	try {
		let lcpValue = 0;
		let lcpEntries: PerformanceEntry[] = [];
		let observer: PerformanceObserver | undefined;

		const reportLCP = () => {
			if (lcpValue > 0) {
				state.vitals.LCP = lcpValue;
				recordMetric("LCP", state.vitals.LCP);
				updateDebugOverlay();
			}
		};

		const handleEntries = (entries: PerformanceEntry[]) => {
			for (const entry of entries) {
				// Only report if the page wasn't hidden before this LCP
				if (entry.startTime < visibilityWatcher.firstHiddenTime) {
					// Subtract activationStart for prerendered pages
					const value = Math.max(entry.startTime - getActivationStart(), 0);
					if (value > 0) {
						lcpValue = Math.round(value);
						lcpEntries.push(entry);
						// Live update in debug overlay (final report happens in stopListening)
						state.vitals.LCP = lcpValue;
						updateDebugOverlay();
					}
				}
			}
		};

		// Stop observing on user interaction (LCP stops after first input)
		const stopListening = runOnce(() => {
			whenIdleOrHidden(() => {
				if (observer) {
					handleEntries(observer.takeRecords());
					observer.disconnect();
				}
				reportLCP();
			});
		});

		// Stop on keydown, click (pointerdown), or visibility change
		(["keydown", "click"] as const).forEach((type) => {
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

		// Handle BFCache restoration
		onBFCacheRestore((event) => {
			lcpValue = 0;
			lcpEntries = [];
			doubleRAF(() => {
				lcpValue = Math.round(performance.now() - event.timeStamp);
				reportLCP();
			});
		});
	} catch (e) {
		if (config.debug) console.warn("[@casoon/astro-webvitals] LCP error:", e);
	}
}
