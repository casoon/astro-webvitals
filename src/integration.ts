import type { AstroIntegration } from "astro";

export interface WebVitalsDashboardOptions {
	/** Route for the local browser-storage dashboard. */
	route?: string;
	/** Disable route injection without removing the integration from config. */
	enabled?: boolean;
	/**
	 * Show the "Run sitemap pass" button. Turn it off when not every sitemap
	 * page renders `<WebVitals dashboard />`, since the pass stops there.
	 */
	sitemapPass?: boolean;
}

/**
 * Injects a static, noindex dashboard that reads locally persisted RUM data.
 * Enable `dashboard` on the WebVitals component to collect that data.
 */
export function webVitalsDashboard(
	options: WebVitalsDashboardOptions = {},
): AstroIntegration {
	const route = options.route ?? "/__web-vitals";
	if (!route.startsWith("/")) {
		throw new Error(
			"[@casoon/astro-webvitals] dashboard route must start with '/'.",
		);
	}

	return {
		name: "@casoon/astro-webvitals/dashboard",
		hooks: {
			"astro:config:setup": ({ injectRoute, updateConfig }) => {
				if (options.enabled === false) return;
				updateConfig({
					vite: {
						define: {
							__CASOON_WEBVITALS_SITEMAP_PASS__: JSON.stringify(
								options.sitemapPass !== false,
							),
						},
					},
				});
				injectRoute({
					pattern: route,
					entrypoint: new URL("./dashboard.astro", import.meta.url),
					prerender: true,
				});
			},
		},
	};
}
