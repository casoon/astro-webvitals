/**
 * Debounced resize listener that keeps state.isMobile in sync with the
 * viewport, re-rendering the debug overlay when the breakpoint flips.
 */

import { state } from "../state";
import { updateDebugOverlay } from "./debug-overlay";

export function initResponsive(): void {
	let resizeTimeout: ReturnType<typeof setTimeout>;
	window.addEventListener("resize", () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			const newIsMobile = window.innerWidth < 700;
			if (newIsMobile !== state.isMobile) {
				state.isMobile = newIsMobile;
				if (state.debugContainer) {
					updateDebugOverlay();
				}
			}
		}, 250); // Debounce resize events
	});
}
