import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { readBridgedConfig, serializeBridgedConfig } from "../src/client/bridge";
import type { BridgedConfig } from "../src/client/config";
import { bindActions } from "../src/client/ui/actions";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "../src");

const bridged = {
	debug: false,
	endpoint: "/api/</script><script>alert(1)</script>",
	headers: { "x-note": "a & b > c \u2028 d" },
	sampleRate: 1,
} as unknown as BridgedConfig;

function renderConfigElement(json: string) {
	const element = document.createElement("script");
	element.type = "application/json";
	element.setAttribute("data-astro-webvitals-config", "");
	element.textContent = json;
	document.body.appendChild(element);
}

describe("config bridge", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("serializes without characters that could leave the <script> element", () => {
		const json = serializeBridgedConfig(bridged);
		expect(json).not.toMatch(/[<>&\u2028\u2029]/);
		expect(JSON.parse(json)).toEqual(bridged);
	});

	it("reads the last rendered config, like the former inline script", () => {
		renderConfigElement(serializeBridgedConfig({ ...bridged, debug: true }));
		renderConfigElement(serializeBridgedConfig(bridged));
		expect(readBridgedConfig()).toEqual(bridged);
	});

	it("returns undefined without a rendered config", () => {
		expect(readBridgedConfig()).toBeUndefined();
	});
});

describe("CSP-safe markup", () => {
	it("ships no inline executable scripts or event-handler attributes", () => {
		const files = (dir: string): string[] =>
			readdirSync(dir).flatMap((name) => {
				const path = join(dir, name);
				return statSync(path).isDirectory() ? files(path) : [path];
			});
		const offenders = files(srcDir).filter((file) => {
			const source = readFileSync(file, "utf8");
			return /\bis:inline\b|define:vars|\son[a-z]+=["']/.test(source);
		});
		expect(offenders).toEqual([]);
	});

	it("dispatches data-webvitals-action clicks to the innermost handler", () => {
		const root = document.createElement("div");
		root.innerHTML = `
			<div data-webvitals-action="outer">
				<button data-webvitals-action="inner" data-webvitals-arg="seo">x</button>
			</div>`;
		document.body.appendChild(root);
		const outer = vi.fn();
		const inner = vi.fn();
		bindActions(root, { outer, inner });

		root.querySelector("button")?.click();

		expect(inner).toHaveBeenCalledWith("seo");
		expect(outer).not.toHaveBeenCalled();
	});
});
