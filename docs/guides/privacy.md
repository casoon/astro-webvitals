---
title: Privacy
description: What the component collects, where the data goes, what it stores in the browser, and how to gate collection.
order: 2
---

The component is built so that you decide where data goes and whether it is collected at all. It is not a legal assessment: check your own requirements, for example whether you need consent for performance measurement.

## Where data goes

- Only to the `endpoint` you configure. Without `endpoint`, nothing is sent.
- The client code, `web-vitals` included, is bundled by Astro and served from your own origin. The package loads nothing from third-party servers.
- The package does not read or write cookies.

One exception applies to development only: with `debug`, the SEO inspection sends a `HEAD` request to the current page to read its `X-Robots-Tag` header.

## What is sent

Each batch contains the metrics, a session ID, the page URL (`window.location.href`, including query string and fragment), the user agent string and a timestamp. The session ID is random for each page load and not stored, unless you pass your own `sessionId`. A `userId` is only included when you pass one. See the [payload](../endpoint/#payload).

If you don't need them, drop the query string or the user agent on the server before storing.

`attribution` adds CSS selectors and resource URLs to LCP, CLS and INP reports. Review your pages before enabling it: selectors and URLs can contain personal data.

## Collection gates

`initWebVitals` checks, in this order, before it registers any observer or listener:

1. `consent` – when `false`, nothing is initialized.
2. `respectDnt` – when `true` and the browser sends Do Not Track (`navigator.doNotTrack === '1'`), nothing is initialized.
3. `sampleRate` – a random number per page load decides; only an explicitly started [sitemap pass](../dashboard/) bypasses sampling, never the two gates above.

```astro
<WebVitals
  endpoint="/api/analytics/vitals"
  sampleRate={0.1}
  consent={hasAnalyticsConsent}
  respectDnt={true}
/>
```

### Consent on static pages

`consent` is a prop, so its value is fixed where the page is rendered. On a server-rendered page you can derive it from the request, for example from a consent cookie. On a prerendered page it is fixed at build time, so a consent choice made later in the browser does not change it. For per-visitor consent, render the page on request, or render the component only when consent was given:

```astro
{hasAnalyticsConsent && <WebVitals endpoint="/api/analytics/vitals" />}
```

With `consent={false}` the scripts are still on the page and the module is loaded; it returns before collecting anything. Not rendering the component loads nothing.

## Props are public

Every prop is serialized into the page as configuration – see the [production configuration](../../../showcase/production-config/) captured from a build. Never pass secrets in `headers`, and remember that `userId` and `sessionId` are visible in the HTML.

## Browser storage

| Key | Storage | When | Limit |
| --- | --- | --- | --- |
| `casoon-webvitals-failed-metrics` | `localStorage` | `retryFailedMetrics` | 50 entries |
| `casoon-webvitals-dashboard-metrics` | `localStorage` | `dashboard` | 200 entries |
| `casoon-webvitals-dashboard-page-audits` | `localStorage` | `dashboard` | 100 entries |
| `casoon-webvitals-sitemap-pass` | `sessionStorage` | during a sitemap pass | – |

All four are off by default. The dashboard can clear its local history.
