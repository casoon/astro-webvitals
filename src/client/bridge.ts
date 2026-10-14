/**
 * Hands the resolved component props from Astro's frontmatter to the client
 * module as inert JSON (`<script type="application/json">`), so no executable
 * inline script is needed and hash-based CSPs (Astro `security.csp`) work.
 */

import type { BridgedConfig } from "./config";

declare global {
	interface Window {
		__WEBVITALS_CONFIG__?: BridgedConfig;
	}
}

const CONFIG_SELECTOR = "script[data-astro-webvitals-config]";

/**
 * JSON for embedding inside a <script> element: characters that could end the
 * element or open an HTML comment/CDATA section are written as \u escapes,
 * which JSON.parse turns back into the original characters.
 */
export function serializeBridgedConfig(config: BridgedConfig): string {
	return JSON.stringify(config).replace(
		/[<>&\u2028\u2029]/g,
		(char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
	);
}

/** Reads the last rendered config, matching the former "last inline script wins". */
export function readBridgedConfig(): BridgedConfig | undefined {
	const elements = document.querySelectorAll(CONFIG_SELECTOR);
	const last = elements[elements.length - 1];
	if (!last?.textContent) return undefined;
	return JSON.parse(last.textContent) as BridgedConfig;
}
