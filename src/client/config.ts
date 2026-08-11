/**
 * Resolved runtime configuration for the WebVitals client.
 *
 * Populated once at init from the config object bridged over from Astro's
 * frontmatter via `window.__WEBVITALS_CONFIG__` (see WebVitals.astro).
 */

export interface PerformanceBudget {
	LCP?: number;
	FID?: number;
	CLS?: number;
	FCP?: number;
	TTFB?: number;
	INP?: number;
}

export interface BridgedConfig {
	debug: boolean;
	consoleDock: boolean;
	endpoint?: string;
	position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
	desktopPositions: Record<string, string>;
	mobilePosition: string;
	batchReporting: boolean;
	batchInterval: number;
	checkAccessibility: boolean;
	highlightAccessibility: boolean;
	extendedMetrics: boolean;
	smartDetection: boolean;
	performanceBudget: Required<PerformanceBudget>;
	headers: Record<string, string>;
	sessionId?: string;
	userId?: string;
	sampleRate: number;
}

export interface WebVitalsConfig extends BridgedConfig {
	finalSessionId: string;
}

export const config: WebVitalsConfig = {} as WebVitalsConfig;

export function initConfig(bridged: BridgedConfig): void {
	Object.assign(config, bridged);
	config.finalSessionId =
		bridged.sessionId ||
		`session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
