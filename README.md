# @casoon/astro-webvitals

Lightweight Real User Monitoring (RUM) for Astro. It measures the official Web Vitals in the browser, optionally sends batched reports to an endpoint, and includes a development-only debug overlay.

Supports Astro v4–v7.

## What it measures

- Core Web Vitals: LCP, CLS, INP
- Supporting metrics: FCP, TTFB
- Navigation timings: DNS, TCP, DOM, LOAD
- Optional Long Tasks (50ms or longer)
- Optional diagnostic attribution for LCP, CLS and INP

The production path does not initialize the overlay, console capture, SEO inspection, or accessibility heuristic.

## Install

```bash
pnpm add @casoon/astro-webvitals
```

## Use

Add the component once to a shared layout, immediately before `</body>`.

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals endpoint="/api/analytics/vitals" sampleRate={0.1} />
```

## Local dashboard

The optional dashboard is a static Astro route backed only by this browser's `localStorage`; it needs neither Cloudflare nor a database. It is useful for development and QA, not for team-wide production analytics.

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { webVitalsDashboard } from '@casoon/astro-webvitals/integration';

export default defineConfig({
  integrations: [webVitalsDashboard()],
});
```

```astro
<WebVitals endpoint="/api/analytics/vitals" dashboard />
```

Open `/__web-vitals`. It shows the latest metric per route from this browser and can clear that local history. **Run sitemap pass** opens every page listed in `/sitemap.xml` in the current tab, waits briefly for each page to settle, and returns to the dashboard with local QA measurements. It deliberately bypasses normal sampling for that explicitly started pass, while consent and Do Not Track still apply. This is not representative field data. Use `webVitalsDashboard({ route: '/internal/web-vitals', enabled: process.env.NODE_ENV !== 'production' })` to change or disable the injected route.

For local diagnosis:

```astro
<WebVitals debug={import.meta.env.DEV} />
```

## Reporting payload

Metrics are sent as a batch. `id` identifies one metric instance; aggregate `delta` values with the same `id` rather than treating repeated values as separate visits.

```ts
{
  metrics: [{
    name: 'LCP',
    value: 1840,
    delta: 1840,
    id: 'v4-…',
    rating: 'good',
    navigationType: 'navigate',
    timestamp: 1765900000000,
    attribution: { target: 'main > img.hero' } // only when enabled
  }],
  sessionId: 'session_…',
  userId: 'optional-user-id',
  timestamp: 1765900000100,
  url: 'https://example.com/',
  userAgent: '…'
}
```

The client flushes when a page becomes hidden and uses `sendBeacon` when possible. Custom request headers require `fetch` instead.

## Options

| Prop | Default | Description |
| --- | --- | --- |
| `debug` | `false` | Development overlay, SEO inspection and console viewer. |
| `endpoint` | — | Same-origin or CORS-enabled reporting endpoint. |
| `sampleRate` | `1` | Fraction from 0 to 1; clamped at runtime. |
| `batchReporting` / `batchInterval` | `true` / `5000` | Reporting batch behavior. |
| `maxBatchSize` | `10` | Maximum entries before a batch flushes. |
| `attribution` | `false` | Add privacy-safe diagnostic context to vital reports. |
| `trackLongTasks` | `false` | Report supported Long Task entries. |
| `trackSoftNavigations` | `false` | Include experimental browser-detected soft navigations. |
| `retryFailedMetrics` | `false` | Store up to 50 failed entries in `localStorage` for a later retry. |
| `consent` | `true` | Explicit collection gate. `false` prevents initialization. |
| `dashboard` | `false` | Store the last 200 metrics in browser-local storage for the optional dashboard. |
| `respectDnt` | `false` | Prevent initialization when `navigator.doNotTrack === '1'`. |
| `checkAccessibility` | `debug` | Run the small, development-only accessibility heuristic. |
| `highlightAccessibility` | `false` | Highlight heuristic findings. |
| `consoleDock` | `false` | Show a development console dock. |
| `position` | `bottom-right` | Desktop overlay position. |

`performanceBudget` changes debug-overlay indicators only. `extendedMetrics` exposes browser memory/network information in that overlay when supported. `smartDetection` is retained for compatibility but currently has no runtime effect.

## Browser events

Every reported metric is also emitted locally. This is useful for analytics integrations that should not use an HTTP endpoint.

```ts
window.addEventListener('webvitals:metric', (event) => {
  const metric = (event as CustomEvent).detail;
  console.log(metric.name, metric.value, metric.rating);
});
```

## Privacy and security

Use `consent` or `respectDnt` where required. Do not put secrets in `headers`: Astro serializes component props into the browser, so such values are public. Prefer a same-origin endpoint protected by normal session cookies.

The optional retry queue and attribution data should be enabled only after reviewing your privacy requirements.

## Development

```bash
pnpm run type-check
pnpm run check
pnpm pack
```

## License

MIT © CASOON
