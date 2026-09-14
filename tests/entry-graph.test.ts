import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config } from "../src/client/config";
import { measureLOAD } from "../src/client/metrics/navigation";
import { state } from "../src/client/state";

const clientDir = join(
	dirname(fileURLToPath(import.meta.url)),
	"../src/client",
);

// Optional features that must only be reached through dynamic import(), so the
// bundler emits them as separate chunks instead of the entry every page loads.
const lazyModules = [
	"accessibility.ts",
	"console-capture.ts",
	"metrics/long-tasks.ts",
	"seo.ts",
	"ui/console-dock.ts",
	"ui/debug-overlay.ts",
	"ui/responsive.ts",
];

/** Relative value imports (not `import type`) of a module, as client-relative paths. */
function staticImports(file: string): string[] {
	const source = readFileSync(join(clientDir, file), "utf8");
	const specifiers = [
		...source.matchAll(/^import\s+(?!type\s)[^;]*?from\s+"(\.[^"]+)"/gms),
		...source.matchAll(/^import\s+"(\.[^"]+)"/gm),
	].map((match) => match[1]);
	return specifiers.map((specifier) =>
		`${resolve("/", dirname(file), specifier).slice(1)}.ts`.replace(
			/\.ts\.ts$/,
			".ts",
		),
	);
}

function staticClosure(entry: string): Set<string> {
	const seen = new Set<string>();
	const visit = (file: string) => {
		if (seen.has(file)) return;
		seen.add(file);
		staticImports(file).forEach(visit);
	};
	visit(entry);
	return seen;
}

describe("client entry graph", () => {
	it("does not statically import the optional debug features", () => {
		const entryGraph = staticClosure("index.ts");
		expect(entryGraph.has("reporting.ts")).toBe(true);
		expect(lazyModules.filter((file) => entryGraph.has(file))).toEqual([]);
	});

	it("loads the optional debug features with dynamic import()", () => {
		const source = readFileSync(join(clientDir, "index.ts"), "utf8");
		const dynamic = [...source.matchAll(/import\(\s*"\.\/([^"]+)"\s*\)/g)].map(
			(match) => `${match[1]}.ts`,
		);
		expect([...dynamic].sort()).toEqual(lazyModules);
	});
});

describe("navigation metrics", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		state.refreshDebugOverlay = null;
		state.vitals = {};
		config.endpoint = undefined;
		config.dashboard = false;
	});

	it("refresh the debug overlay through the registered hook", () => {
		vi.spyOn(performance, "getEntriesByType").mockReturnValue([
			{ startTime: 0, loadEventEnd: 420 } as PerformanceNavigationTiming,
		]);
		const refresh = vi.fn();
		state.refreshDebugOverlay = refresh;

		measureLOAD();

		expect(state.vitals.LOAD).toBe(420);
		expect(refresh).toHaveBeenCalledOnce();
	});

	it("work without the debug overlay loaded", () => {
		vi.spyOn(performance, "getEntriesByType").mockReturnValue([
			{ startTime: 0, loadEventEnd: 420 } as PerformanceNavigationTiming,
		]);

		expect(() => measureLOAD()).not.toThrow();
		expect(state.vitals.LOAD).toBe(420);
	});
});
