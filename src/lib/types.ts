/**
 * Web Vitals Types
 */

// Extend PerformanceNavigationTiming with activationStart (not yet in all TS libs)
declare global {
	interface PerformanceNavigationTiming {
		activationStart?: number;
	}
}

export interface WebVitalsMetrics {
	LCP?: number;
	FID?: number;
	CLS?: number;
	FCP?: number;
	TTFB?: number;
	INP?: number;
	DNS?: number;
	TCP?: number;
	DOM?: number;
	LOAD?: number;
}

export interface MetricCallbacks {
	onMetric: (name: string, value: number) => void;
	onUpdate: () => void;
}

export interface PerformanceBudget {
	LCP: number;
	FID: number;
	CLS: number;
	FCP: number;
	TTFB: number;
	INP: number;
}
