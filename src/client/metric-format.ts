/** Format measured values consistently in local user interfaces. */
export function formatMetricValue(name: string, value: number): string {
	if (name === "CLS") return value.toFixed(3);
	return `${Math.round(value)}ms`;
}
