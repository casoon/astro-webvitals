/**
 * SEO analysis: meta tags, headings, JSON-LD, Open Graph/Twitter cards,
 * image alt/dimensions, and indexability.
 */

import type { SeoInfo } from "./state";
import { state } from "./state";
import {
	escapeHTML,
	preserveContentScroll,
	updateDebugOverlay,
} from "./ui/debug-overlay";

export function analyzeSEO(): SeoInfo {
	const doc = document;
	const head = doc.head || doc.getElementsByTagName("head")[0];
	const getMeta = (name: string) =>
		head
			.querySelector(`meta[name="${name}"]`)
			?.getAttribute("content")
			?.trim() || "";
	const getProp = (prop: string) =>
		head
			.querySelector(`meta[property="${prop}"]`)
			?.getAttribute("content")
			?.trim() || "";

	const title = (doc.title || "").trim();
	const metaDescription = getMeta("description");
	const canonical =
		head.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
	const robotsMeta = getMeta("robots");
	const viewport = getMeta("viewport");
	const lang = doc.documentElement.getAttribute("lang") || "";
	const dir = doc.documentElement.getAttribute("dir") || "";

	const headings = Array.from(
		doc.querySelectorAll("h1, h2, h3, h4, h5, h6"),
	).map((h) => ({
		tag: h.tagName.toLowerCase(),
		text: h.textContent?.trim() || "",
		empty: !h.textContent?.trim(),
	}));
	const h1Count = headings.filter((h) => h.tag === "h1").length;
	const emptyHeadings = headings.filter((h) => h.empty);

	const ldScripts = Array.from(
		doc.querySelectorAll('script[type="application/ld+json"]'),
	);
	const ldResults = ldScripts.map((script, i) => {
		const raw = script.textContent || "";
		let parsed: any = null;
		let error = null;
		const warnings: string[] = [];
		try {
			parsed = JSON.parse(raw);
			const ctx = parsed["@context"];
			const type =
				parsed["@type"] ||
				(Array.isArray(parsed["@graph"])
					? parsed["@graph"][0]?.["@type"]
					: undefined);
			if (!ctx) warnings.push("Missing @context");
			if (!type) warnings.push("Missing @type");

			const typeLower = (Array.isArray(type) ? type[0] : type || "")
				.toString()
				.toLowerCase();
			const hasField = (key: string) =>
				parsed[key] ||
				(Array.isArray(parsed["@graph"]) &&
					parsed["@graph"].some((item: any) => item[key]));

			if (typeLower.includes("article")) {
				["headline", "image", "author"].forEach((f) => {
					if (!hasField(f)) warnings.push(`Article missing ${f}`);
				});
			}
			if (typeLower.includes("product")) {
				["name", "image", "offers"].forEach((f) => {
					if (!hasField(f)) warnings.push(`Product missing ${f}`);
				});
			}
			if (typeLower.includes("organization")) {
				["name", "logo"].forEach((f) => {
					if (!hasField(f)) warnings.push(`Organization missing ${f}`);
				});
			}
			if (typeLower.includes("website")) {
				["name", "url"].forEach((f) => {
					if (!hasField(f)) warnings.push(`WebSite missing ${f}`);
				});
			}
			if (typeLower.includes("breadcrumblist")) {
				if (!hasField("itemListElement"))
					warnings.push("BreadcrumbList missing itemListElement");
			}
		} catch (e: any) {
			error = e?.message || "Invalid JSON";
		}
		return { index: i + 1, raw, parsed, error, warnings };
	});

	const og = {
		title: getProp("og:title"),
		description: getProp("og:description"),
		image: getProp("og:image"),
		url: getProp("og:url"),
		type: getProp("og:type"),
	};

	const twitter = {
		card: getMeta("twitter:card"),
		title: getMeta("twitter:title"),
		description: getMeta("twitter:description"),
		image: getMeta("twitter:image"),
	};

	const images = Array.from(doc.querySelectorAll("img")).map((img, idx) => ({
		idx,
		src: img.getAttribute("src") || "",
		alt: img.getAttribute("alt") || "",
		width: img.getAttribute("width"),
		height: img.getAttribute("height"),
		naturalWidth: img.naturalWidth,
		naturalHeight: img.naturalHeight,
	}));

	const missingAlt = images.filter((i) => !i.alt?.trim());
	const missingDimensions = images.filter((i) => !i.width && !i.height);
	const heroMissingDimensions = !!(
		images[0] &&
		(!images[0].width || !images[0].height)
	);

	const hasNoindex = /noindex/i.test(robotsMeta || "");

	return {
		analyzedAt: new Date().toISOString(),
		title,
		metaDescription,
		canonical,
		robotsMeta,
		viewport,
		lang,
		dir,
		h1Count,
		emptyHeadings,
		headings,
		ldResults,
		og,
		twitter,
		images,
		missingAlt,
		missingDimensions,
		heroMissingDimensions,
		hasNoindex,
		xRobots: null,
		indexable: !hasNoindex,
	};
}

export function refreshSEO(): void {
	preserveContentScroll(() => {
		state.seoInfo = analyzeSEO();
		updateDebugOverlay();
	});
	fetchIndexabilityHeader();
}

export async function fetchIndexabilityHeader(): Promise<void> {
	try {
		const res = await fetch(window.location.href, { method: "HEAD" });
		const header = res.headers.get("x-robots-tag");
		if (header && state.seoInfo) {
			state.seoInfo.xRobots = header;
			if (/noindex/i.test(header)) {
				state.seoInfo.indexable = false;
			}
			updateDebugOverlay();
		}
	} catch (_e) {
		// ignore network issues
	}
}

export function formatSEOReport(): string {
	const seoInfo = state.seoInfo;
	if (!seoInfo) return "SEO report not ready";
	const lines: string[] = [];
	const yes = "✅";
	const no = "❌";
	lines.push(`SEO Report - ${new Date().toLocaleString()}`);
	lines.push("");
	lines.push(
		`Title (${seoInfo.title?.length || 0}): ${seoInfo.title || "missing"}`,
	);
	lines.push(
		`Description (${seoInfo.metaDescription?.length || 0}): ${seoInfo.metaDescription || "missing"}`,
	);
	lines.push(`Canonical: ${seoInfo.canonical || "missing"}`);
	lines.push(`Robots meta: ${seoInfo.robotsMeta || "none"}`);
	lines.push(`X-Robots-Tag: ${seoInfo.xRobots || "n/a"}`);
	lines.push(`Indexable: ${seoInfo.indexable ? yes : no}`);
	lines.push(
		`Lang: ${seoInfo.lang || "missing"} | Dir: ${seoInfo.dir || "unset"}`,
	);
	lines.push(`H1 count: ${seoInfo.h1Count}`);
	if (seoInfo.emptyHeadings?.length) {
		lines.push(`Empty headings: ${seoInfo.emptyHeadings.length}`);
	}
	lines.push("");
	lines.push("Open Graph:");
	lines.push(`  og:title: ${seoInfo.og.title || "missing"}`);
	lines.push(`  og:description: ${seoInfo.og.description || "missing"}`);
	lines.push(`  og:image: ${seoInfo.og.image || "missing"}`);
	lines.push("");
	lines.push("Twitter:");
	lines.push(`  card: ${seoInfo.twitter.card || "missing"}`);
	lines.push(`  title: ${seoInfo.twitter.title || "missing"}`);
	lines.push("");
	lines.push(`Structured data blocks: ${seoInfo.ldResults.length}`);
	seoInfo.ldResults.forEach((ld) => {
		lines.push(
			`  #${ld.index}: ${ld.error ? `${no} parse error: ${ld.error}` : "ok"}`,
		);
		if (ld.warnings?.length) {
			ld.warnings.forEach((w) => {
				lines.push(`    ⚠️ ${w}`);
			});
		}
	});
	lines.push("");
	lines.push(`Images missing alt: ${seoInfo.missingAlt.length}`);
	lines.push(`Images missing dimensions: ${seoInfo.missingDimensions.length}`);
	if (seoInfo.heroMissingDimensions)
		lines.push("Hero image missing dimensions");
	return lines.join("\n");
}

export function getSEOContent(): string {
	const seoInfo = state.seoInfo;
	if (!seoInfo) {
		return `
      <div style="padding: 20px; text-align: center; color: #9CA3AF; font-size: 11px;">
        Collecting SEO data...
      </div>
    `;
	}

	const badge = (text: string, ok = true) => `<span style="
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.05);
    color: ${ok ? "#E5E7EB" : "#F59E0B"};
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 10px;
    border: 1px solid rgba(255,255,255,0.08);
  ">${ok ? "✅" : "⚠️"} ${escapeHTML(text)}</span>`;

	const listItem = (
		label: string,
		value: string | number | undefined,
		ok = true,
	) => `
    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 11px;">
      <span style="color: #9CA3AF;">${escapeHTML(label)}</span>
      <span style="color: ${ok ? "#E5E7EB" : "#F59E0B"};">${escapeHTML(String(value || "—"))}</span>
    </div>
  `;

	const ogMissing = (["title", "description", "image"] as const).filter(
		(k) => !seoInfo.og[k],
	);
	const twMissing = (["card", "title", "description", "image"] as const).filter(
		(k) => !seoInfo.twitter[k],
	);

	const headingsOutline = seoInfo.headings
		.slice(0, 8)
		.map((h) => `${h.tag.toUpperCase()}: ${escapeHTML(h.text || "(empty)")}`)
		.join("<br>");

	return `
    <div style="display: grid; gap: 12px;">
      <div style="padding: 10px; background: rgba(31,41,55,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="color: #E5E7EB; font-weight: 600; font-size: 12px;">Indexability</div>
          <span style="
            padding: 4px 10px;
            border-radius: 999px;
            background: ${seoInfo.indexable ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"};
            color: ${seoInfo.indexable ? "#10B981" : "#EF4444"};
            font-size: 11px;
          ">${seoInfo.indexable ? "Indexable" : "Noindex"}</span>
        </div>
        ${listItem("Robots meta", seoInfo.robotsMeta || "—", !seoInfo.hasNoindex)}
        ${listItem("X-Robots-Tag", seoInfo.xRobots || "—", seoInfo.xRobots ? !/noindex/i.test(seoInfo.xRobots) : true)}
        ${listItem("Canonical", seoInfo.canonical || "—", !!seoInfo.canonical)}
      </div>

      <div style="padding: 10px; background: rgba(31,41,55,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #E5E7EB; font-weight: 600; font-size: 12px; margin-bottom: 8px;">Basics</div>
        ${listItem("Title", seoInfo.title || "Missing", !!seoInfo.title)}
        ${listItem("Title length", `${seoInfo.title?.length || 0} chars`, seoInfo.title?.length >= 30 && seoInfo.title?.length <= 65)}
        ${listItem("Description", seoInfo.metaDescription || "Missing", !!seoInfo.metaDescription)}
        ${listItem("Description length", `${seoInfo.metaDescription?.length || 0} chars`, seoInfo.metaDescription?.length >= 50 && seoInfo.metaDescription?.length <= 160)}
        ${listItem("Viewport", seoInfo.viewport || "Missing", !!seoInfo.viewport)}
        ${listItem("Lang / Dir", `${seoInfo.lang || "missing"} / ${seoInfo.dir || "unset"}`, !!seoInfo.lang)}
      </div>

      <div style="padding: 10px; background: rgba(31,41,55,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #E5E7EB; font-weight: 600; font-size: 12px; margin-bottom: 8px;">Headings</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
          ${badge(`H1 count: ${seoInfo.h1Count}`, seoInfo.h1Count === 1)}
          ${seoInfo.emptyHeadings.length ? badge(`Empty headings: ${seoInfo.emptyHeadings.length}`, false) : ""}
        </div>
        <div style="color: #9CA3AF; font-size: 10px; line-height: 1.5;">${headingsOutline || "No headings found"}</div>
      </div>

      <div style="padding: 10px; background: rgba(31,41,55,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #E5E7EB; font-weight: 600; font-size: 12px; margin-bottom: 8px;">Open Graph / Twitter</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
          ${badge("OG title", !!seoInfo.og.title)}
          ${badge("OG desc", !!seoInfo.og.description)}
          ${badge("OG image", !!seoInfo.og.image)}
          ${badge("Twitter card", !!seoInfo.twitter.card)}
          ${badge("Twitter title", !!seoInfo.twitter.title)}
        </div>
        ${ogMissing.length || twMissing.length ? `<div style="color: #F59E0B; font-size: 10px;">Missing: ${[...ogMissing, ...twMissing].join(", ")}</div>` : ""}
      </div>

      <div style="padding: 10px; background: rgba(31,41,55,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="color: #E5E7EB; font-weight: 600; font-size: 12px;">Structured Data</div>
          <span style="color: #9CA3AF; font-size: 10px;">${seoInfo.ldResults.length} block(s)</span>
        </div>
        ${
					seoInfo.ldResults.length === 0
						? `
          <div style="color: #9CA3AF; font-size: 11px;">No JSON-LD blocks found.</div>
        `
						: `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${seoInfo.ldResults
							.slice(0, 3)
							.map(
								(ld) => `
              <div style="
                padding: 8px;
                background: rgba(255,255,255,0.04);
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.06);
                color: ${ld.error ? "#F59E0B" : "#E5E7EB"};
                font-size: 11px;
              ">
                #${ld.index}: ${ld.error ? `Parse error: ${escapeHTML(ld.error)}` : "Valid JSON"}
                ${ld.warnings?.length ? `<div style="color: #F59E0B; font-size: 10px; margin-top: 4px;">Warnings: ${ld.warnings.map(escapeHTML).join(", ")}</div>` : ""}
              </div>
            `,
							)
							.join("")}
            ${seoInfo.ldResults.length > 3 ? `<div style="color: #6B7280; font-size: 10px;">+ ${seoInfo.ldResults.length - 3} more</div>` : ""}
          </div>
        `
				}
      </div>

      <div style="padding: 10px; background: rgba(31,41,55,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="color: #E5E7EB; font-weight: 600; font-size: 12px;">Images</div>
          <span style="color: #9CA3AF; font-size: 10px;">${seoInfo.images.length} found</span>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;">
          ${badge(`Missing alt: ${seoInfo.missingAlt.length}`, seoInfo.missingAlt.length === 0)}
          ${badge(`Missing dimensions: ${seoInfo.missingDimensions.length}`, seoInfo.missingDimensions.length === 0)}
          ${badge("Hero dims ok", !seoInfo.heroMissingDimensions)}
        </div>
        ${
					seoInfo.missingAlt.length || seoInfo.missingDimensions.length
						? `
          <div style="color: #9CA3AF; font-size: 10px;">First few issues:</div>
          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            ${seoInfo.missingAlt
							.slice(0, 2)
							.map(
								(img) => `
              <div style="font-size: 10px; color: #F59E0B;">#${img.idx + 1} missing alt (${escapeHTML(img.src || "src?")})</div>
            `,
							)
							.join("")}
            ${seoInfo.missingDimensions
							.slice(0, 2)
							.map(
								(img) => `
              <div style="font-size: 10px; color: #F59E0B;">#${img.idx + 1} missing width/height (${escapeHTML(img.src || "src?")})</div>
            `,
							)
							.join("")}
          </div>
        `
						: ""
				}
      </div>

      <div style="padding: 10px; background: rgba(31,41,55,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); display: flex; gap: 8px; align-items: center; justify-content: space-between;">
        <div style="color: #9CA3AF; font-size: 11px;">Copy a shareable SEO report</div>
        <button onclick="window.copySEOReport()" style="
          background: #4B5563;
          border: 1px solid #6B7280;
          color: #E5E7EB;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
        ">Copy SEO Report</button>
      </div>
    </div>
  `;
}
