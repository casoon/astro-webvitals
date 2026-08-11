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
	timestamp: number;
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
}

export const state: WebVitalsState = {
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
};
