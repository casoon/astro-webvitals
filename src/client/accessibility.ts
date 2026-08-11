/**
 * WCAG accessibility checker + highlight toggling.
 */

import { config } from "./config";
import { state } from "./state";
import { updateDebugOverlay } from "./ui/debug-overlay";

export function clearAccessibilityHighlights(): void {
	state.highlightedNodes.forEach((node) => {
		if (node?.classList) {
			node.classList.remove("wv-a11y-highlight");
		}
	});
	state.highlightedNodes.clear();
}

// WCAG Checker
export function checkWCAG(): void {
	if (!config.checkAccessibility) return;

	state.wcagIssues.length = 0;
	clearAccessibilityHighlights();

	// Check for missing alt text
	document.querySelectorAll("img:not([alt])").forEach((img) => {
		const imgEl = img as HTMLImageElement;
		state.wcagIssues.push({
			type: "missing-alt",
			element: imgEl.src
				? `<img src="${imgEl.src.substring(0, 50)}...">`
				: "<img>",
			elementRef: imgEl,
			message: "Image missing alt attribute",
			wcagLevel: "1.1.1 Level A",
		});
	});

	// Check for empty buttons
	document.querySelectorAll("button").forEach((button) => {
		if (!button.textContent?.trim() && !button.getAttribute("aria-label")) {
			state.wcagIssues.push({
				type: "missing-label",
				element: "<button>",
				elementRef: button,
				message: "Button has no accessible text",
				wcagLevel: "4.1.2 Level A",
			});
		}
	});

	// Check form inputs without labels
	document
		.querySelectorAll('input:not([type="hidden"]), select, textarea')
		.forEach((input) => {
			const id = (input as HTMLInputElement).id;
			const hasLabel =
				id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
			const hasAriaLabel = input.getAttribute("aria-label");

			if (!hasLabel && !hasAriaLabel) {
				state.wcagIssues.push({
					type: "missing-label",
					element: `<${input.tagName.toLowerCase()} type="${(input as HTMLInputElement).type || "text"}">`,
					elementRef: input,
					message: "Form control missing label",
					wcagLevel: "1.3.1 Level A",
				});
			}
		});

	// Check heading structure
	const headings = Array.from(
		document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
	);
	let lastLevel = 0;
	headings.forEach((heading) => {
		const level = parseInt(heading.tagName[1], 10);
		if (level - lastLevel > 1) {
			state.wcagIssues.push({
				type: "missing-heading",
				element: `<${heading.tagName.toLowerCase()}>`,
				elementRef: heading,
				message: `Heading level skipped (${lastLevel} to ${level})`,
				wcagLevel: "1.3.1 Level A",
			});
		}
		lastLevel = level;
	});

	// Check for links without text
	document.querySelectorAll("a[href]").forEach((link) => {
		const linkEl = link as HTMLAnchorElement;
		if (!linkEl.textContent?.trim() && !linkEl.getAttribute("aria-label")) {
			state.wcagIssues.push({
				type: "missing-label",
				element: `<a href="${linkEl.href.substring(0, 30)}...">`,
				elementRef: linkEl,
				message: "Link has no accessible text",
				wcagLevel: "2.4.4 Level A",
			});
		}
	});

	if (state.highlightEnabled) {
		state.wcagIssues.forEach((issue) => {
			if (issue.elementRef instanceof Element) {
				issue.elementRef.classList.add("wv-a11y-highlight");
				state.highlightedNodes.add(issue.elementRef);
			}
		});
	}

	updateDebugOverlay();
}
