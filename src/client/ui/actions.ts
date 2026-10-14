/**
 * Click dispatch for the overlay and console dock markup. Inline on*="..."
 * attributes are blocked by a Content-Security-Policy without
 * 'unsafe-inline', so the markup names its handler in data-webvitals-action
 * (optional argument in data-webvitals-arg) and one listener per container
 * calls it. Only the innermost action element runs, which is what the former
 * event.stopPropagation() calls on nested handlers achieved.
 */

export type ActionHandlers = Record<string, (arg?: string) => void>;

export function bindActions(root: HTMLElement, handlers: ActionHandlers): void {
	root.addEventListener("click", (event) => {
		const target = (event.target as Element).closest<HTMLElement>(
			"[data-webvitals-action]",
		);
		if (!target || !root.contains(target)) return;
		handlers[target.dataset.webvitalsAction as string]?.(
			target.dataset.webvitalsArg,
		);
	});
}
