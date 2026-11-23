import {
	type PageAuditCheck,
	persistDashboardPageAudit,
	type StoredPageAudit,
} from "./dashboard-storage";

function metaContent(selector: string): string {
	return (
		document.head.querySelector(selector)?.getAttribute("content")?.trim() ?? ""
	);
}

/**
 * `issue` is a defect a browser or assistive technology runs into;
 * `advice` is a recommendation whose absence can be intentional.
 */
function check(
	name: string,
	passes: boolean,
	passDetail: string,
	failDetail: string,
	failState: "issue" | "advice" = "issue",
): PageAuditCheck {
	return {
		name,
		state: passes ? "pass" : failState,
		detail: passes ? passDetail : failDetail,
	};
}

const MAIN_SELECTOR = "main, [role='main']";

/**
 * A skip link is any same-page link whose target is, contains or sits inside
 * the main landmark — `#main`, `#content` or any other id. Without a main
 * landmark there is nothing to verify it against.
 */
function skipLinkCheck(): PageAuditCheck {
	if (!document.querySelector(MAIN_SELECTOR)) {
		return {
			name: "Skip link",
			state: "info",
			detail: "Not checked: no main landmark",
		};
	}
	const hasSkipLink = Array.from(
		document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
	).some((link) => {
		const id = decodeURIComponent(link.getAttribute("href")?.slice(1) ?? "");
		const target = id ? document.getElementById(id) : null;
		return Boolean(
			target &&
				(target.closest(MAIN_SELECTOR) || target.querySelector(MAIN_SELECTOR)),
		);
	});
	return check(
		"Skip link",
		hasSkipLink,
		"Links to main content",
		"No link to main content",
		"advice",
	);
}

function hasAccessibleName(element: Element): boolean {
	if (element.getAttribute("aria-label")?.trim()) return true;
	if (element.getAttribute("aria-labelledby")?.trim()) return true;
	if (element.textContent?.trim()) return true;
	return Array.from(element.querySelectorAll("img[alt]")).some((image) =>
		image.getAttribute("alt")?.trim(),
	);
}

function countUnlabelledControls(): number {
	return Array.from(
		document.querySelectorAll<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>('input:not([type="hidden"]), select, textarea'),
	).filter((control) => {
		if (control.labels?.length) return false;
		return !control.getAttribute("aria-label")?.trim();
	}).length;
}

/**
 * A deliberately small, browser-visible complement to the build-time audit.
 * It records only checks that can be evaluated faithfully from the rendered DOM.
 */
export function inspectCurrentPage(): StoredPageAudit {
	const titleElements = document.head.querySelectorAll("title");
	const descriptions = document.head.querySelectorAll(
		'meta[name="description"]',
	);
	const canonicals = document.head.querySelectorAll('link[rel="canonical"]');
	const title = document.title.trim();
	const description = metaContent('meta[name="description"]');
	const canonical =
		document.head
			.querySelector('link[rel="canonical"]')
			?.getAttribute("href")
			?.trim() ?? "";
	const lang = document.documentElement.getAttribute("lang")?.trim() ?? "";
	const robots = metaContent('meta[name="robots"]');
	const h1Count = document.querySelectorAll("h1").length;
	const missingAlt = document.querySelectorAll("img:not([alt])").length;
	const emptyLinks = Array.from(document.querySelectorAll("a[href]")).filter(
		(link) => !hasAccessibleName(link),
	).length;
	const unlabelledControls = countUnlabelledControls();
	const invalidJsonLd = Array.from(
		document.querySelectorAll('script[type="application/ld+json"]'),
	).filter((script) => {
		try {
			JSON.parse(script.textContent ?? "");
			return false;
		} catch {
			return true;
		}
	}).length;

	const checks: PageAuditCheck[] = [
		check(
			"Title",
			titleElements.length === 1 && title.length > 0,
			`${title.length} characters`,
			titleElements.length === 0 ? "Missing" : "Missing or duplicated",
		),
		check(
			"Description",
			descriptions.length === 1 && description.length > 0,
			`${description.length} characters`,
			descriptions.length === 0 ? "Missing" : "Missing or duplicated",
		),
		check(
			"Canonical",
			canonicals.length === 1 && canonical.length > 0,
			"Present",
			canonicals.length === 0 ? "Missing" : "Missing or duplicated",
			"advice",
		),
		check("Language", lang.length > 0, lang || "Present", "Missing html lang"),
		check(
			"H1",
			h1Count === 1,
			"One heading",
			`${h1Count} headings found`,
			"advice",
		),
		check(
			"Open Graph",
			["og:title", "og:description", "og:image"].every((property) =>
				metaContent(`meta[property="${property}"]`),
			),
			"Title, description and image present",
			"Title, description or image missing",
			"advice",
		),
		skipLinkCheck(),
		check(
			"Image alt",
			missingAlt === 0,
			"All images have alt attributes",
			`${missingAlt} image${missingAlt === 1 ? "" : "s"} without alt`,
		),
		check(
			"Link text",
			emptyLinks === 0,
			"All links have a name",
			`${emptyLinks} empty link${emptyLinks === 1 ? "" : "s"}`,
		),
		check(
			"Form labels",
			unlabelledControls === 0,
			"All controls are labelled",
			`${unlabelledControls} unlabelled control${unlabelledControls === 1 ? "" : "s"}`,
		),
		{
			name: "Structured data",
			state: invalidJsonLd === 0 ? "info" : "issue",
			detail:
				invalidJsonLd === 0
					? "No invalid JSON-LD found"
					: `${invalidJsonLd} invalid JSON-LD block${invalidJsonLd === 1 ? "" : "s"}`,
		},
	];

	return {
		url: window.location.href,
		timestamp: Date.now(),
		metadata: { title, description, canonical, lang, robots },
		checks,
	};
}

export function capturePageAudit(): void {
	persistDashboardPageAudit(inspectCurrentPage());
}
