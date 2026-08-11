// INP - Interaction to Next Paint
// Responsiveness: 98th percentile of all interaction delays

import { config } from "../config";
import { recordMetric } from "../reporting";
import { state } from "../state";
import { updateDebugOverlay } from "../ui/debug-overlay";
import { onBFCacheRestore, whenIdleOrHidden } from "../visibility";

export function measureINP(): void {
	try {
		// Store interaction durations for 98th percentile calculation
		const interactionMap = new Map<number, number>(); // interactionId -> max duration
		let observer: PerformanceObserver;

		// Calculate 98th percentile from interaction durations
		const getP98 = () => {
			const durations = Array.from(interactionMap.values()).sort(
				(a, b) => b - a,
			);
			if (durations.length === 0) return 0;

			// 98th percentile: we want the value that 98% of values are <= to
			// For small samples, use the highest value
			// Formula: index = ceil(N * 0.98) - 1, but for small N use max
			const len = durations.length;
			if (len <= 10) {
				// For <= 10 interactions, use the worst one
				return durations[0];
			} else if (len <= 50) {
				// For 11-50, use 2nd worst
				return durations[Math.min(1, len - 1)];
			} else {
				// For > 50, calculate proper 98th percentile
				const index = Math.max(0, Math.ceil(len * 0.02) - 1);
				return durations[index];
			}
		};

		const reportINP = () => {
			const p98 = getP98();
			if (p98 > 0) {
				state.vitals.INP = Math.round(p98);
				recordMetric("INP", state.vitals.INP);
				updateDebugOverlay();
			}
		};

		const handleEntries = (entries: any[]) => {
			// Process entries in idle time to avoid affecting INP itself
			whenIdleOrHidden(() => {
				for (const entry of entries) {
					// Only process entries with valid interactionId
					if (entry.interactionId) {
						const existingDuration =
							interactionMap.get(entry.interactionId) || 0;
						// Use duration (includes processing + presentation delay)
						if (entry.duration > existingDuration) {
							interactionMap.set(entry.interactionId, entry.duration);
						}
					}
				}
				reportINP();
			});
		};

		observer = new PerformanceObserver((list) => {
			handleEntries(list.getEntries());
		});

		// durationThreshold: 40ms filters out very fast interactions
		// This is the minimum event duration (2.5+ frames at 60Hz)
		observer.observe({
			type: "event",
			buffered: true,
			durationThreshold: 40,
		} as any);

		// Also observe first-input for fallback
		try {
			observer.observe({ type: "first-input", buffered: true });
		} catch (_e) {
			// first-input might not be supported with event observer
		}

		// Report on visibility change
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

		// Handle BFCache - reset INP on restore
		onBFCacheRestore(() => {
			interactionMap.clear();
			delete state.vitals.INP;
		});
	} catch (e) {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] INP not supported:", e);
	}
}
