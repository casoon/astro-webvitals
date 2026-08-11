// CLS - Cumulative Layout Shift
// Visual stability: measures unexpected layout movements
// Uses session windows (max 5s, 1s gap)

import { config } from "../config";
import { recordMetric } from "../reporting";
import { state } from "../state";
import { updateDebugOverlay } from "../ui/debug-overlay";
import { onBFCacheRestore } from "../visibility";

export function measureCLS(): void {
	try {
		let clsValue = 0;
		let sessionValue = 0;
		let sessionEntries: any[] = [];
		let observer: PerformanceObserver;

		const MAX_SESSION_DURATION = 5000; // 5 second max session window
		const SESSION_GAP = 1000; // 1 second gap resets session

		const reportCLS = () => {
			state.vitals.CLS = Math.round(clsValue * 1000) / 1000;
			recordMetric("CLS", state.vitals.CLS);
			updateDebugOverlay();
		};

		const handleEntries = (entries: any[]) => {
			for (const entry of entries) {
				// Only count shifts without recent user input
				if (!entry.hadRecentInput) {
					const firstEntry = sessionEntries[0];
					const lastEntry = sessionEntries[sessionEntries.length - 1];

					// Start new session if:
					// 1. Gap > 1 second since last entry, OR
					// 2. Session duration > 5 seconds
					if (
						sessionValue > 0 &&
						(entry.startTime - lastEntry.startTime > SESSION_GAP ||
							entry.startTime - firstEntry.startTime > MAX_SESSION_DURATION)
					) {
						sessionValue = 0;
						sessionEntries = [];
					}

					sessionEntries.push(entry);
					sessionValue += entry.value;

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
		state.vitals.CLS = 0;
		updateDebugOverlay();

		// Report final CLS on page hide
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

		// Handle BFCache - reset CLS on restore
		onBFCacheRestore(() => {
			clsValue = 0;
			sessionValue = 0;
			sessionEntries = [];
			reportCLS();
		});
	} catch (e) {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] CLS not supported:", e);
	}
}
