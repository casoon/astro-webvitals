import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { config } from "../src/client/config";
import {
	DASHBOARD_STORAGE_KEY,
	readDashboardMetrics,
} from "../src/client/dashboard-storage";
import {
	FAILED_REPORTS_KEY,
	flushMetrics,
	type ReportPayload,
	recordMetric,
	reportUrl,
	retryFailedMetrics,
} from "../src/client/reporting";
import { state } from "../src/client/state";

function sentPayloads(fetchMock: ReturnType<typeof vi.fn>): ReportPayload[] {
	return fetchMock.mock.calls.map(
		([, init]) => JSON.parse((init as RequestInit).body as string) as ReportPayload,
	);
}

function queuedReports(): { payload: ReportPayload; attempts: number; notBefore: number }[] {
	return JSON.parse(window.localStorage.getItem(FAILED_REPORTS_KEY) ?? "[]");
}

describe("metric reporting", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		state.metricsBuffer.length = 0;
		state.batchTimer = null;
		state.active = true;
		state.documentUrl = "https://example.com/products/shoes?q=secret#reviews";
		window.localStorage.clear();
		Object.assign(config, {
			endpoint: "/api/vitals",
			batchReporting: true,
			batchInterval: 5000,
			maxBatchSize: 10,
			headers: {},
			finalSessionId: "session-test",
			userId: undefined,
			debug: false,
			retryFailedMetrics: false,
			dashboard: false,
			fullUrl: false,
			includeUserAgent: false,
		});
		fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
		vi.stubGlobal("fetch", fetchMock);
		Object.defineProperty(navigator, "sendBeacon", {
			configurable: true,
			value: vi.fn(() => true),
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("sends origin and path only, without user agent, by default", () => {
		recordMetric({ name: "LCP", value: 1200, delta: 1200, id: "v6-1" });
		flushMetrics();

		const [payload] = sentPayloads(fetchMock);
		expect(payload.url).toBe("https://example.com/products/shoes");
		expect(payload.metrics[0].url).toBe("https://example.com/products/shoes");
		expect(payload).not.toHaveProperty("userAgent");
		expect(payload).not.toHaveProperty("userId");
		expect(payload.reportId).toEqual(expect.any(String));
	});

	it("keeps query, fragment and user agent when opted in", () => {
		config.fullUrl = true;
		config.includeUserAgent = true;

		recordMetric({ name: "LCP", value: 1200, delta: 1200, id: "v6-1" });
		flushMetrics();

		const [payload] = sentPayloads(fetchMock);
		expect(payload.url).toBe(state.documentUrl);
		expect(payload.userAgent).toBe(navigator.userAgent);
	});

	it("strips the query from any URL in path mode", () => {
		expect(reportUrl("https://cdn.example.com/hero.jpg?token=abc")).toBe(
			"https://cdn.example.com/hero.jpg",
		);
	});

	it("uses sendBeacon only when the page is being unloaded", () => {
		recordMetric({ name: "CLS", value: 0.12, delta: 0.02, id: "v6-2" });
		flushMetrics(true);

		expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(state.metricsBuffer).toEqual([]);
	});

	it("uses fetch on unload when custom headers are configured", () => {
		config.headers = { "X-Request-Source": "test" };

		recordMetric({ name: "LCP", value: 1200, delta: 1200, id: "v6-3" });
		flushMetrics(true);

		expect(navigator.sendBeacon).not.toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/vitals",
			expect.objectContaining({
				keepalive: true,
				headers: expect.objectContaining({ "X-Request-Source": "test" }),
			}),
		);
	});

	it("flushes immediately when the configured batch size is reached", () => {
		config.maxBatchSize = 1;

		recordMetric({ name: "TTFB", value: 200, delta: 200, id: "v6-4" });

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(state.metricsBuffer).toEqual([]);
	});

	it("sends one report per page when a batch spans several URLs", () => {
		recordMetric({ name: "LCP", value: 1200, delta: 1200, id: "a" });
		recordMetric({
			name: "LCP",
			value: 900,
			delta: 900,
			id: "b",
			url: "https://example.com/about",
		});
		flushMetrics();

		expect(sentPayloads(fetchMock).map((payload) => payload.url)).toEqual([
			"https://example.com/products/shoes",
			"https://example.com/about",
		]);
	});

	it("records nothing while collection is paused", () => {
		state.active = false;
		config.dashboard = true;

		recordMetric({ name: "LCP", value: 1200, delta: 1200, id: "v6-5" });
		flushMetrics();

		expect(fetchMock).not.toHaveBeenCalled();
		expect(readDashboardMetrics()).toEqual([]);
	});

	it("treats HTTP 5xx and 429 as failures and keeps the full report for retry", async () => {
		config.retryFailedMetrics = true;
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

		recordMetric({ name: "INP", value: 220, delta: 220, id: "v6-6" });
		flushMetrics();
		await vi.waitFor(() => expect(queuedReports()).toHaveLength(1));

		const [queued] = queuedReports();
		const [original] = sentPayloads(fetchMock);
		expect(queued.payload).toEqual(original);
		expect(queued.attempts).toBe(1);
		expect(queued.notBefore).toBeGreaterThan(Date.now());
	});

	it("does not retry reports the endpoint rejected with a client error", async () => {
		config.retryFailedMetrics = true;
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 400 }));

		recordMetric({ name: "INP", value: 220, delta: 220, id: "v6-7" });
		flushMetrics();
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		await Promise.resolve();

		expect(queuedReports()).toEqual([]);
	});

	it("retries the stored report unchanged, even from another page", async () => {
		config.retryFailedMetrics = true;
		fetchMock.mockRejectedValueOnce(new Error("offline"));

		recordMetric({ name: "INP", value: 220, delta: 220, id: "v6-8" });
		flushMetrics();
		await vi.waitFor(() => expect(queuedReports()).toHaveLength(1));
		const [first] = sentPayloads(fetchMock);

		// A later visit to a different page with a different session.
		state.documentUrl = "https://example.com/checkout";
		config.finalSessionId = "session-later";
		vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60_000);
		retryFailedMetrics();

		const retried = sentPayloads(fetchMock)[1];
		expect(retried).toEqual(first);
		expect(retried.url).toBe("https://example.com/products/shoes");
		expect(retried.sessionId).toBe("session-test");
		await vi.waitFor(() => expect(queuedReports()).toEqual([]));
	});

	it("gives up after the maximum number of attempts", async () => {
		config.retryFailedMetrics = true;
		fetchMock.mockRejectedValue(new Error("offline"));
		let now = Date.now();
		vi.spyOn(Date, "now").mockImplementation(() => now);

		recordMetric({ name: "INP", value: 220, delta: 220, id: "v6-9" });
		flushMetrics();
		await vi.waitFor(() => expect(queuedReports()[0]?.attempts).toBe(1));

		now += 10 * 60_000;
		retryFailedMetrics();
		await vi.waitFor(() => expect(queuedReports()[0]?.attempts).toBe(2));

		now += 10 * 60_000;
		retryFailedMetrics();
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
		await Promise.resolve();
		expect(queuedReports()).toEqual([]);
	});

	it("does not store failed reports unless retry is enabled", async () => {
		fetchMock.mockRejectedValueOnce(new Error("offline"));

		recordMetric({ name: "INP", value: 220, delta: 220, id: "v6-10" });
		flushMetrics();
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		await Promise.resolve();

		expect(window.localStorage.getItem(FAILED_REPORTS_KEY)).toBeNull();
	});

	it("stores dashboard metrics locally without requiring an endpoint", () => {
		config.endpoint = undefined;
		config.dashboard = true;

		recordMetric({ name: "LCP", value: 1300, delta: 1300, id: "v6-local" });

		expect(readDashboardMetrics()).toEqual([
			expect.objectContaining({
				name: "LCP",
				id: "v6-local",
				url: "https://example.com/products/shoes",
			}),
		]);
		expect(window.localStorage.getItem(DASHBOARD_STORAGE_KEY)).toContain("v6-local");
	});
});
