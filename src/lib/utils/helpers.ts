/**
 * Web Vitals Helper Functions
 */

// Get activation start time for prerendered pages
export function getActivationStart(): number {
	const navEntry = performance.getEntriesByType(
		"navigation",
	)[0] as PerformanceNavigationTiming;
	return navEntry?.activationStart || 0;
}

// Run callback only once
export function runOnce<T extends (...args: any[]) => any>(callback: T): T {
	let called = false;
	return ((...args: Parameters<T>) => {
		if (!called) {
			called = true;
			return callback(...args);
		}
	}) as T;
}

// Schedule during idle or when hidden
export function whenIdleOrHidden(callback: () => void): void {
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
}

// Double requestAnimationFrame for accurate timing after BFCache restore
export function doubleRAF(callback: () => void): void {
	requestAnimationFrame(() => requestAnimationFrame(callback));
}
