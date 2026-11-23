/**
 * Metric batching and delivery.
 *
 * Every request — a normal batch, an unload beacon or a retry — carries one
 * self-contained report: the page the metrics were measured on, the session
 * and a `reportId` that stays the same across retries, so an endpoint can
 * drop duplicates. A retry resends the stored report unchanged instead of
 * rebuilding it from the page that happens to be open later.
 */

import { config } from "./config";
import { persistDashboardMetric } from "./dashboard-storage";
import { type MetricEntry, state } from "./state";

export type ReportableMetric = Omit<MetricEntry, "timestamp" | "url"> & {
	url?: string;
};

export interface ReportPayload {
	/** Unique per report; unchanged when the same report is retried. */
	reportId: string;
	metrics: MetricEntry[];
	sessionId: string;
	userId?: string;
	/** When the report was first built (ms since epoch). */
	timestamp: number;
	/** Page the metrics were measured on (origin + path unless `fullUrl`). */
	url: string;
	/** Only present with `includeUserAgent`. */
	userAgent?: string;
}

interface QueuedReport {
	payload: ReportPayload;
	attempts: number;
	notBefore: number;
}

export const FAILED_REPORTS_KEY = "casoon-webvitals-failed-reports";
/** Storage key of releases before 0.5, which kept bare metrics without context. */
const LEGACY_FAILED_METRICS_KEY = "casoon-webvitals-failed-metrics";
const MAX_QUEUED_REPORTS = 20;
export const MAX_ATTEMPTS = 3;
const MAX_REPORT_AGE = 24 * 60 * 60 * 1000;
const BASE_RETRY_DELAY = 5000;

let retryTimer: ReturnType<typeof setTimeout> | null = null;

export function createId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
		return crypto.randomUUID();
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Origin and path only, unless the site opted into full URLs. */
export function reportUrl(href: string): string {
	if (config.fullUrl) return href;
	try {
		const url = new URL(href, window.location.href);
		return `${url.origin}${url.pathname}`;
	} catch {
		return href.split(/[?#]/)[0];
	}
}

export function recordMetric(metric: ReportableMetric): void {
	if (!state.active) return;
	const entry: MetricEntry = {
		...metric,
		url: reportUrl(metric.url ?? state.documentUrl),
		timestamp: Date.now(),
	};
	if (config.dashboard) persistDashboardMetric(entry);
	if (!config.endpoint) return;

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
		sendMetrics([entry]);
	}
}

/**
 * Sends the buffered metrics. `unloading` is set from pagehide and from the
 * page becoming hidden: the response can no longer be read then, so
 * `sendBeacon` is the more reliable transport.
 */
export function flushMetrics(unloading = false): void {
	if (state.batchTimer) {
		clearTimeout(state.batchTimer);
		state.batchTimer = null;
	}
	if (state.metricsBuffer.length === 0) return;
	const metrics = [...state.metricsBuffer];
	state.metricsBuffer.length = 0;
	sendMetrics(metrics, unloading);
}

/** One report per page, so a batch never mixes metrics of different URLs. */
export function sendMetrics(metrics: MetricEntry[], unloading = false): void {
	if (!config.endpoint || metrics.length === 0) return;
	const byUrl = new Map<string, MetricEntry[]>();
	for (const metric of metrics) {
		byUrl.set(metric.url, [...(byUrl.get(metric.url) ?? []), metric]);
	}
	for (const [url, group] of byUrl) {
		deliver(
			{ payload: buildPayload(url, group), attempts: 0, notBefore: 0 },
			unloading,
		);
	}
}

function buildPayload(url: string, metrics: MetricEntry[]): ReportPayload {
	const payload: ReportPayload = {
		reportId: createId(),
		metrics,
		sessionId: config.finalSessionId,
		timestamp: Date.now(),
		url,
	};
	if (config.userId) payload.userId = config.userId;
	if (config.includeUserAgent) payload.userAgent = navigator.userAgent;
	return payload;
}

/** 408, 429 and 5xx are temporary; any other failed status will not improve. */
export function isRetryableStatus(status: number): boolean {
	return status === 408 || status === 429 || status >= 500;
}

function deliver(report: QueuedReport, unloading: boolean): void {
	const endpoint = config.endpoint;
	if (!endpoint) return;
	const body = JSON.stringify(report.payload);
	const hasCustomHeaders = Object.keys(config.headers).length > 0;

	if (
		unloading &&
		!hasCustomHeaders &&
		typeof navigator.sendBeacon === "function"
	) {
		// A queued beacon is not a confirmed delivery, but nothing more can be
		// learned while the page goes away. A refused beacon is kept for retry.
		const queued = navigator.sendBeacon(
			endpoint,
			new Blob([body], { type: "application/json" }),
		);
		if (!queued) reportFailed(report, "the browser refused the beacon");
		return;
	}

	fetch(endpoint, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...config.headers },
		body,
		keepalive: true,
	}).then(
		(response) => {
			if (response.ok) return;
			if (isRetryableStatus(response.status))
				reportFailed(report, `HTTP ${response.status}`);
			else
				warn(
					`Endpoint rejected the report with HTTP ${response.status}; not retried.`,
				);
		},
		(error: unknown) => reportFailed(report, error),
	);
}

function reportFailed(report: QueuedReport, reason: unknown): void {
	const attempts = report.attempts + 1;
	if (!config.retryFailedMetrics || attempts >= MAX_ATTEMPTS) {
		warn("Failed to send metrics:", reason);
		return;
	}
	queueReport({
		payload: report.payload,
		attempts,
		notBefore: Date.now() + BASE_RETRY_DELAY * 4 ** (attempts - 1),
	});
	warn(
		`Failed to send metrics (attempt ${attempts}/${MAX_ATTEMPTS}), will retry:`,
		reason,
	);
	scheduleRetry();
}

function scheduleRetry(): void {
	if (retryTimer) return;
	const due = readQueue().reduce(
		(next, report) => Math.min(next, report.notBefore),
		Number.POSITIVE_INFINITY,
	);
	if (!Number.isFinite(due)) return;
	retryTimer = setTimeout(
		() => {
			retryTimer = null;
			retryFailedMetrics();
		},
		Math.max(0, due - Date.now()),
	);
}

/** Resends stored reports that are due; called on start and by the retry timer. */
export function retryFailedMetrics(): void {
	try {
		window.localStorage.removeItem(LEGACY_FAILED_METRICS_KEY);
	} catch {
		// Storage can be unavailable in privacy-focused browser contexts.
	}
	if (!config.retryFailedMetrics || !config.endpoint || !state.active) return;
	const now = Date.now();
	const queue = readQueue();
	const due = queue.filter((report) => report.notBefore <= now);
	if (due.length === 0) {
		scheduleRetry();
		return;
	}
	writeQueue(queue.filter((report) => report.notBefore > now));
	for (const report of due) deliver(report, false);
	scheduleRetry();
}

/** Drops every stored report, e.g. when consent is withdrawn. */
export function clearFailedReports(): void {
	if (retryTimer) {
		clearTimeout(retryTimer);
		retryTimer = null;
	}
	writeQueue([]);
}

function readQueue(): QueuedReport[] {
	try {
		const stored = window.localStorage.getItem(FAILED_REPORTS_KEY);
		const parsed = stored ? (JSON.parse(stored) as unknown) : [];
		if (!Array.isArray(parsed)) return [];
		const oldest = Date.now() - MAX_REPORT_AGE;
		return (parsed as QueuedReport[]).filter(
			(report) =>
				typeof report?.payload?.reportId === "string" &&
				report.payload.timestamp >= oldest,
		);
	} catch {
		return [];
	}
}

function writeQueue(queue: QueuedReport[]): void {
	try {
		if (queue.length === 0) window.localStorage.removeItem(FAILED_REPORTS_KEY);
		else
			window.localStorage.setItem(
				FAILED_REPORTS_KEY,
				JSON.stringify(queue.slice(-MAX_QUEUED_REPORTS)),
			);
	} catch {
		// Collection must not fail because persistent storage is unavailable.
	}
}

function queueReport(report: QueuedReport): void {
	const queue = readQueue().filter(
		(entry) => entry.payload.reportId !== report.payload.reportId,
	);
	writeQueue([...queue, report]);
}

function warn(...args: unknown[]): void {
	if (config.debug) console.warn("[@casoon/astro-webvitals]", ...args);
}
