import type { MetricEntry } from "./state";

export const DASHBOARD_STORAGE_KEY = "casoon-webvitals-dashboard-metrics";
export const DASHBOARD_PAGE_AUDITS_STORAGE_KEY =
	"casoon-webvitals-dashboard-page-audits";
const MAX_STORED_METRICS = 200;
const MAX_STORED_PAGE_AUDITS = 100;

export interface StoredMetric extends MetricEntry {
	url: string;
}

export interface PageAuditCheck {
	name: string;
	state: "pass" | "issue" | "info";
	detail: string;
}

export interface StoredPageAudit {
	url: string;
	timestamp: number;
	metadata: {
		title: string;
		description: string;
		canonical: string;
		lang: string;
		robots: string;
	};
	checks: PageAuditCheck[];
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

export function persistDashboardPageAudit(audit: StoredPageAudit): void {
	try {
		const stored = readDashboardPageAudits().filter(
			(entry) => entry.url !== audit.url,
		);
		stored.push(audit);
		window.localStorage.setItem(
			DASHBOARD_PAGE_AUDITS_STORAGE_KEY,
			JSON.stringify(stored.slice(-MAX_STORED_PAGE_AUDITS)),
		);
	} catch {
		// The local dashboard is optional and must not affect measurement.
	}
}

export function readDashboardPageAudits(): StoredPageAudit[] {
	try {
		const raw = window.localStorage.getItem(DASHBOARD_PAGE_AUDITS_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as StoredPageAudit[]) : [];
	} catch {
		return [];
	}
}

export function clearDashboardMetrics(): void {
	try {
		window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
		window.localStorage.removeItem(DASHBOARD_PAGE_AUDITS_STORAGE_KEY);
	} catch {
		// Storage can be unavailable in privacy-focused browser contexts.
	}
}
