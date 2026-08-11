const SITEMAP_PASS_STORAGE_KEY = "casoon-webvitals-sitemap-pass";
const PAGE_SETTLE_DELAY = 1800;

interface SitemapPass {
	urls: string[];
	index: number;
	returnUrl: string;
}

function readSitemapPass(): SitemapPass | undefined {
	try {
		const raw = window.sessionStorage.getItem(SITEMAP_PASS_STORAGE_KEY);
		if (!raw) return undefined;
		const parsed = JSON.parse(raw) as Partial<SitemapPass>;
		if (
			!Array.isArray(parsed.urls) ||
			parsed.urls.some((url) => typeof url !== "string") ||
			typeof parsed.index !== "number" ||
			typeof parsed.returnUrl !== "string"
		) {
			return undefined;
		}
		return parsed as SitemapPass;
	} catch {
		return undefined;
	}
}

function writeSitemapPass(pass: SitemapPass): void {
	try {
		window.sessionStorage.setItem(
			SITEMAP_PASS_STORAGE_KEY,
			JSON.stringify(pass),
		);
	} catch {
		// The dashboard remains usable when session storage is unavailable.
	}
}

function clearSitemapPass(): void {
	try {
		window.sessionStorage.removeItem(SITEMAP_PASS_STORAGE_KEY);
	} catch {
		// The pass is optional local QA tooling.
	}
}

export function isSitemapPassActive(): boolean {
	const pass = readSitemapPass();
	return pass?.urls[pass.index] === window.location.href;
}

export function startSitemapPass(urls: string[], returnUrl: string): boolean {
	const uniqueUrls = [...new Set(urls)];
	if (uniqueUrls.length === 0) return false;
	writeSitemapPass({ urls: uniqueUrls, index: 0, returnUrl });
	return true;
}

/**
 * Continue an explicitly started sitemap pass after each full page load.
 * A short dwell time lets navigation and paint metrics settle before pagehide
 * flushes the final Web Vitals values into the browser-local dashboard store.
 */
export function continueSitemapPass(): void {
	const pass = readSitemapPass();
	if (!pass || pass.urls[pass.index] !== window.location.href) return;

	const goToNextPage = () => {
		const currentPass = readSitemapPass();
		if (
			!currentPass ||
			currentPass.urls[currentPass.index] !== window.location.href
		) {
			return;
		}

		const nextIndex = currentPass.index + 1;
		if (nextIndex >= currentPass.urls.length) {
			clearSitemapPass();
			window.location.assign(currentPass.returnUrl);
			return;
		}

		writeSitemapPass({ ...currentPass, index: nextIndex });
		window.location.assign(currentPass.urls[nextIndex]);
	};

	if (document.readyState === "complete") {
		window.setTimeout(goToNextPage, PAGE_SETTLE_DELAY);
	} else {
		window.addEventListener(
			"load",
			() => window.setTimeout(goToNextPage, PAGE_SETTLE_DELAY),
			{ once: true },
		);
	}
}
