// ============================================================
// Additional Navigation Timing Metrics
// ============================================================

import { config } from "../config";
import { recordMetric } from "../reporting";
import { state } from "../state";
import { updateDebugOverlay } from "../ui/debug-overlay";

function getNavEntry(): PerformanceNavigationTiming | undefined {
	return performance.getEntriesByType("navigation")[0] as
		| PerformanceNavigationTiming
		| undefined;
}

export function measureDNS(): void {
	try {
		const navEntry = getNavEntry();
		if (navEntry && navEntry.domainLookupEnd > navEntry.domainLookupStart) {
			state.vitals.DNS = Math.round(
				navEntry.domainLookupEnd - navEntry.domainLookupStart,
			);
			recordMetric("DNS", state.vitals.DNS);
			updateDebugOverlay();
		}
	} catch (e) {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] DNS not available:", e);
	}
}

export function measureTCP(): void {
	try {
		const navEntry = getNavEntry();
		if (navEntry && navEntry.connectEnd > navEntry.connectStart) {
			state.vitals.TCP = Math.round(
				navEntry.connectEnd - navEntry.connectStart,
			);
			recordMetric("TCP", state.vitals.TCP);
			updateDebugOverlay();
		}
	} catch (e) {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] TCP not available:", e);
	}
}

export function measureDOM(): void {
	try {
		const navEntry = getNavEntry();
		if (navEntry && navEntry.domInteractive > navEntry.responseEnd) {
			state.vitals.DOM = Math.round(
				navEntry.domInteractive - navEntry.responseEnd,
			);
			recordMetric("DOM", state.vitals.DOM);
			updateDebugOverlay();
		}
	} catch (e) {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] DOM not available:", e);
	}
}

export function measureLOAD(): void {
	try {
		const navEntry = getNavEntry();
		if (navEntry && navEntry.loadEventEnd > 0) {
			state.vitals.LOAD = Math.round(
				navEntry.loadEventEnd - navEntry.startTime,
			);
			recordMetric("LOAD", state.vitals.LOAD);
			updateDebugOverlay();
		}
	} catch (e) {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] LOAD not available:", e);
	}
}
