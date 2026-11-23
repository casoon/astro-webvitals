import { beforeEach, describe, expect, it } from "vitest";

import { inspectCurrentPage } from "../src/client/page-audit";

describe("page audit", () => {
	beforeEach(() => {
		document.documentElement.lang = "";
		document.head.innerHTML = "";
		document.body.innerHTML = "";
	});

	it("captures rendered metadata and lightweight page checks", () => {
		document.documentElement.lang = "en";
		document.head.innerHTML = `
      <title>Example page</title>
      <meta name="description" content="A concise page description." />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href="https://example.com/" />
      <meta property="og:title" content="Example page" />
      <meta property="og:description" content="A concise page description." />
      <meta property="og:image" content="https://example.com/og.png" />
      <script type="application/ld+json">{"@context":"https://schema.org"}</script>
    `;
		document.body.innerHTML = `
      <a href="#main">Skip to content</a>
      <main id="main"><h1>Example page</h1><img alt="Decorative detail" src="/image.png" /></main>
      <form><label for="email">Email</label><input id="email" /></form>
    `;

		const audit = inspectCurrentPage();

		expect(audit.metadata).toEqual(
			expect.objectContaining({
				title: "Example page",
				description: "A concise page description.",
				canonical: "https://example.com/",
				lang: "en",
			}),
		);
		expect(audit.checks.filter((check) => check.state === "issue")).toEqual([]);
	});

	it("flags missing audit essentials without treating absent structured data as an error", () => {
		document.body.innerHTML = "<h1>One</h1><h1>Two</h1><img src=\"/missing-alt.png\" />";

		const checks = inspectCurrentPage().checks;

		expect(checks).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "Title", state: "issue" }),
				expect.objectContaining({ name: "H1", state: "advice" }),
				expect.objectContaining({ name: "Open Graph", state: "advice" }),
				expect.objectContaining({ name: "Image alt", state: "issue" }),
				expect.objectContaining({ name: "Skip link", state: "info" }),
				expect.objectContaining({ name: "Structured data", state: "info" }),
			]),
		);
	});

	const skipLink = () =>
		inspectCurrentPage().checks.find((check) => check.name === "Skip link");

	it("accepts a skip link to any id that leads into the main landmark", () => {
		document.body.innerHTML = `
      <a href="#content">Skip to content</a>
      <div id="content"><main><h1>Page</h1></main></div>
    `;
		expect(skipLink()?.state).toBe("pass");

		document.body.innerHTML = `
      <a href="#start">Skip</a>
      <div role="main"><h1 id="start">Page</h1></div>
    `;
		expect(skipLink()?.state).toBe("pass");
	});

	it("recommends a skip link when no same-page link reaches main", () => {
		document.body.innerHTML = `
      <a href="#footer">To footer</a>
      <main><h1>Page</h1></main>
      <footer id="footer"></footer>
    `;
		expect(skipLink()?.state).toBe("advice");
	});
});
