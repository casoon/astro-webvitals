/**
 * Metric batching and delivery (fetch, with sendBeacon-style keepalive).
 */

import { config } from "./config";
import { type MetricEntry, state } from "./state";

export type ReportableMetric = Omit<MetricEntry, "timestamp">;

const FAILED_METRICS_KEY = "casoon-webvitals-failed-metrics";
const MAX_STORED_METRICS = 50;

export function recordMetric(metric: ReportableMetric): void {
	if (!config.endpoint) return;
	const entry: MetricEntry = { ...metric, timestamp: Date.now() };

	if (config.batchReporting) {
		state.metricsBuffer.push(entry);

		if (state.metricsBuffer.length >= config.maxBatchSize) {
			flushMetrics();
			return;
		}
		if (!state.batchTimer) {
			state.batchTimer = setTimeout(flushMetrics, config.batchInterval);
		}
	} else {
		sendMetrics(entry);
	}
}

export function flushMetrics(): void {
	if (state.metricsBuffer.length === 0) return;
	sendMetrics([...state.metricsBuffer]);
	state.metricsBuffer.length = 0;
	if (state.batchTimer) {
		clearTimeout(state.batchTimer);
		state.batchTimer = null;
	}
}

export function sendMetrics(metrics: MetricEntry | MetricEntry[]): void {
	if (!config.endpoint) return;

	const payload = {
		metrics: Array.isArray(metrics) ? metrics : [metrics],
		sessionId: config.finalSessionId,
		userId: config.userId,
		timestamp: Date.now(),
		url: window.location.href,
		userAgent: navigator.userAgent,
	};

	const body = JSON.stringify(payload);
	const hasCustomHeaders = Object.keys(config.headers).length > 0;
	if (
		!hasCustomHeaders &&
		typeof navigator.sendBeacon === "function" &&
		navigator.sendBeacon(
			config.endpoint,
			new Blob([body], { type: "application/json" }),
		)
	) {
		return;
	}

	fetch(config.endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...config.headers,
		},
		body,
		keepalive: true,
	}).catch((err) => {
		persistFailedMetrics(Array.isArray(metrics) ? metrics : [metrics]);
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] Failed to send metrics:", err);
	});
}

export function retryFailedMetrics(): void {
	if (!config.retryFailedMetrics || !config.endpoint) return;
	try {
		const stored = window.localStorage.getItem(FAILED_METRICS_KEY);
		if (!stored) return;
		const metrics = JSON.parse(stored) as MetricEntry[];
		if (!Array.isArray(metrics) || metrics.length === 0) return;
		window.localStorage.removeItem(FAILED_METRICS_KEY);
		sendMetrics(metrics.slice(-MAX_STORED_METRICS));
	} catch {
		// Storage can be unavailable in privacy-focused browser contexts.
	}
}

function persistFailedMetrics(metrics: MetricEntry[]): void {
	if (!config.retryFailedMetrics) return;
	try {
		const stored = window.localStorage.getItem(FAILED_METRICS_KEY);
		const existing = stored ? (JSON.parse(stored) as MetricEntry[]) : [];
		const next = [
			...(Array.isArray(existing) ? existing : []),
			...metrics,
		].slice(-MAX_STORED_METRICS);
		window.localStorage.setItem(FAILED_METRICS_KEY, JSON.stringify(next));
	} catch {
		// Collection must not fail because persistent storage is unavailable.
	}
}
