/**
 * Runtime consent for @casoon/astro-webvitals, importable from a cookie
 * banner or consent manager as `@casoon/astro-webvitals/consent`.
 *
 * It only dispatches a window event, so it works no matter how the bundler
 * splits this module from the component's script, and it is safe to call
 * before the component has initialized (the call is then remembered).
 */

export const CONSENT_EVENT = "webvitals:consent";

export interface ConsentEventDetail {
	granted: boolean;
}

declare global {
	interface Window {
		__WEBVITALS_CONSENT__?: boolean;
	}
}

/**
 * Grant (`true`) or withdraw (`false`) consent for this document. Granting
 * starts collection (subject to `respectDnt` and `sampleRate`); withdrawing
 * stops recording and sending and deletes buffered and retry-queued reports.
 * The choice is not stored — call it again on every full page load, e.g.
 * from your consent manager's ready callback.
 */
export function setWebVitalsConsent(granted: boolean): void {
	window.__WEBVITALS_CONSENT__ = granted;
	window.dispatchEvent(
		new CustomEvent<ConsentEventDetail>(CONSENT_EVENT, { detail: { granted } }),
	);
}
