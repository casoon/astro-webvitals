/**
 * Visibility tracking, BFCache restoration, and idle/timing helpers used by
 * the Core Web Vitals measurement functions.
 */

// Get activation start time for prerendered pages
export function getActivationStart(): number {
	const navEntry = performance.getEntriesByType(
		"navigation",
	)[0] as PerformanceNavigationTiming & {
		activationStart?: number;
	};
	return navEntry?.activationStart || 0;
}

// Visibility tracking - important for accurate metrics
export const visibilityWatcher = (() => {
	let firstHiddenTime = document.visibilityState === "hidden" ? 0 : Infinity;

	const onVisibilityChange = (event: Event) => {
		if (document.visibilityState === "hidden" && firstHiddenTime === Infinity) {
			firstHiddenTime =
				event.type === "visibilitychange" ? (event as any).timeStamp : 0;
		}
	};

	document.addEventListener("visibilitychange", onVisibilityChange, true);
	// Handle page being hidden on unload
	document.addEventListener("prerenderingchange", onVisibilityChange, true);

	return {
		get firstHiddenTime() {
			return firstHiddenTime;
		},
	};
})();

// BFCache (Back-Forward Cache) restoration handler
export const onBFCacheRestore = (
	callback: (event: PageTransitionEvent) => void,
) => {
	window.addEventListener(
		"pageshow",
		(event) => {
			if (event.persisted) {
				callback(event);
			}
		},
		true,
	);
};

// Run callback once
export const runOnce = <T extends (...args: any[]) => void>(callback: T) => {
	let called = false;
	return (...args: Parameters<T>) => {
		if (!called) {
			called = true;
			callback(...args);
		}
	};
};

// Schedule during idle or when hidden
export const whenIdleOrHidden = (callback: () => void) => {
	const onHidden = () => {
		if (document.visibilityState === "hidden") {
			callback();
			document.removeEventListener("visibilitychange", onHidden, true);
		}
	};

	if ("requestIdleCallback" in window) {
		(window as any).requestIdleCallback(() => callback(), { timeout: 500 });
	} else {
		setTimeout(callback, 100);
	}

	document.addEventListener("visibilitychange", onHidden, true);
};

// Double requestAnimationFrame for accurate timing after BFCache restore
export const doubleRAF = (callback: () => void) => {
	requestAnimationFrame(() => requestAnimationFrame(callback));
};
