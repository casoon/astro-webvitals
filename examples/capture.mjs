// Regenerates the website showcase fixtures in examples/output/ from the package itself:
//
//   pnpm install && node examples/capture.mjs
//
// 1. Builds examples/demo/ with Astro and records what <WebVitals> and webVitalsDashboard()
//    add to the static output: the injected scripts, the routes and the client chunks.
// 2. Runs the page checks and the accessibility heuristic from src/client/ in jsdom against
//    examples/pages/sample.html.
//
// No metric values are captured: Web Vitals are field measurements and differ per visit.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { JSDOM } from "jsdom";
import { createViteServer } from "vitest/node";

process.env.ASTRO_TELEMETRY_DISABLED = "1";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const demo = join(root, "examples/demo");
const dist = join(demo, "dist");
const out = join(root, "examples/output");
mkdirSync(out, { recursive: true });

const write = (file, content) => {
	writeFileSync(join(out, file), content.endsWith("\n") ? content : `${content}\n`);
	console.log(`wrote examples/output/${file}`);
};
const json = (value) => JSON.stringify(value, null, 2);

// ---------------------------------------------------------------- 1. static build
const { build } = await import("astro");
rmSync(dist, { recursive: true, force: true });
await build({ root: demo, logLevel: "error" });

const read = (file) => readFileSync(join(dist, file), "utf8");

/** Everything the component rendered after the page's <h1>, one tag per line, config indented. */
function componentOutput(page) {
	const html = read(page);
	const snippet = html.slice(html.indexOf("</h1>") + 5, html.lastIndexOf("</body>"));
	return snippet
		.replace(/const config = (\{.*?\});/s, (_, config) => `const config = ${json(JSON.parse(config))};`)
		.replace(/\n\s*\n\s*/g, "\n")
		.replace(/\n\s+\}\)\(\);/, "\n})();")
		.replace(/><script/g, ">\n<script");
}

write("default.html", componentOutput("index.html"));
write("production.html", componentOutput("production/index.html"));

const pages = [];
const walk = (dir) => {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) walk(path);
		else if (entry.name.endsWith(".html")) pages.push(relative(dist, path));
	}
};
walk(dist);
pages.sort();

const dashboard = read("__web-vitals/index.html");
const robots = dashboard.match(/<meta name="robots"[^>]*>/)?.[0] ?? "(none)";
const dashboardScripts = [...dashboard.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
write(
	"routes.txt",
	[
		"$ astro build   # examples/demo",
		"",
		"Pages in dist/:",
		...pages.map((page) => `  ${page}${page.startsWith("__web-vitals/") ? "   <- injected by webVitalsDashboard()" : ""}`),
		"",
		"__web-vitals/index.html:",
		`  ${robots}`,
		...dashboardScripts.map((src) => `  <script type="module" src="${src}">`),
	].join("\n"),
);

// Client chunks: which ones the component's entry script imports statically (loaded with
// the page) and which ones only through dynamic import().
const assets = join(dist, "_astro");
const chunks = readdirSync(assets).filter((file) => file.endsWith(".js"));
const source = (file) => readFileSync(join(assets, file), "utf8");
const staticImports = (file) => [...source(file).matchAll(/from"\.\/([^"]+\.js)"/g)].map((m) => m[1]);
const dynamicImports = (file) => [...source(file).matchAll(/import\(`\.\/([^`]+\.js)`\)/g)].map((m) => m[1]);

const entry = read("index.html").match(/<script type="module" src="\/_astro\/([^"]+)"/)[1];
const closure = (start) => {
	const seen = new Set();
	const visit = (file) => {
		if (seen.has(file)) return;
		seen.add(file);
		staticImports(file).forEach(visit);
	};
	visit(start);
	return seen;
};
const withPage = closure(entry);
const dashboardEntry = dashboardScripts[0].replace("/_astro/", "");
const withDashboard = closure(dashboardEntry);
const dynamic = new Set([...withPage].flatMap(dynamicImports));

const size = (file) => {
	const bytes = readFileSync(join(assets, file));
	return { bytes: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
};
const loading = (file) => {
	if (withPage.has(file)) return "static";
	if (dynamic.has(file)) return "dynamic";
	if (withDashboard.has(file)) return "dashboard";
	return "other";
};
const bundle = chunks
	.map((file) => ({ file, loading: loading(file), ...size(file) }))
	.sort((a, b) => a.loading.localeCompare(b.loading) || b.bytes - a.bytes);
write("bundle.json", json({ entry, chunks: bundle }));

// ---------------------------------------------------------------- 2. page checks in jsdom
const sampleFile = "examples/pages/sample.html";
const dom = new JSDOM(readFileSync(join(root, sampleFile), "utf8"), {
	url: "https://example.com/sale/",
});
Object.assign(globalThis, { window: dom.window, document: dom.window.document });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
// jsdom has no CSS.escape; browsers do. The sample's ids need no escaping.
globalThis.CSS ??= { escape: (value) => value };

const vite = await createViteServer({
	root,
	configFile: false,
	logLevel: "silent",
	appType: "custom",
	server: { middlewareMode: true, hmr: false, ws: false },
});
try {
	const { inspectCurrentPage } = await vite.ssrLoadModule("/src/client/page-audit.ts");
	const { url, metadata, checks } = inspectCurrentPage();
	write("page-checks.json", json({ source: sampleFile, url, metadata, checks }));

	const { config } = await vite.ssrLoadModule("/src/client/config.ts");
	const { state } = await vite.ssrLoadModule("/src/client/state.ts");
	const { checkWCAG } = await vite.ssrLoadModule("/src/client/accessibility.ts");
	config.checkAccessibility = true;
	checkWCAG();
	const issues = state.wcagIssues.map(({ type, element, message, wcagLevel }) => ({
		type,
		element,
		message,
		wcagLevel,
	}));
	write("a11y-heuristic.json", json({ source: sampleFile, issues }));
} finally {
	await vite.close();
}
