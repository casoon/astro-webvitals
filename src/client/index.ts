/**
 * @casoon/astro-webvitals - client entry point.
 *
 * Wires up console capture, the debug overlay, the console dock, all Core
 * Web Vitals measurements, accessibility checking, SEO analysis, and batch
 * metrics reporting, in the same order the original inline IIFE did.
 */

import { checkWCAG } from "./accessibility";
import { type BridgedConfig, config, initConfig } from "./config";
import { initConsoleCapture } from "./console-capture";
import { measureCLS } from "./metrics/cls";
import { measureFCP } from "./metrics/fcp";
import { measureFID } from "./metrics/fid";
import { measureINP } from "./metrics/inp";
import { measureLCP } from "./metrics/lcp";
import {
	measureDNS,
	measureDOM,
	measureLOAD,
	measureTCP,
} from "./metrics/navigation";
import { measureTTFB } from "./metrics/ttfb";
import { flushMetrics } from "./reporting";
import { refreshSEO } from "./seo";
import { state } from "./state";
import { initConsoleDock } from "./ui/console-dock";
import { initDebugOverlay, preserveContentScroll } from "./ui/debug-overlay";
import { initResponsive } from "./ui/responsive";

export function initWebVitals(bridgedConfig: BridgedConfig): void {
	// Sampling is decided per page load (client-side) so static builds don't
	// bake a single build-time coin flip into every visitor's HTML.
	if (Math.random() >= bridgedConfig.sampleRate) return;

	initConfig(bridgedConfig);
	state.highlightEnabled = !!config.highlightAccessibility;

	initResponsive();
	initConsoleCapture();
	initDebugOverlay();
	initConsoleDock();

	// Navigation timing metrics (available immediately)
	measureDNS();
	measureTCP();
	measureTTFB();
	measureDOM();

	// Paint metrics
	measureFCP();
	measureLCP();

	// Interaction metrics
	measureFID();
	measureINP();
	measureCLS();

	// Load complete (might take a while)
	if (document.readyState === "complete") {
		measureLOAD();
	} else {
		window.addEventListener("load", () => {
			measureLOAD();
		});
	}

	// Check accessibility after DOM is ready
	if (config.checkAccessibility) {
		if (document.readyState === "complete") {
			setTimeout(() => preserveContentScroll(checkWCAG), 1000);
		} else {
			window.addEventListener("load", () =>
				setTimeout(() => preserveContentScroll(checkWCAG), 1000),
			);
		}
	}

	// SEO analysis
	const runSEO = () => refreshSEO();
	if (document.readyState === "complete") {
		setTimeout(runSEO, 600);
	} else {
		window.addEventListener("load", () => setTimeout(runSEO, 600));
	}

	// Flush on page unload
	window.addEventListener("beforeunload", flushMetrics);

	// Periodic refresh without breaking scroll: only update lightweight data
	setInterval(() => {
		if (
			config.checkAccessibility &&
			state.isExpanded &&
			state.activeTab === "accessibility"
		) {
			preserveContentScroll(checkWCAG);
		}
		if (state.activeTab === "seo") {
			refreshSEO();
		}
	}, 5000);
}
