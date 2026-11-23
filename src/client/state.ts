/**
 * Shared mutable state for the WebVitals client runtime.
 *
 * Anything that is read/written across more than one module lives here.
 * Values that are local to a single function (e.g. CLS session-window
 * arrays, INP's interaction map) stay local to that function.
 */

export interface ConsoleEntry {
	type: string;
	message: string;
	timestamp: string;
}

export interface WcagIssue {
	type: string;
	element: string;
	elementRef: Element | null;
	message: string;
	wcagLevel: string;
}

export interface MetricEntry {
	name: string;
	value: number;
	delta: number;
	id: string;
	rating?: "good" | "needs-improvement" | "poor";
	navigationType?: string;
	attribution?: MetricAttribution;
	/** Page the metric belongs to (origin + path unless `fullUrl`). */
	url: string;
	timestamp: number;
}

export interface MetricAttribution {
	target?: string;
	url?: string;
	largestShiftTime?: number;
	largestShiftValue?: number;
	interactionType?: string;
}

export interface SeoImage {
	idx: number;
	src: string;
	alt: string;
	width: string | null;
	height: string | null;
	naturalWidth: number;
	naturalHeight: number;
}

export interface SeoHeading {
	tag: string;
	text: string;
	empty: boolean;
}

export interface SeoLdResult {
	index: number;
	raw: string;
	parsed: any;
	error: string | null;
	warnings: string[];
}

export interface SeoInfo {
	analyzedAt: string;
	title: string;
	metaDescription: string;
	canonical: string;
	robotsMeta: string;
	viewport: string;
	lang: string;
	dir: string;
	h1Count: number;
	emptyHeadings: SeoHeading[];
	headings: SeoHeading[];
	ldResults: SeoLdResult[];
	og: {
		title: string;
		description: string;
		image: string;
		url: string;
		type: string;
	};
	twitter: { card: string; title: string; description: string; image: string };
	images: SeoImage[];
	missingAlt: SeoImage[];
	missingDimensions: SeoImage[];
	heroMissingDimensions: boolean;
	hasNoindex: boolean;
	xRobots: string | null;
	indexable: boolean;
}

export interface WebVitalsState {
	/** Collection has started once in this document (listeners registered). */
	started: boolean;
	/** Metrics are recorded and sent; false while consent is missing or withdrawn. */
	active: boolean;
	/** Consent set at runtime with setWebVitalsConsent(); wins over the prop. */
	consentOverride: boolean | undefined;
	/** URL of the full page load; metrics without their own URL belong to it. */
	documentUrl: string;
	/** Identifies this full page load in navigation timing metric ids. */
	pageLoadId: string;
	vitals: Record<string, number>;
	wcagIssues: WcagIssue[];
	metricsBuffer: MetricEntry[];
	debugContainer: HTMLElement | null;
	batchTimer: ReturnType<typeof setTimeout> | null;
	isExpanded: boolean;
	activeTab: string;
	isMobile: boolean;
	consoleErrors: ConsoleEntry[];
	consoleDockEnabled: boolean;
	consoleDockHeight: number;
	consoleDockEl: HTMLElement | null;
	consoleDockLogEl: HTMLElement | null;
	highlightedNodes: Set<Element>;
	highlightEnabled: boolean;
	seoInfo: SeoInfo | null;
	lcpUnsupported: boolean;
	expandedIssues: Set<string>;
	/**
	 * Re-renders the debug overlay. Registered by the lazily loaded debug
	 * features, so always-loaded modules can refresh the overlay without
	 * statically importing it (which would pull it into the entry chunk).
	 */
	refreshDebugOverlay: (() => void) | null;
}

export const state: WebVitalsState = {
	started: false,
	active: false,
	consentOverride: undefined,
	documentUrl: typeof window !== "undefined" ? window.location.href : "",
	pageLoadId: "",
	vitals: {},
	wcagIssues: [],
	metricsBuffer: [],
	debugContainer: null,
	batchTimer: null,
	isExpanded: false,
	activeTab: "vitals", // vitals, seo, accessibility, details, console
	isMobile: typeof window !== "undefined" && window.innerWidth < 700,
	consoleErrors: [],
	consoleDockEnabled: false,
	consoleDockHeight: 160,
	consoleDockEl: null,
	consoleDockLogEl: null,
	highlightedNodes: new Set(),
	highlightEnabled: false,
	seoInfo: null,
	lcpUnsupported: false,
	expandedIssues: new Set(),
	refreshDebugOverlay: null,
};
