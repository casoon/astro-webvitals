/** Opt-in Long Task reporting for diagnosing main-thread blocking. */

import { config } from "../config";
import { publishMetric } from "./vitals";

export function measureLongTasks(): void {
	if (!PerformanceObserver.supportedEntryTypes?.includes("longtask")) return;

	const observer = new PerformanceObserver((list) => {
		for (const entry of list.getEntries()) {
			const value = Math.round(entry.duration);
			publishMetric({
				name: "LongTask",
				value,
				delta: value,
				id: `${config.finalSessionId}-longtask-${Math.round(entry.startTime)}`,
			});
		}
	});
	observer.observe({ type: "longtask", buffered: true });
}
