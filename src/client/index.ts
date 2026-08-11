/**
 * @casoon/astro-webvitals - client entry point.
 *
 * Wires up console capture, the debug overlay, the console dock, all Core
 * Web Vitals measurements, accessibility checking, SEO analysis, and batch
 * metrics reporting, in the same order the original inline IIFE did.
 */

import { type BridgedConfig, config, initConfig } from "./config";
import {
	measureDNS,
	measureDOM,
	measureLOAD,
	measureTCP,
} from "./metrics/navigation";
import { measureWebVitals } from "./metrics/vitals";
import { flushMetrics, retryFailedMetrics } from "./reporting";
import { continueSitemapPass, isSitemapPassActive } from "./sitemap-pass";

declare global {
	interface Window {
		__CASOON_WEBVITALS_INITIALIZED__?: boolean;
	}
}

export function initWebVitals(bridgedConfig: BridgedConfig): void {
	if (!bridgedConfig.consent) return;
	if (bridgedConfig.respectDnt && navigator.doNotTrack === "1") return;
	// Sampling is decided per page load (client-side) so static builds don't
	// bake a single build-time coin flip into every visitor's HTML.
	// An explicit, browser-local sitemap pass must not be lost to normal
	// production sampling. Consent and DNT gates above still always apply.
	if (!isSitemapPassActive() && Math.random() >= bridgedConfig.sampleRate)
		return;
	if (window.__CASOON_WEBVITALS_INITIALIZED__) return;
	window.__CASOON_WEBVITALS_INITIALIZED__ = true;

	initConfig(bridgedConfig);
	retryFailedMetrics();

	// Navigation timing metrics (available immediately)
	measureDNS();
	measureTCP();
	measureDOM();

	void measureWebVitals();
	if (config.trackLongTasks) {
		void import("./metrics/long-tasks").then(({ measureLongTasks }) =>
			measureLongTasks(),
		);
	}

	// Load complete (might take a while)
	if (document.readyState === "complete") {
		measureLOAD();
	} else {
		window.addEventListener("load", () => {
			measureLOAD();
		});
	}

	const flushOnHidden = () => {
		if (document.visibilityState === "hidden") flushMetrics();
	};
	document.addEventListener("visibilitychange", flushOnHidden, {
		capture: true,
	});
	window.addEventListener("pagehide", flushMetrics, { capture: true });

	continueSitemapPass();

	if (config.debug || config.consoleDock || config.checkAccessibility) {
		void initDebugFeatures();
	}
}

async function initDebugFeatures(): Promise<void> {
	const [
		{ checkWCAG },
		{ initConsoleCapture },
		{ refreshSEO },
		{ state },
		{ initConsoleDock },
		{ initDebugOverlay, preserveContentScroll, updateDebugOverlay },
		{ initResponsive },
	] = await Promise.all([
		import("./accessibility"),
		import("./console-capture"),
		import("./seo"),
		import("./state"),
		import("./ui/console-dock"),
		import("./ui/debug-overlay"),
		import("./ui/responsive"),
	]);

	state.highlightEnabled = !!config.highlightAccessibility;
	initResponsive();
	initConsoleCapture();
	initDebugOverlay();
	initConsoleDock();
	window.addEventListener("webvitals:metric", updateDebugOverlay);

	if (config.checkAccessibility) {
		const runAccessibility = () => preserveContentScroll(checkWCAG);
		if (document.readyState === "complete") setTimeout(runAccessibility, 1000);
		else
			window.addEventListener("load", () => setTimeout(runAccessibility, 1000));
	}

	if (config.debug) {
		const runSEO = () => refreshSEO();
		if (document.readyState === "complete") setTimeout(runSEO, 600);
		else window.addEventListener("load", () => setTimeout(runSEO, 600));

		setInterval(() => {
			if (
				config.checkAccessibility &&
				state.isExpanded &&
				state.activeTab === "accessibility"
			) {
				preserveContentScroll(checkWCAG);
			}
			if (state.activeTab === "seo") refreshSEO();
		}, 5000);
	}
}
