/**
 * BFCache (Back-Forward Cache) Handler
 */

export type BFCacheCallback = (event: PageTransitionEvent) => void;

// Handle BFCache restoration
export function onBFCacheRestore(callback: BFCacheCallback): void {
	window.addEventListener(
		"pageshow",
		(event: PageTransitionEvent) => {
			if (event.persisted) {
				callback(event);
			}
		},
		true,
	);
}
