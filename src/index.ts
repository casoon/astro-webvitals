/**
 * @casoon/astro-webvitals
 *
 * A comprehensive Web Vitals monitoring component for Astro
 * with advanced features like batch reporting, sampling, and accessibility
 *
 * @packageDocumentation
 */

export { default as WebVitals } from "./WebVitals.astro";

/**
 * Web Vitals metric interface
 */
export interface WebVitalsMetric {
	/** Metric name (LCP, CLS, INP, FCP, TTFB, or an enabled extra metric) */
	name: string;
	/** Latest metric value (milliseconds for timing metrics, unitless for CLS) */
	value: number;
	/** Change since the previous report for this metric instance */
	delta: number;
	/** Stable identifier for aggregating a metric instance */
	id: string;
	/** Rating calculated using the official Web Vitals thresholds */
	rating?: "good" | "needs-improvement" | "poor";
	/** Browser navigation that produced the metric */
	navigationType?: string;
	/** Optional, privacy-safe attribution for diagnosing poor field metrics */
	attribution?: {
		target?: string;
		url?: string;
		largestShiftTime?: number;
		largestShiftValue?: number;
		interactionType?: string;
	};
	/** Page URL where metric was measured */
	url: string;
	/** Timestamp when metric was captured */
	timestamp: number;
	/** User agent string */
	userAgent: string;
	/** Optional target element for interaction metrics */
	target?: string;
}

/**
 * Extended metrics payload
 */
export interface ExtendedMetrics {
	/** Memory usage information (Chrome only) */
	memory?: {
		used: number;
		total: number;
	};
	/** Network connection information */
	connection?: {
		type: string;
		rtt?: number;
		downlink?: number;
	};
}

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
	/** Largest Contentful Paint threshold (ms) */
	LCP?: number;
	/** Cumulative Layout Shift threshold */
	CLS?: number;
	/** First Contentful Paint threshold (ms) */
	FCP?: number;
	/** Time to First Byte threshold (ms) */
	TTFB?: number;
	/** Interaction to Next Paint threshold (ms) */
	INP?: number;
}

/**
 * Props for WebVitals component
 */
export interface WebVitalsProps {
	/** Enable debug overlay showing metrics in real-time */
	debug?: boolean;
	/** Dock a console log viewer at the bottom of the page */
	consoleDock?: boolean;
	/** Optional endpoint to send metrics to (POST request) */
	endpoint?: string;
	/** Position of debug overlay */
	position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
	/** Track metrics even in development mode */
	trackInDev?: boolean;
	/** Sampling rate (0-1) - percentage of users to track */
	sampleRate?: number;
	/** Enable batch reporting to reduce requests */
	batchReporting?: boolean;
	/** Interval for batch reporting (ms) */
	batchInterval?: number;
	/** Enable WCAG accessibility checking */
	checkAccessibility?: boolean;
	/** Highlight elements that fail WCAG checks */
	highlightAccessibility?: boolean;
	/** Enable extended metrics (Long Tasks, Memory, Network) */
	extendedMetrics?: boolean;
	/** Enable smart detection (rage clicks, dead clicks) */
	smartDetection?: boolean;
	/** Performance budget thresholds */
	performanceBudget?: PerformanceBudget;
	/** Custom headers for endpoint requests */
	headers?: Record<string, string>;
	/** Session ID for tracking */
	sessionId?: string;
	/** User ID for tracking */
	userId?: string;
	/** Include experimental browser-detected soft navigations */
	trackSoftNavigations?: boolean;
	/** Include privacy-safe diagnostic context for Web Vitals */
	attribution?: boolean;
	/** Report browser long tasks above 50ms */
	trackLongTasks?: boolean;
	/** Maximum metric entries per reporting request */
	maxBatchSize?: number;
	/** Retry failed metrics from localStorage on a later visit */
	retryFailedMetrics?: boolean;
	/** Respect the browser's Do Not Track preference */
	respectDnt?: boolean;
	/** Explicit consent gate for initializing collection */
	consent?: boolean;
}
