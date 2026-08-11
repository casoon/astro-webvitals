/**
 * Metric batching and delivery (fetch, with sendBeacon-style keepalive).
 */

import { config } from "./config";
import { state } from "./state";

export function recordMetric(name: string, value: number): void {
	const metric = {
		name,
		value,
		timestamp: Date.now(),
	};

	if (config.batchReporting) {
		state.metricsBuffer.push(metric);

		if (state.metricsBuffer.length >= 10 || !state.batchTimer) {
			if (state.batchTimer) clearTimeout(state.batchTimer);
			state.batchTimer = setTimeout(flushMetrics, config.batchInterval);
		}
	} else {
		sendMetrics(metric);
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

export function sendMetrics(
	metrics:
		| { name: string; value: number; timestamp: number }
		| { name: string; value: number; timestamp: number }[],
): void {
	if (!config.endpoint) return;

	const payload = {
		metrics: Array.isArray(metrics) ? metrics : [metrics],
		sessionId: config.finalSessionId,
		userId: config.userId,
		timestamp: Date.now(),
		url: window.location.href,
		userAgent: navigator.userAgent,
	};

	fetch(config.endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...config.headers,
		},
		body: JSON.stringify(payload),
		keepalive: true,
	}).catch((err) => {
		if (config.debug)
			console.warn("[@casoon/astro-webvitals] Failed to send metrics:", err);
	});
}
