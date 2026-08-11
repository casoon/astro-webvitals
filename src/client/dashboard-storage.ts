import type { MetricEntry } from "./state";

export const DASHBOARD_STORAGE_KEY = "casoon-webvitals-dashboard-metrics";
const MAX_STORED_METRICS = 200;

export interface StoredMetric extends MetricEntry {
	url: string;
}

export function persistDashboardMetric(metric: MetricEntry): void {
	try {
		const stored = readDashboardMetrics();
		stored.push({ ...metric, url: window.location.href });
		window.localStorage.setItem(
			DASHBOARD_STORAGE_KEY,
			JSON.stringify(stored.slice(-MAX_STORED_METRICS)),
		);
	} catch {
		// The local dashboard is optional and must not affect measurement.
	}
}

export function readDashboardMetrics(): StoredMetric[] {
	try {
		const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as StoredMetric[]) : [];
	} catch {
		return [];
	}
}

export function clearDashboardMetrics(): void {
	try {
		window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
	} catch {
		// Storage can be unavailable in privacy-focused browser contexts.
	}
}
