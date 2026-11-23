import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { BridgedConfig } from "../src/client/config";
import { config } from "../src/client/config";
import { setWebVitalsConsent } from "../src/client/consent";
import { onNavigation } from "../src/client/index";
import { FAILED_REPORTS_KEY } from "../src/client/reporting";
import { state } from "../src/client/state";

vi.mock("../src/client/metrics/vitals", () => ({
	measureWebVitals: vi.fn(() => Promise.resolve()),
}));

const baseConfig: BridgedConfig = {
	debug: false,
	consoleDock: false,
	endpoint: "/api/vitals",
	position: "bottom-right",
	desktopPositions: {},
	mobilePosition: "",
	batchReporting: true,
	batchInterval: 5000,
	checkAccessibility: false,
	highlightAccessibility: false,
	extendedMetrics: false,
	smartDetection: false,
	performanceBudget: { LCP: 2500, CLS: 0.1, FCP: 1800, TTFB: 800, INP: 200 },
	headers: {},
	sampleRate: 1,
	trackSoftNavigations: false,
	attribution: false,
	trackLongTasks: false,
	maxBatchSize: 10,
	retryFailedMetrics: true,
	respectDnt: false,
	consent: false,
	dashboard: false,
	fullUrl: false,
	includeUserAgent: false,
};

function renderConfig(overrides: Partial<BridgedConfig> = {}): void {
	document.body.innerHTML = `<script type="application/json" data-astro-webvitals-config>${JSON.stringify(
		{ ...baseConfig, ...overrides },
	)}</script>`;
}

// One document, one instance: the tests below run in order against it.
describe("lifecycle", () => {
	beforeAll(async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
		);
		const { initWebVitals } = await import("../src/client/index");
		initWebVitals({ ...baseConfig });
	});

	beforeEach(() => {
		window.localStorage.clear();
	});

	it("does not collect without consent", () => {
		expect(state.started).toBe(false);
		expect(state.active).toBe(false);
	});

	it("starts once consent is granted at runtime", () => {
		setWebVitalsConsent(true);
		expect(state.started).toBe(true);
		expect(state.active).toBe(true);
	});

	it("keeps runtime consent when the next page renders consent={false}", () => {
		renderConfig({ consent: false, batchInterval: 1234 });
		document.dispatchEvent(new Event("astro:after-swap"));

		expect(config.batchInterval).toBe(1234);
		expect(state.active).toBe(true);
	});

	it("keeps the session across ClientRouter navigations", () => {
		const session = config.finalSessionId;
		renderConfig({ consent: true });
		document.dispatchEvent(new Event("astro:after-swap"));
		expect(config.finalSessionId).toBe(session);
	});

	it("pauses and deletes buffered and queued reports when consent is withdrawn", () => {
		state.metricsBuffer.push({
			name: "LCP",
			value: 1,
			delta: 1,
			id: "x",
			url: "https://example.com/",
			timestamp: 0,
		});
		window.localStorage.setItem(FAILED_REPORTS_KEY, "[]");

		setWebVitalsConsent(false);

		expect(state.active).toBe(false);
		expect(state.metricsBuffer).toEqual([]);
		expect(window.localStorage.getItem(FAILED_REPORTS_KEY)).toBeNull();
	});

	it("stays paused when Do Not Track or GPC is respected", () => {
		Object.defineProperty(navigator, "globalPrivacyControl", {
			configurable: true,
			value: true,
		});
		setWebVitalsConsent(true);
		onNavigation({ ...baseConfig, consent: true, respectDnt: true });
		expect(state.active).toBe(false);

		onNavigation({ ...baseConfig, consent: true, respectDnt: false });
		expect(state.active).toBe(true);
	});
});
