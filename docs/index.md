---
title: Documentation
description: Measure Web Vitals on real visits to an Astro site, report them to your own endpoint, and inspect them locally while you build.
---

`@casoon/astro-webvitals` is one Astro component, `<WebVitals />`, plus an optional integration for a local dashboard. It measures LCP, CLS, INP, FCP and TTFB with Google's `web-vitals` package in the visitor's browser.

## Getting started

- [Installation](getting-started/installation/) – requirements, install, where the component goes.
- [Quickstart](getting-started/quickstart/) – from the first report to a local overlay.

## Guides

- [Reporting to an endpoint](guides/endpoint/) – payload, batching and delivery.
- [Privacy](guides/privacy/) – what is collected, where it goes, and the collection gates.
- [Accessibility checks](guides/accessibility/) – the overlay heuristic and the dashboard page checks.
- [Local dashboard](guides/dashboard/) – browser-local history, sitemap pass and page checks.
- [Diagnostics](guides/diagnostics/) – attribution, Long Tasks and reliable delivery.
- [Examples](guides/examples/) – common configurations.

## Reference

- [Options](reference/options/) – every component prop and integration option.
- [API](reference/api/) – exports, types and the browser event.

The debug overlay is a development aid. Its accessibility checks are intentionally small heuristics and are not a WCAG conformance audit.
