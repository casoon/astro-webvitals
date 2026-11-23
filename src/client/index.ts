/**
 * @casoon/astro-webvitals - client entry point and lifecycle.
 *
 * One instance runs per document:
 * - `initWebVitals()` runs once from the component's module script. It always
 *   listens for consent changes and Astro ClientRouter navigations, and starts
 *   collection only when consent is given and DNT/GPC (if respected) allow it.
 * - `onNavigation()` applies the config rendered on the new page after a
 *   ClientRouter swap, re-checks consent and re-attaches the debug tools.
 * - `updateConsent()` pauses or resumes collection at runtime
 *   (see `setWebVitalsConsent()` in ./consent.ts).
 */

import { readBridgedConfig } from "./bridge";
import { type BridgedConfig, config, initConfig } from "./config";
import { CONSENT_EVENT, type ConsentEventDetail } from "./consent";
import {
	measureDNS,
	measureDOM,
	measureLOAD,
	measureTCP,
} from "./metrics/navigation";
import { measureWebVitals } from "./metrics/vitals";
import { capturePageAudit } from "./page-audit";
import {
	clearFailedReports,
	createId,
	flushMetrics,
	retryFailedMetrics,
} from "./reporting";
import { continueSitemapPass, isSitemapPassActive } from "./sitemap-pass";
import { state } from "./state";

/** Tells the lazily loaded debug tools what changed (see initDebugFeatures). */
export const LIFECYCLE_EVENT = "webvitals:lifecycle";
export type LifecyclePhase = "navigation" | "paused" | "resumed";

declare global {
	interface Window {
		__CASOON_WEBVITALS_INITIALIZED__?: boolean;
	}
	interface Navigator {
		globalPrivacyControl?: boolean;
	}
}

let sampledOut: boolean | undefined;
let debugFeaturesLoaded = false;

export function initWebVitals(bridgedConfig: BridgedConfig): void {
	if (window.__CASOON_WEBVITALS_INITIALIZED__) return;
	window.__CASOON_WEBVITALS_INITIALIZED__ = true;

	initConfig(bridgedConfig);
	// A consent call made before this script ran is honoured.
	state.consentOverride = window.__WEBVITALS_CONSENT__;
	state.documentUrl = window.location.href;
	state.pageLoadId = createId();

	window.addEventListener(CONSENT_EVENT, (event) => {
		updateConsent((event as CustomEvent<ConsentEventDetail>).detail.granted);
	});
	// Flush before the page changes, so the batch is sent with this page still open.
	document.addEventListener("astro:before-swap", () => flushMetrics());
	document.addEventListener("astro:after-swap", () => {
		const next = readBridgedConfig();
		if (next) window.__WEBVITALS_CONFIG__ = next;
		onNavigation(next);
	});

	if (mayCollect()) start();
}

function hasConsent(): boolean {
	return state.consentOverride ?? config.consent;
}

function privacySignalSet(): boolean {
	return (
		config.respectDnt &&
		(navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true)
	);
}

function mayCollect(): boolean {
	if (!hasConsent() || privacySignalSet()) return false;
	// Sampling is decided once per full page load (client-side), so static
	// builds don't bake a single build-time coin flip into every visitor's HTML.
	// An explicit, browser-local sitemap pass must not be lost to sampling.
	sampledOut ??= !isSitemapPassActive() && Math.random() >= config.sampleRate;
	return !sampledOut;
}

function start(): void {
	if (state.started) {
		resume();
		return;
	}
	state.started = true;
	state.active = true;

	retryFailedMetrics();
	if (config.dashboard) afterLoad(capturePageAudit);

	// Navigation timing metrics (available immediately)
	measureDNS();
	measureTCP();
	measureDOM();
	afterLoad(measureLOAD);

	void measureWebVitals();
	if (config.trackLongTasks) {
		void import("./metrics/long-tasks").then(({ measureLongTasks }) =>
			measureLongTasks(),
		);
	}

	const flushOnHidden = () => {
		if (document.visibilityState === "hidden") flushMetrics(true);
	};
	document.addEventListener("visibilitychange", flushOnHidden, {
		capture: true,
	});
	window.addEventListener("pagehide", () => flushMetrics(true), {
		capture: true,
	});

	continueSitemapPass();
	loadDebugFeaturesIfEnabled();
}

function resume(): void {
	if (state.active) return;
	state.active = true;
	retryFailedMetrics();
	notify("resumed");
	loadDebugFeaturesIfEnabled();
}

/**
 * Stops recording and sending. Web Vitals observers cannot be unregistered,
 * but everything they report is dropped while paused; buffered metrics and
 * reports stored for retry are deleted.
 */
function pause(): void {
	if (!state.active) return;
	state.active = false;
	state.metricsBuffer.length = 0;
	if (state.batchTimer) {
		clearTimeout(state.batchTimer);
		state.batchTimer = null;
	}
	clearFailedReports();
	notify("paused");
}

/** Grant (`true`) or withdraw (`false`) consent at runtime. */
export function updateConsent(granted: boolean): void {
	state.consentOverride = granted;
	if (mayCollect()) start();
	else pause();
}

/** Applies the config of the page Astro's ClientRouter just swapped in. */
export function onNavigation(next: BridgedConfig | undefined): void {
	if (next) {
		const { finalSessionId } = config;
		initConfig({ ...next, sessionId: next.sessionId ?? finalSessionId });
	}
	if (!mayCollect()) {
		pause();
		return;
	}
	if (!state.started) {
		start();
		return;
	}
	resume();
	if (config.dashboard) capturePageAudit();
	notify("navigation");
	loadDebugFeaturesIfEnabled();
}

function notify(phase: LifecyclePhase): void {
	window.dispatchEvent(new CustomEvent(LIFECYCLE_EVENT, { detail: phase }));
}

function afterLoad(callback: () => void): void {
	if (document.readyState === "complete") callback();
	else window.addEventListener("load", callback, { once: true });
}

function loadDebugFeaturesIfEnabled(): void {
	if (debugFeaturesLoaded) return;
	if (!(config.debug || config.consoleDock || config.checkAccessibility))
		return;
	debugFeaturesLoaded = true;
	void initDebugFeatures();
}

// The overlay, console tools, accessibility heuristic and SEO inspection are
// loaded only here. Modules imported statically by this entry must not import
// them (tests/entry-graph.test.ts guards this), or they end up in every page's
// entry chunk again.
async function initDebugFeatures(): Promise<void> {
	const [
		{ checkWCAG, clearAccessibilityHighlights },
		{ initConsoleCapture },
		{ refreshSEO },
		{ initConsoleDock },
		{ initDebugOverlay, preserveContentScroll, updateDebugOverlay },
		{ initResponsive },
	] = await Promise.all([
		import("./accessibility"),
		import("./console-capture"),
		import("./seo"),
		import("./ui/console-dock"),
		import("./ui/debug-overlay"),
		import("./ui/responsive"),
	]);

	state.refreshDebugOverlay = updateDebugOverlay;
	state.highlightEnabled = !!config.highlightAccessibility;
	initResponsive();
	initConsoleCapture();
	initDebugOverlay();
	initConsoleDock();
	window.addEventListener("webvitals:metric", updateDebugOverlay);

	const runAccessibility = () => {
		if (config.checkAccessibility && state.active)
			preserveContentScroll(checkWCAG);
	};
	const runSEO = () => {
		if (config.debug && state.active) refreshSEO();
	};
	afterLoad(() => setTimeout(runAccessibility, 1000));
	afterLoad(() => setTimeout(runSEO, 600));

	// ClientRouter swaps <body>, which detaches the overlay and the dock.
	const attachTools = () => {
		for (const element of [state.debugContainer, state.consoleDockEl]) {
			if (element && !document.body.contains(element))
				document.body.appendChild(element);
		}
	};
	window.addEventListener(LIFECYCLE_EVENT, (event) => {
		const phase = (event as CustomEvent<LifecyclePhase>).detail;
		if (phase === "paused") {
			clearAccessibilityHighlights();
			state.debugContainer?.remove();
			state.consoleDockEl?.remove();
			return;
		}
		attachTools();
		updateDebugOverlay();
		if (phase === "navigation") {
			state.wcagIssues.length = 0;
			setTimeout(runAccessibility, 300);
			setTimeout(runSEO, 300);
		}
	});

	if (config.debug) {
		setInterval(() => {
			if (!state.active) return;
			if (state.isExpanded && state.activeTab === "accessibility")
				runAccessibility();
			if (state.activeTab === "seo") runSEO();
		}, 5000);
	}
}
