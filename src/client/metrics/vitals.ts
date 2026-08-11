/**
 * Core RUM collection delegated to Google's web-vitals implementation.
 * It stays aligned with Chrome's metric definitions and supplies stable IDs
 * plus deltas for analytics systems that receive more than one report.
 */

import type { Metric, MetricWithAttribution } from "web-vitals";

import { config } from "../config";
import { type ReportableMetric, recordMetric } from "../reporting";
import { type MetricAttribution, state } from "../state";

export function publishMetric(metric: ReportableMetric): void {
	state.vitals[metric.name] = metric.value;
	recordMetric(metric);

	window.dispatchEvent(
		new CustomEvent("webvitals:metric", {
			detail: metric,
		}),
	);
}

function reportMetric(metric: Metric | MetricWithAttribution): void {
	publishMetric({
		name: metric.name,
		value: metric.value,
		delta: metric.delta,
		id: metric.id,
		rating: metric.rating,
		navigationType: metric.navigationType,
		attribution: getAttribution(metric),
	});
}

function getAttribution(
	metric: Metric | MetricWithAttribution,
): MetricAttribution | undefined {
	if (!("attribution" in metric)) return undefined;
	const attribution = metric.attribution;
	const value: MetricAttribution = {
		target:
			("target" in attribution && attribution.target) ||
			("largestShiftTarget" in attribution && attribution.largestShiftTarget) ||
			("interactionTarget" in attribution && attribution.interactionTarget) ||
			undefined,
		url: "url" in attribution ? attribution.url : undefined,
		largestShiftTime:
			"largestShiftTime" in attribution
				? attribution.largestShiftTime
				: undefined,
		largestShiftValue:
			"largestShiftValue" in attribution
				? attribution.largestShiftValue
				: undefined,
		interactionType:
			"interactionType" in attribution
				? attribution.interactionType
				: undefined,
	};
	return Object.values(value).some((entry) => entry !== undefined)
		? value
		: undefined;
}

export async function measureWebVitals(): Promise<void> {
	const options = {
		reportAllChanges: config.debug,
		reportSoftNavs: config.trackSoftNavigations,
	};

	if (config.attribution) {
		const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import(
			"web-vitals/attribution"
		);
		onCLS(reportMetric, options);
		onINP(reportMetric, options);
		onLCP(reportMetric, options);
		onFCP(reportMetric, options);
		onTTFB(reportMetric, options);
		return;
	}

	const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import("web-vitals");
	onCLS(reportMetric, options);
	onINP(reportMetric, options);
	onLCP(reportMetric, options);
	onFCP(reportMetric, options);
	onTTFB(reportMetric, options);
}
