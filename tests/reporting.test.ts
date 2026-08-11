import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { config } from "../src/client/config";
import {
	DASHBOARD_STORAGE_KEY,
	readDashboardMetrics,
} from "../src/client/dashboard-storage";
import {
	flushMetrics,
	recordMetric,
	retryFailedMetrics,
} from "../src/client/reporting";
import { state } from "../src/client/state";

const failedMetricsKey = "casoon-webvitals-failed-metrics";

describe("metric reporting", () => {
	beforeEach(() => {
		state.metricsBuffer.length = 0;
		state.batchTimer = null;
		window.localStorage.clear();
		Object.assign(config, {
			endpoint: "/api/vitals",
			batchReporting: true,
			batchInterval: 5000,
			maxBatchSize: 10,
			headers: {},
			finalSessionId: "session-test",
			debug: false,
			retryFailedMetrics: false,
			dashboard: false,
		});
		Object.defineProperty(navigator, "sendBeacon", {
			configurable: true,
			value: vi.fn(() => true),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("keeps a metric id and delta in the beacon batch", () => {
		recordMetric({
			name: "CLS",
			value: 0.12,
			delta: 0.02,
			id: "v4-123",
			rating: "needs-improvement",
			navigationType: "navigate",
		});

		flushMetrics();

		expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
		expect(state.metricsBuffer).toEqual([]);
	});

	it("uses fetch when custom headers are configured", () => {
		const fetchMock = vi.fn(() => Promise.resolve(new Response()));
		vi.stubGlobal("fetch", fetchMock);
		config.headers = { "X-Request-Source": "test" };

		recordMetric({ name: "LCP", value: 1200, delta: 1200, id: "v4-456" });
		flushMetrics();

		expect(navigator.sendBeacon).not.toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/vitals",
			expect.objectContaining({
				headers: expect.objectContaining({ "X-Request-Source": "test" }),
			}),
		);
	});

	it("flushes immediately when the configured batch size is reached", () => {
		config.maxBatchSize = 1;

		recordMetric({ name: "TTFB", value: 200, delta: 200, id: "v4-000" });

		expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
		expect(state.metricsBuffer).toEqual([]);
	});

	it("persists failed fetch reports only when retry is enabled", async () => {
		vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
		config.headers = { "X-Request-Source": "test" };
		config.retryFailedMetrics = true;

		recordMetric({ name: "INP", value: 220, delta: 220, id: "v4-789" });
		flushMetrics();
		await vi.waitFor(() =>
			expect(window.localStorage.getItem(failedMetricsKey)).toContain("v4-789"),
		);

		retryFailedMetrics();
		expect(window.localStorage.getItem(failedMetricsKey)).toBeNull();
	});

	it("stores dashboard metrics locally without requiring an endpoint", () => {
		config.endpoint = undefined;
		config.dashboard = true;

		recordMetric({ name: "LCP", value: 1300, delta: 1300, id: "v4-local" });

		expect(readDashboardMetrics()).toEqual([
			expect.objectContaining({ name: "LCP", id: "v4-local", url: window.location.href }),
		]);
		expect(window.localStorage.getItem(DASHBOARD_STORAGE_KEY)).toContain("v4-local");
	});
});
