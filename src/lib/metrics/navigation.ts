/**
 * Navigation Timing Metrics
 */

import type { MetricCallbacks, WebVitalsMetrics } from "../types";

export function measureDNS(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	debug: boolean = false,
): void {
	try {
		const navEntry = performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;
		if (navEntry) {
			vitals.DNS = Math.round(
				navEntry.domainLookupEnd - navEntry.domainLookupStart,
			);
			callbacks.onUpdate();
		}
	} catch (e) {
		if (debug) console.warn("[@casoon/astro-webvitals] DNS not available:", e);
	}
}

export function measureTCP(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	debug: boolean = false,
): void {
	try {
		const navEntry = performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;
		if (navEntry) {
			vitals.TCP = Math.round(navEntry.connectEnd - navEntry.connectStart);
			callbacks.onUpdate();
		}
	} catch (e) {
		if (debug) console.warn("[@casoon/astro-webvitals] TCP not available:", e);
	}
}

export function measureDOM(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	debug: boolean = false,
): void {
	try {
		const navEntry = performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;
		if (navEntry) {
			vitals.DOM = Math.round(
				navEntry.domContentLoadedEventEnd - navEntry.responseEnd,
			);
			callbacks.onUpdate();
		}
	} catch (e) {
		if (debug) console.warn("[@casoon/astro-webvitals] DOM not available:", e);
	}
}

export function measureLOAD(
	vitals: WebVitalsMetrics,
	callbacks: MetricCallbacks,
	debug: boolean = false,
): void {
	try {
		const navEntry = performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;
		if (navEntry && navEntry.loadEventEnd > 0) {
			vitals.LOAD = Math.round(navEntry.loadEventEnd - navEntry.startTime);
			callbacks.onUpdate();
		}
	} catch (e) {
		if (debug) console.warn("[@casoon/astro-webvitals] LOAD not available:", e);
	}
}
