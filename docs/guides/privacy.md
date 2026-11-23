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

Each report contains the metrics, a report ID, a session ID, the page URL and a timestamp. The session ID is random for each page load and not stored, unless you pass your own `sessionId`. A `userId` is only included when you pass one. See the [payload](../endpoint/#payload).

The page URL is origin and path only: query strings and fragments often carry search terms, tokens or campaign IDs, so they are dropped in the browser. Set `fullUrl` if you need them. The user agent string is only added with `includeUserAgent`.

`attribution` adds CSS selectors and resource URLs to LCP, CLS and INP reports; resource URLs lose their query string as well unless `fullUrl` is set. Review your pages before enabling it: selectors can contain personal data.

## Collection gates

The client checks, in this order, before it registers any observer:

1. Consent – the `consent` prop, or the last `setWebVitalsConsent()` call in this document, which wins over the prop.
2. `respectDnt` – when `true` and the browser sends Do Not Track (`navigator.doNotTrack === '1'`) or Global Privacy Control (`navigator.globalPrivacyControl === true`), nothing is collected.
3. `sampleRate` – a random number per page load decides; only an explicitly started [sitemap pass](../dashboard/) bypasses sampling, never the two gates above.

The gates are checked again after every navigation with Astro's ClientRouter, with the props rendered on the new page.

```astro
<WebVitals
  endpoint="/api/analytics/vitals"
  sampleRate={0.1}
  consent={hasAnalyticsConsent}
  respectDnt={true}
/>
```

### Consent at runtime

On a prerendered page the `consent` prop is fixed at build time. Render the component with `consent={false}` and pass the visitor's choice from your consent manager:

```astro
<WebVitals endpoint="/api/analytics/vitals" consent={false} />

<script>
  import { setWebVitalsConsent } from '@casoon/astro-webvitals/consent';

  // Call it on every full page load, e.g. from your consent manager's ready callback.
  setWebVitalsConsent(hasAnalyticsConsent());
</script>
```

- `setWebVitalsConsent(true)` starts collection, subject to `respectDnt` and `sampleRate`. It may run before the component's script; the choice is picked up on start.
- `setWebVitalsConsent(false)` stops recording and sending at once, deletes buffered metrics and reports queued for retry, and removes the debug overlay. Web Vitals observers cannot be unregistered; what they report afterwards is dropped.
- The choice is not stored by the package and lasts for the current document, ClientRouter navigations included. Your consent manager remains the source of truth.

On a server-rendered page you can also derive the prop from the request, for example from a consent cookie. With `consent={false}` the scripts are on the page and the module is loaded, but it collects nothing. Not rendering the component loads nothing.

The [live demo](../../../demo/) starts without consent and shows the reports it sends after you allow measurement.

## Props are public

Every prop is serialized into the page as configuration – see the [production configuration](../../../showcase/production-config/) captured from a build. Never pass secrets in `headers`, and remember that `userId` and `sessionId` are visible in the HTML.

## Browser storage

| Key | Storage | When | Limit |
| --- | --- | --- | --- |
| `casoon-webvitals-failed-reports` | `localStorage` | `retryFailedMetrics` | 20 reports, 24 hours |
| `casoon-webvitals-dashboard-metrics` | `localStorage` | `dashboard` | 200 entries |
| `casoon-webvitals-dashboard-page-audits` | `localStorage` | `dashboard` | 100 entries |
| `casoon-webvitals-sitemap-pass` | `sessionStorage` | during a sitemap pass | – |

All four are off by default. The dashboard can clear its local history.
