---
title: API
description: Package exports, TypeScript types, the browser event and runtime globals.
order: 2
---

Published on npm as [`@casoon/astro-webvitals`](https://www.npmjs.com/package/@casoon/astro-webvitals). The package ships its TypeScript sources; there is no separate API site. The props are documented in [Options](../options/).

## Entry points

| Import | Exports |
| --- | --- |
| `@casoon/astro-webvitals` | `WebVitals`, `webVitalsDashboard`, types |
| `@casoon/astro-webvitals/WebVitals.astro` | the component as default export |
| `@casoon/astro-webvitals/integration` | `webVitalsDashboard`, `WebVitalsDashboardOptions` |

Import the integration from `/integration` in `astro.config`, so the config doesn't load the `.astro` component.

## Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `WebVitals` | Astro component | Measures and reports; add once per page, before `</body>`. |
| `webVitalsDashboard(options?)` | Astro integration | Injects the [local dashboard](../../guides/dashboard/) route. |
| `WebVitalsProps` | type | Props of `WebVitals`. |
| `WebVitalsMetric` | type | One reported metric: `name`, `value`, `delta`, `id`, `rating`, `navigationType`, `attribution`, `url`, `timestamp`, `userAgent`. |
| `PerformanceBudget` | type | Overlay thresholds for LCP, CLS, FCP, TTFB and INP. |
| `ExtendedMetrics` | type | Memory and connection information shown by the overlay. |
| `WebVitalsDashboardOptions` | type | `route` and `enabled`, see [Options](../options/#webvitalsdashboard-options). |

```ts
import type { WebVitalsMetric } from '@casoon/astro-webvitals';
```

## Browser event

`webvitals:metric` is dispatched on `window` for every Web Vital and `LongTask` entry, with or without an endpoint. Navigation timings (DNS, TCP, DOM, LOAD) are reported to the endpoint only.

```ts
window.addEventListener('webvitals:metric', (event) => {
  const metric = (event as CustomEvent).detail;
  console.log(metric.name, metric.value, metric.rating);
});
```

The request payload is described in [Reporting to an endpoint](../../guides/endpoint/#payload).

## Runtime globals

| Global | Set by | Purpose |
| --- | --- | --- |
| `window.__WEBVITALS_CONFIG__` | the component's inline script | Resolved props, read by the client module. |
| `window.__CASOON_WEBVITALS_INITIALIZED__` | the client | Prevents a second initialization when the component renders twice. |
