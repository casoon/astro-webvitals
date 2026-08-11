import { describe, expect, it } from "vitest";

import { formatMetricValue } from "../src/client/metric-format";

describe("metric formatting", () => {
	it("rounds millisecond metrics for readable local interfaces", () => {
		expect(formatMetricValue("LCP", 142.00000000000003)).toBe("142ms");
		expect(formatMetricValue("TTFB", 25.6)).toBe("26ms");
	});

	it("keeps CLS at three decimal places", () => {
		expect(formatMetricValue("CLS", 0.12356)).toBe("0.124");
	});
});
