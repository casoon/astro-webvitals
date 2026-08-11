/**
 * The draggable/resizable debug overlay: creation, rendering, and the
 * window.* handlers invoked from inline onclick="..." HTML attribute
 * strings (which execute in global scope, not module scope).
 */

import { checkWCAG, clearAccessibilityHighlights } from "../accessibility";
import { browserInfo } from "../browser-info";
import { config } from "../config";
import { formatSEOReport, getSEOContent } from "../seo";
import { state } from "../state";

export function escapeHTML(str: unknown): string {
	if (typeof str !== "string") return "";
	return str.replace(
		/[&<>"']/g,
		(ch) =>
			(
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				}) as Record<string, string>
			)[ch] || ch,
	);
}

// Helper to get metric rating info
export function getMetricRating(key: string, value: number) {
	const thresholds: Record<string, { good: number; poor: number }> = {
		LCP: { good: 2500, poor: 4000 },
		CLS: { good: 0.1, poor: 0.25 },
		FCP: { good: 1800, poor: 3000 },
		TTFB: { good: 800, poor: 1800 },
		INP: { good: 200, poor: 500 },
	};

	const t = thresholds[key];
	if (!t)
		return { status: "⏳", color: "#9CA3AF", rating: "measuring", percent: 0 };

	if (value <= t.good) {
		return {
			status: "✅",
			color: "#10B981",
			rating: "good",
			percent: Math.min(100, (value / t.good) * 100),
		};
	} else if (value <= t.poor) {
		return {
			status: "⚠️",
			color: "#F59E0B",
			rating: "needs improvement",
			percent: 50 + ((value - t.good) / (t.poor - t.good)) * 50,
		};
	} else {
		return { status: "❌", color: "#EF4444", rating: "poor", percent: 100 };
	}
}

// Render radial gauge SVG
export function renderRadialGauge(score: number, size = 80): string {
	const radius = (size - 8) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (score / 100) * circumference;
	const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";

	return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
      <circle
        cx="${size / 2}" cy="${size / 2}" r="${radius}"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        stroke-width="6"
      />
      <circle
        cx="${size / 2}" cy="${size / 2}" r="${radius}"
        fill="none"
        stroke="url(#gaugeGradient)"
        stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        style="transition: stroke-dashoffset 0.5s ease;"
      />
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${color}" />
          <stop offset="100%" stop-color="${color}88" />
        </linearGradient>
      </defs>
    </svg>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(0deg);
      font-size: 18px;
      font-weight: bold;
      color: ${color};
    ">${score}</div>
  `;
}

export function renderMetricRow(key: string): string {
	const value = state.vitals[key];
	const hasValue = typeof value === "number";
	const budget = (config.performanceBudget as Record<string, number>)[key];

	// Metric descriptions for better UX
	const metricDescriptions: Record<string, { name: string; hint: string }> = {
		LCP: { name: "Largest Contentful Paint", hint: "Loading performance" },
		CLS: { name: "Cumulative Layout Shift", hint: "Visual stability" },
		FCP: { name: "First Contentful Paint", hint: "Initial render" },
		TTFB: { name: "Time to First Byte", hint: "Server response" },
		INP: { name: "Interaction to Next Paint", hint: "Overall responsiveness" },
	};

	const metricInfo = metricDescriptions[key] || { name: key, hint: "" };

	// Show placeholder for metrics not yet measured
	if (!hasValue) {
		const waitingInfo: Record<
			string,
			{
				icon: string;
				text: string;
				action?: boolean;
				isGood?: boolean;
				loading?: boolean;
			}
		> = {
			INP: { icon: "👆", text: "Interact to measure", action: true },
			CLS: { icon: "📐", text: "0.000", isGood: true },
			LCP: { icon: "⏳", text: "Measuring...", loading: true },
			FCP: { icon: "⏳", text: "Measuring...", loading: true },
			TTFB: { icon: "⏳", text: "Measuring...", loading: true },
		};

		const info = waitingInfo[key] || { icon: "⏳", text: "Pending..." };

		// For CLS, show 0 as default (no shifts = good)
		if (key === "CLS") {
			return `
        <div style="
          padding: 10px;
          margin-bottom: 6px;
          background: rgba(31, 41, 55, 0.4);
          border-radius: 8px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span>✅</span>
                <span style="font-weight: 600; color: #E5E7EB;">${key}</span>
              </div>
              <div style="font-size: 9px; color: #6B7280; margin-top: 2px;">${metricInfo.hint}</div>
            </div>
            <div style="text-align: right;">
              <span style="color: #10B981; font-weight: 600;">0.000</span>
              <div style="font-size: 9px; color: #10B981;">good</div>
            </div>
          </div>
          <div style="margin-top: 6px; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden;">
            <div style="height: 100%; width: 5%; background: #10B981;"></div>
          </div>
        </div>
      `;
		}

		// For interaction-based metrics, show a call-to-action.
		if (info.action) {
			return `
        <div style="
          padding: 10px;
          margin-bottom: 6px;
          background: rgba(31, 41, 55, 0.3);
          border-radius: 8px;
          border: 1px dashed rgba(96, 165, 250, 0.3);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span>${info.icon}</span>
                <span style="font-weight: 500; color: #9CA3AF;">${key}</span>
              </div>
              <div style="font-size: 9px; color: #6B7280; margin-top: 2px;">${metricInfo.hint}</div>
            </div>
            <div style="
              background: rgba(96, 165, 250, 0.1);
              color: #60A5FA;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
            ">${info.text}</div>
          </div>
        </div>
      `;
		}

		// Loading state for other metrics
		return `
      <div style="
        padding: 10px;
        margin-bottom: 6px;
        background: rgba(31, 41, 55, 0.3);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        opacity: 0.7;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="wv-pulse">${info.icon}</span>
              <span style="font-weight: 500; color: #9CA3AF;">${key}</span>
            </div>
            <div style="font-size: 9px; color: #6B7280; margin-top: 2px;">${metricInfo.hint}</div>
          </div>
          <span style="color: #6B7280; font-size: 11px;">${info.text}</span>
        </div>
      </div>
    `;
	}

	// Metric has a value - render with rating
	const formatted = key === "CLS" ? value.toFixed(3) : `${value}ms`;
	const rating = getMetricRating(key, value);
	const exceededBudget = budget && value > budget;

	return `
    <div style="
      padding: 10px;
      margin-bottom: 6px;
      background: rgba(31, 41, 55, 0.5);
      border-radius: 8px;
      border: 1px solid ${exceededBudget ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.05)"};
    ">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>${rating.status}</span>
            <span style="font-weight: 600; color: #E5E7EB;">${key}</span>
            ${exceededBudget ? '<span style="color: #EF4444; font-size: 9px; margin-left: 4px;">over budget</span>' : ""}
          </div>
          <div style="font-size: 9px; color: #6B7280; margin-top: 2px;">${metricInfo.hint}</div>
        </div>
        <div style="text-align: right;">
          <span style="color: ${rating.color}; font-weight: 600;">${formatted}</span>
          <div style="font-size: 9px; color: ${rating.color};">${rating.rating}</div>
        </div>
      </div>
      <div style="margin-top: 6px; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden;">
        <div style="
          height: 100%;
          width: ${Math.min(100, rating.percent)}%;
          background: linear-gradient(90deg, ${rating.color}, ${rating.color}88);
          transition: width 0.3s ease;
        "></div>
      </div>
    </div>
  `;
}

export function getVitalsContent(): string {
	// Core Web Vitals (the 3 main ones)
	const coreMetrics = ["LCP", "CLS", "INP"];
	// Additional metrics
	const additionalMetrics = ["FCP", "TTFB", "INP"];
	// Navigation timing metrics
	const navMetrics = ["DNS", "TCP", "DOM", "LOAD"];

	// Calculate overall score for radial gauge
	let score = 100;
	let measuredCount = 0;
	const hasLCP = typeof state.vitals.LCP === "number";

	["LCP", "CLS", "INP", "FCP", "TTFB"].forEach((key) => {
		if (typeof state.vitals[key] === "number") {
			measuredCount++;
			const rating = getMetricRating(key, state.vitals[key]);
			if (rating.rating === "poor") score -= 15;
			else if (rating.rating === "needs improvement") score -= 8;
		}
	});
	score = Math.max(0, Math.min(100, score));

	let html = "";

	// Radial gauge header
	html += `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      padding: 12px;
      background: rgba(31, 41, 55, 0.5);
      border-radius: 12px;
    ">
      <div style="position: relative; width: 80px; height: 80px;">
        ${renderRadialGauge(score)}
      </div>
      <div style="margin-left: 16px;">
        <div style="font-size: 12px; color: #9CA3AF; margin-bottom: 4px;">Performance Score</div>
	        <div style="font-size: 11px; color: #6B7280;">${measuredCount}/5 metrics measured</div>
        <div style="font-size: 10px; color: #6B7280; margin-top: 2px;">${browserInfo.engine.charAt(0).toUpperCase() + browserInfo.engine.slice(1)} engine</div>
      </div>
    </div>
  `;

	// Browser compatibility warning
	const unsupportedMetrics = Object.entries(browserInfo.supported)
		.filter(([, v]) => !v)
		.map(([k]) => k);
	if (unsupportedMetrics.length > 0) {
		html += `
      <div style="
        margin-bottom: 12px;
        padding: 10px 12px;
        background: rgba(251, 191, 36, 0.08);
        border: 1px solid rgba(251, 191, 36, 0.2);
        border-radius: 10px;
        color: #E5E7EB;
        font-size: 11px;
      ">
        <div style="font-weight: 600; color: #FBBF24; margin-bottom: 6px;">Browser Limitation (${browserInfo.engine})</div>
        <div style="color: #9CA3AF; line-height: 1.5;">
          Not supported: ${unsupportedMetrics.join(", ")}<br>
          Use Chrome, Edge or Brave for full metrics.
        </div>
      </div>
    `;
	}

	if (!hasLCP) {
		html += `
      <div style="
        margin-bottom: 12px;
        padding: 10px 12px;
        background: rgba(96, 165, 250, 0.08);
        border: 1px solid rgba(96, 165, 250, 0.2);
        border-radius: 10px;
        color: #E5E7EB;
        font-size: 11px;
      ">
        <div style="font-weight: 600; color: #93C5FD; margin-bottom: 6px;">LCP not observed yet</div>
        <div style="color: #9CA3AF; line-height: 1.5;">
          ${state.lcpUnsupported ? "• Browser does not support LCP measurement<br>" : ""}
          • LCP is measured on first user interaction or page hide<br>
          • Ensure a visible hero (image or large heading) is on the page<br>
          • Use same-origin assets or set <code style="color:#E5E7EB;">Timing-Allow-Origin</code> header
        </div>
      </div>
    `;
	}

	// Core Web Vitals section
	html += `<div style="font-size: 11px; color: #60A5FA; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
    <span>📊</span> Core Web Vitals
  </div>`;

	html += coreMetrics.map((key) => renderMetricRow(key)).join("");

	// Additional metrics section
	html += `<div style="font-size: 11px; color: #60A5FA; font-weight: 600; margin: 12px 0 8px 0; display: flex; align-items: center; gap: 6px;">
    <span>📈</span> Additional Metrics
  </div>`;

	html += additionalMetrics.map((key) => renderMetricRow(key)).join("");

	// Navigation timing section (if any are available)
	const hasNavMetrics = navMetrics.some(
		(key) => typeof state.vitals[key] === "number",
	);
	if (hasNavMetrics) {
		html += `<div style="font-size: 11px; color: #60A5FA; font-weight: 600; margin: 12px 0 8px 0; display: flex; align-items: center; gap: 6px;">
      <span>🌐</span> Navigation Timing
    </div>`;

		html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">`;
		html += navMetrics
			.map((key) => {
				const value = state.vitals[key];
				if (typeof value !== "number") return "";
				return `
        <div style="
          padding: 8px;
          background: rgba(31, 41, 55, 0.3);
          border-radius: 6px;
          text-align: center;
        ">
          <div style="font-size: 10px; color: #9CA3AF;">${key}</div>
          <div style="font-size: 14px; color: #E5E7EB; font-weight: 600;">${value}ms</div>
        </div>
      `;
			})
			.join("");
		html += `</div>`;
	}

	return html;
}

export function getAccessibilityContent(): string {
	if (state.wcagIssues.length === 0) {
		return `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
        <div style="color: #10B981; font-weight: 500;">No accessibility issues detected</div>
		<div style="color: #6B7280; font-size: 11px; margin-top: 4px;">No heuristic issues found</div>
      </div>
    `;
	}

	// Group issues by type with full details
	const groupedIssues = state.wcagIssues.reduce(
		(acc: Record<string, any[]>, issue, index) => {
			if (!acc[issue.type]) {
				acc[issue.type] = [];
			}
			acc[issue.type].push({ ...issue, id: index });
			return acc;
		},
		{},
	);

	const issueInfo: Record<
		string,
		{ icon: string; label: string; description: string; link: string }
	> = {
		"missing-alt": {
			icon: "🖼️",
			label: "Missing Alt Text",
			description:
				"Images should have descriptive alt text for screen readers.",
			link: "https://web.dev/image-alt/",
		},
		"low-contrast": {
			icon: "🎨",
			label: "Low Contrast",
			description:
				"Text should have sufficient contrast ratio for readability.",
			link: "https://web.dev/color-contrast/",
		},
		"missing-label": {
			icon: "🏷️",
			label: "Missing Labels",
			description:
				"Form elements and interactive controls need accessible labels.",
			link: "https://web.dev/label/",
		},
		"missing-heading": {
			icon: "📝",
			label: "Heading Issues",
			description:
				"Heading levels should follow a logical hierarchy without skipping levels.",
			link: "https://web.dev/heading-order/",
		},
		keyboard: {
			icon: "⌨️",
			label: "Keyboard Navigation",
			description: "All interactive elements must be accessible via keyboard.",
			link: "https://web.dev/keyboard-access/",
		},
	};

	return `
    <div style="padding: 4px;">
      <!-- Summary header -->
      <div style="
        margin-bottom: 12px;
        padding: 10px;
        background: rgba(245, 158, 11, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(245, 158, 11, 0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div>
          <div style="font-size: 12px; font-weight: 600; color: #F59E0B;">
            ⚠️ ${state.wcagIssues.length} Issue${state.wcagIssues.length !== 1 ? "s" : ""} Found
          </div>
          <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">
            Click to expand details
          </div>
        </div>
        <div style="
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        ">${Object.keys(groupedIssues).length} categories</div>
      </div>

      <!-- Issue categories -->
      ${Object.entries(groupedIssues)
				.map(([type, issues]) => {
					const info = issueInfo[type] || {
						icon: "❓",
						label: type,
						description: "",
						link: "",
					};
					const isExpanded = state.expandedIssues.has(type);

					return `
        <div style="margin-bottom: 8px;">
          <!-- Category header (clickable) -->
          <div
            onclick="window.toggleAccessibilityIssue('${type}')"
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 12px;
              background: ${isExpanded ? "rgba(245, 158, 11, 0.15)" : "rgba(31, 41, 55, 0.5)"};
              border-radius: ${isExpanded ? "8px 8px 0 0" : "8px"};
              border-left: 3px solid ${issues.length > 3 ? "#EF4444" : "#F59E0B"};
              cursor: pointer;
              transition: all 0.2s;
            "
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>${info.icon}</span>
              <span style="color: #E5E7EB; font-size: 12px; font-weight: 500;">${info.label}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="
                background: ${issues.length > 3 ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)"};
                color: ${issues.length > 3 ? "#EF4444" : "#F59E0B"};
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
              ">${issues.length}</span>
              <span style="
                transform: rotate(${isExpanded ? "180deg" : "0deg"});
                transition: transform 0.2s;
                font-size: 10px;
                color: #9CA3AF;
              ">▼</span>
            </div>
          </div>

          <!-- Expanded details -->
          ${
						isExpanded
							? `
            <div style="
              background: rgba(31, 41, 55, 0.3);
              border-radius: 0 0 8px 8px;
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-top: none;
              padding: 10px;
            ">
              <!-- Description -->
              <div style="
                font-size: 11px;
                color: #E5E7EB;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              ">
                ${info.description}
                ${info.link ? `<a href="${info.link}" target="_blank" rel="noopener noreferrer" style="color: #93C5FD; margin-left: 6px; text-decoration: underline;">Learn more →</a>` : ""}
              </div>

              <!-- Individual issues -->
              ${issues
								.slice(0, 10)
								.map(
									(issue, i) => `
                <div style="
                  font-size: 10px;
                  color: #E5E7EB;
                  padding: 6px 8px;
                  margin-bottom: 4px;
                  background: rgba(31, 41, 55, 0.5);
                  border-radius: 4px;
                  font-family: 'SF Mono', Monaco, monospace;
                  word-break: break-all;
                ">
                  <span style="color: #6B7280;">${i + 1}.</span>
                  <span style="color: #F59E0B;">${escapeHTML(issue.element || "Element")}</span>
									${issue.message ? `<div style="color: #9CA3AF; margin-top: 2px; font-size: 9px;">${escapeHTML(issue.message)}</div>` : ""}
                </div>
              `,
								)
								.join("")}

              ${
								issues.length > 10
									? `
                <div style="font-size: 10px; color: #6B7280; text-align: center; padding: 4px;">
                  ... and ${issues.length - 10} more
                </div>
              `
									: ""
							}
            </div>
          `
							: ""
					}
        </div>
      `;
				})
				.join("")}

      <!-- Tips -->
      <div style="
        margin-top: 12px;
        padding: 10px;
        background: rgba(96, 165, 250, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(96, 165, 250, 0.2);
      ">
        <div style="font-size: 10px; color: #60A5FA; font-weight: 500; margin-bottom: 4px;">💡 Quick Wins</div>
        <div style="font-size: 10px; color: #9CA3AF;">
          ${state.wcagIssues.some((i) => i.type === "missing-alt") ? "• Add alt text to images for screen readers<br>" : ""}
          ${state.wcagIssues.some((i) => i.type === "missing-label") ? "• Add labels to form inputs and buttons<br>" : ""}
          ${state.wcagIssues.some((i) => i.type === "missing-heading") ? "• Fix heading hierarchy (h1 → h2 → h3)" : ""}
        </div>
      </div>
    </div>
  `;
}

export function getConsoleContent(): string {
	return `
    <div style="padding: 8px; display: flex; flex-direction: column; gap: 12px;">
      <div style="
        padding: 10px;
        background: rgba(31, 41, 55, 0.4);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      ">
        <div style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.03em;">Quick Actions</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <button onclick="event.stopPropagation(); window.toggleConsoleDock()" style="
            background: ${state.consoleDockEnabled ? "#10B981" : "#4B5563"};
            border: none;
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
          ">${state.consoleDockEnabled ? "Close Console Dock" : "Open Console Dock"}</button>
          <button onclick="window.toggleHighlightIssues()" style="
            background: ${state.highlightEnabled ? "rgba(239, 68, 68, 0.15)" : "#1F2937"};
            border: 1px solid ${state.highlightEnabled ? "rgba(239, 68, 68, 0.4)" : "#374151"};
            color: ${state.highlightEnabled ? "#FCA5A5" : "#E5E7EB"};
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
          ">${state.highlightEnabled ? "Hide WCAG Highlights" : "Show WCAG Highlights"}</button>
          <button onclick="window.clearConsoleErrors()" style="
            background: #4B5563;
            border: none;
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
          ">Clear Messages</button>
        </div>
        <div style="font-size: 10px; color: #6B7280;">
          Console output is captured automatically. Open the dock to view logs; it sits at the bottom of the page and can be resized by dragging the handle upward.
        </div>
      </div>
    </div>
  `;
}

export function getDetailsContent(): string {
	let content = '<div style="padding: 8px;">';

	// Page Info
	content += `
    <div style="margin-bottom: 16px;">
      <div style="font-weight: 500; color: #60A5FA; margin-bottom: 8px; font-size: 11px;">📊 Session Info</div>
      <div style="padding: 8px; background: rgba(31, 41, 55, 0.5); border-radius: 6px; font-size: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #9CA3AF;">URL</span>
		  <span style="color: #E5E7EB; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(window.location.pathname)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #9CA3AF;">Viewport</span>
          <span style="color: #E5E7EB;">${window.innerWidth} × ${window.innerHeight}</span>
        </div>
        ${
					config.sampleRate < 1
						? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #9CA3AF;">Sampling Rate</span>
            <span style="color: #E5E7EB;">${(config.sampleRate * 100).toFixed(0)}%</span>
          </div>
        `
						: ""
				}
      </div>
    </div>
  `;

	// Extended metrics
	if (config.extendedMetrics && (performance as any).memory) {
		const memory = (performance as any).memory;
		const used = (memory.usedJSHeapSize / 1048576).toFixed(1);
		const total = (memory.totalJSHeapSize / 1048576).toFixed(1);
		const percent = (
			(memory.usedJSHeapSize / memory.totalJSHeapSize) *
			100
		).toFixed(0);

		content += `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 500; color: #60A5FA; margin-bottom: 8px; font-size: 11px;">💾 Memory</div>
        <div style="padding: 8px; background: rgba(31, 41, 55, 0.5); border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 4px;">
            <span style="color: #9CA3AF;">JS Heap</span>
            <span style="color: #E5E7EB;">${used} / ${total} MB (${percent}%)</span>
          </div>
          <div style="height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden;">
            <div style="height: 100%; width: ${percent}%; background: ${Number(percent) < 70 ? "#10B981" : Number(percent) < 90 ? "#F59E0B" : "#EF4444"};"></div>
          </div>
        </div>
      </div>
    `;
	}

	if ((navigator as any).connection) {
		const conn = (navigator as any).connection;
		const connectionQuality =
			conn.effectiveType === "4g"
				? "🟢"
				: conn.effectiveType === "3g"
					? "🟡"
					: conn.effectiveType === "2g"
						? "🟠"
						: "🔴";

		content += `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 500; color: #60A5FA; margin-bottom: 8px; font-size: 11px;">🌐 Network</div>
        <div style="padding: 8px; background: rgba(31, 41, 55, 0.5); border-radius: 6px; font-size: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #9CA3AF;">Connection</span>
            <span style="color: #E5E7EB;">${connectionQuality} ${conn.effectiveType || "unknown"}</span>
          </div>
          ${
						conn.rtt
							? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #9CA3AF;">Latency</span>
              <span style="color: #E5E7EB;">${conn.rtt}ms</span>
            </div>
          `
							: ""
					}
          ${
						conn.downlink
							? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9CA3AF;">Speed</span>
              <span style="color: #E5E7EB;">${conn.downlink} Mbps</span>
            </div>
          `
							: ""
					}
        </div>
      </div>
    `;
	}

	// Config info
	if (config.endpoint || config.batchReporting) {
		content += `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 500; color: #60A5FA; margin-bottom: 8px; font-size: 11px;">⚙️ Configuration</div>
        <div style="padding: 8px; background: rgba(31, 41, 55, 0.5); border-radius: 6px; font-size: 10px;">
          ${
						config.endpoint
							? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #9CA3AF;">Analytics</span>
              <span style="color: #10B981;">✅ Active</span>
            </div>
          `
							: ""
					}
          ${
						config.batchReporting
							? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9CA3AF;">Batching</span>
              <span style="color: #E5E7EB;">Every ${config.batchInterval / 1000}s</span>
            </div>
          `
							: ""
					}
        </div>
      </div>
    `;
	}

	content += "</div>";
	return content;
}

export function preserveContentScroll(fn: () => void): void {
	const content = document.getElementById("wv-content");
	const scrollTop = content?.scrollTop || 0;
	fn();
	const newContent = document.getElementById("wv-content");
	if (newContent) newContent.scrollTop = scrollTop;
}

export function createDebugOverlay(): void {
	state.debugContainer = document.createElement("div");
	state.debugContainer.id = "astro-webvitals-debug";
	state.debugContainer.setAttribute("role", "status");
	state.debugContainer.setAttribute(
		"aria-label",
		"Web Vitals & Accessibility Monitor",
	);
	state.debugContainer.setAttribute("aria-live", "polite");

	// Add global styles for animations
	if (!document.getElementById("wv-styles")) {
		const styleSheet = document.createElement("style");
		styleSheet.id = "wv-styles";
		styleSheet.textContent = `
      @keyframes wv-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .wv-pulse {
        animation: wv-pulse 1.5s ease-in-out infinite;
      }
      @keyframes wv-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .wv-spin {
        animation: wv-spin 1s linear infinite;
      }
      #astro-webvitals-debug * {
        box-sizing: border-box;
      }
      .wv-a11y-highlight {
        outline: 2px solid #F59E0B;
        outline-offset: 2px;
        position: relative;
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35);
      }
      #astro-webvitals-debug::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      #astro-webvitals-debug::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 2px;
      }
      #astro-webvitals-debug::-webkit-scrollbar-thumb {
        background: rgba(96, 165, 250, 0.5);
        border-radius: 2px;
      }
      #astro-webvitals-debug::-webkit-scrollbar-thumb:hover {
        background: rgba(96, 165, 250, 0.8);
      }
    `;
		document.head.appendChild(styleSheet);
	}

	// Minimized view by default
	updateDebugOverlay();
	document.body.appendChild(state.debugContainer);
}

export function updateDebugOverlay(): void {
	if (!state.debugContainer) return;

	const metricsCount = Object.keys(state.vitals).length;
	const issuesCount = state.wcagIssues.length;
	const performanceBudget = config.performanceBudget as Record<string, number>;

	// Calculate overall score
	let score = 100;
	if (state.vitals.LCP > performanceBudget.LCP) score -= 20;
	if (state.vitals.CLS > performanceBudget.CLS) score -= 20;
	if (state.vitals.FCP > performanceBudget.FCP) score -= 10;
	if (state.vitals.TTFB > performanceBudget.TTFB) score -= 10;
	if (issuesCount > 0) score -= Math.min(20, issuesCount * 5);
	score = Math.max(0, score);

	const scoreColor =
		score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
	const scoreEmoji = score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌";

	// Mobile-specific styles
	// Adjust position when console dock is open
	let adjustedPosition = config.desktopPositions[config.position];
	if (
		state.consoleDockEnabled &&
		(config.position === "bottom-right" || config.position === "bottom-left")
	) {
		const bottomOffset = state.consoleDockHeight + 20;
		adjustedPosition =
			config.position === "bottom-right"
				? `bottom: ${bottomOffset}px; right: 16px;`
				: `bottom: ${bottomOffset}px; left: 16px;`;
	}
	const containerStyles = state.isMobile
		? `
    position: fixed;
    ${config.mobilePosition}
    background: rgba(17, 24, 39, 0.98);
    color: white;
    border-radius: ${state.isExpanded ? "16px 16px 0 0" : "0"};
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: none;
    transition: all 0.3s ease;
    max-width: 100%;
    height: ${state.isExpanded ? "60vh" : "auto"};
    transform: translateY(${state.isExpanded ? "0" : "calc(100% - 48px)"});
    overflow: hidden;
  `
		: `
    position: fixed;
    ${adjustedPosition}
    background: rgba(17, 24, 39, 0.95);
    color: white;
    border-radius: 12px;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    width: ${state.isExpanded ? "420px" : "280px"};
    min-height: ${state.isExpanded ? "420px" : "auto"};
    overflow: hidden;
  `;

	state.debugContainer.innerHTML = `
    <div style="${containerStyles}">
      <!-- Header -->
      <div style="
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        user-select: none;
      " onclick="window.toggleWebVitalsDebug()">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px;">${scoreEmoji}</span>
            <span style="font-weight: 600; color: #E5E7EB;">Performance</span>
            <span style="
              background: ${scoreColor};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            ">${score}</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${config.sampleRate < 1 ? `<span style="font-size: 10px; color: #9CA3AF;">📊 ${(config.sampleRate * 100).toFixed(0)}%</span>` : ""}
            <button
              onclick="event.stopPropagation(); document.getElementById('astro-webvitals-debug').remove();"
              style="
                background: transparent;
                border: none;
                color: #6B7280;
                cursor: pointer;
                padding: 0;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
                font-size: 16px;
                line-height: 1;
                font-weight: bold;
              "
              onmouseover="this.style.color='#EF4444'; this.style.background='rgba(239, 68, 68, 0.1)';"
              onmouseout="this.style.color='#6B7280'; this.style.background='transparent';"
              aria-label="Close performance monitor"
              title="Close (reopens on page reload)"
            >×</button>
            <span style="
              transform: rotate(${state.isExpanded ? "180deg" : "0"});
              transition: transform 0.3s;
              font-size: 10px;
            ">▼</span>
          </div>
        </div>

        ${
					!state.isExpanded
						? `
          <!-- Minimized Summary -->
          <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 11px; color: #9CA3AF;">
            ${metricsCount > 0 ? `<span>📊 ${metricsCount} metrics</span>` : "<span>📊 Measuring...</span>"}
            ${issuesCount > 0 ? `<span style="color: #F59E0B;">⚠️ ${issuesCount} issues</span>` : ""}
          </div>
        `
						: ""
				}
      </div>

      ${
				state.isExpanded
					? `
        <!-- Tabs -->
        <div style="
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 16px;
        ">
          <button onclick="window.setWebVitalsTab('vitals')" style="
            background: none;
            border: none;
            color: ${state.activeTab === "vitals" ? "#60A5FA" : "#9CA3AF"};
            padding: 8px 12px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            border-bottom: 2px solid ${state.activeTab === "vitals" ? "#60A5FA" : "transparent"};
            transition: all 0.2s;
          ">Core Vitals</button>

          <button onclick="window.setWebVitalsTab('seo')" style="
            background: none;
            border: none;
            color: ${state.activeTab === "seo" ? "#60A5FA" : "#9CA3AF"};
            padding: 8px 12px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            border-bottom: 2px solid ${state.activeTab === "seo" ? "#60A5FA" : "transparent"};
            transition: all 0.2s;
          ">SEO</button>

          ${
						config.checkAccessibility
							? `
            <button onclick="window.setWebVitalsTab('accessibility')" style="
              background: none;
              border: none;
              color: ${state.activeTab === "accessibility" ? "#60A5FA" : "#9CA3AF"};
              padding: 8px 12px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 500;
              border-bottom: 2px solid ${state.activeTab === "accessibility" ? "#60A5FA" : "transparent"};
              transition: all 0.2s;
              position: relative;
            ">
              Accessibility
              ${
								issuesCount > 0
									? `<span style="
                position: absolute;
                top: 4px;
                right: 4px;
                background: #EF4444;
                color: white;
                border-radius: 10px;
                padding: 1px 5px;
                font-size: 9px;
              ">${issuesCount}</span>`
									: ""
							}
            </button>
          `
							: ""
					}

          ${
						config.extendedMetrics || config.smartDetection
							? `
            <button onclick="window.setWebVitalsTab('details')" style="
              background: none;
              border: none;
              color: ${state.activeTab === "details" ? "#60A5FA" : "#9CA3AF"};
              padding: 8px 12px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 500;
              border-bottom: 2px solid ${state.activeTab === "details" ? "#60A5FA" : "transparent"};
              transition: all 0.2s;
            ">Details</button>
          `
							: ""
					}

          <button onclick="window.setWebVitalsTab('console')" style="
            background: none;
            border: none;
            color: ${state.activeTab === "console" ? "#60A5FA" : "#9CA3AF"};
            padding: 8px 12px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            border-bottom: 2px solid ${state.activeTab === "console" ? "#60A5FA" : "transparent"};
            transition: all 0.2s;
            position: relative;
          ">
            Console
            ${
							state.consoleErrors.filter((e) => e.type === "error").length > 0
								? `<span style="
              position: absolute;
              top: 4px;
              right: 4px;
              background: #EF4444;
              color: white;
              border-radius: 10px;
              padding: 1px 5px;
              font-size: 9px;
            ">${state.consoleErrors.filter((e) => e.type === "error").length}</span>`
								: ""
						}
          </button>
        </div>

        <!-- Content -->
        <div id="wv-content" style="padding: 12px 16px; height: ${state.isMobile ? "60vh" : "400px"}; overflow-y: auto;">
          ${state.activeTab === "vitals" ? getVitalsContent() : ""}
          ${state.activeTab === "seo" ? getSEOContent() : ""}
          ${state.activeTab === "accessibility" ? getAccessibilityContent() : ""}
          ${state.activeTab === "details" ? getDetailsContent() : ""}
          ${state.activeTab === "console" ? getConsoleContent() : ""}
        </div>

        <!-- Footer -->
        <div style="
          padding: 8px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <a href="https://github.com/casoon/astro-webvitals"
             target="_blank"
             rel="noopener noreferrer"
             style="color: #60A5FA; text-decoration: none; font-size: 10px;">
            @casoon/astro-webvitals
          </a>
          <button
            onclick="document.getElementById('astro-webvitals-debug').remove()"
            aria-label="Close monitor"
            style="
              background: none;
              border: 1px solid #4B5563;
              color: #9CA3AF;
              cursor: pointer;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
            ">Close</button>
        </div>
      `
					: ""
			}
    </div>
  `;
}

export function initDebugOverlay(): void {
	// Global functions for overlay interaction
	(window as any).toggleWebVitalsDebug = () => {
		state.isExpanded = !state.isExpanded;
		updateDebugOverlay();
	};

	(window as any).setWebVitalsTab = (tab: string) => {
		state.activeTab = tab;
		updateDebugOverlay();
	};

	(window as any).toggleAccessibilityIssue = (type: string) => {
		if (state.expandedIssues.has(type)) {
			state.expandedIssues.delete(type);
		} else {
			state.expandedIssues.add(type);
		}
		updateDebugOverlay();
	};

	(window as any).copySEOReport = async () => {
		const text = formatSEOReport();
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				const textarea = document.createElement("textarea");
				textarea.value = text;
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand("copy");
				document.body.removeChild(textarea);
			}
		} catch (e) {
			console.warn("[@casoon/astro-webvitals] Failed to copy SEO report", e);
		}
	};

	(window as any).toggleHighlightIssues = () => {
		state.highlightEnabled = !state.highlightEnabled;
		if (!state.highlightEnabled) {
			clearAccessibilityHighlights();
		}
		if (config.checkAccessibility) {
			checkWCAG();
		}
		updateDebugOverlay();
	};

	if (config.debug) {
		createDebugOverlay();
	}
}
