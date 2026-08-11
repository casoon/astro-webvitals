/**
 * Browser/rendering-engine detection and Performance API feature support.
 */

export interface BrowserInfo {
	engine: string;
	isChromium: boolean;
	isFirefox: boolean;
	isSafari: boolean;
	supported: {
		LCP: boolean;
		FID: boolean;
		CLS: boolean;
		FCP: boolean;
		INP: boolean;
	};
}

function computeBrowserInfo(): BrowserInfo {
	const ua = navigator.userAgent;
	const isChromium = !!(window as any).chrome;
	const isFirefox = ua.includes("Firefox");
	const isSafari = ua.includes("Safari") && !ua.includes("Chrome");
	const isEdge = ua.includes("Edg/");
	let engine = "unknown";
	if (isChromium || isEdge) engine = "chromium";
	else if (isFirefox) engine = "gecko";
	else if (isSafari) engine = "webkit";
	const supported = {
		LCP:
			PerformanceObserver.supportedEntryTypes?.includes(
				"largest-contentful-paint",
			) || false,
		FID:
			PerformanceObserver.supportedEntryTypes?.includes("first-input") || false,
		CLS:
			PerformanceObserver.supportedEntryTypes?.includes("layout-shift") ||
			false,
		FCP: PerformanceObserver.supportedEntryTypes?.includes("paint") || false,
		INP: PerformanceObserver.supportedEntryTypes?.includes("event") || false,
	};
	return { engine, isChromium, isFirefox, isSafari, supported };
}

export const browserInfo: BrowserInfo = computeBrowserInfo();
