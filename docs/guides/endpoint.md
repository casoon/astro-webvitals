---
title: Reporting to an endpoint
description: What the endpoint receives, how batches are delivered, and how to aggregate repeated reports.
order: 1
---

Configure a same-origin endpoint whenever possible.

```astro
<WebVitals endpoint="/api/analytics/vitals" sampleRate={0.1} />
```

## Payload

Every request carries one report: the metrics of one page.

```ts
type Report = {
  reportId: string;    // unique per report, unchanged when the report is retried
  metrics: Metric[];
  sessionId: string;   // random per page load unless you pass `sessionId`
  userId?: string;     // only when you pass `userId`
  timestamp: number;   // when the report was built
  url: string;         // page of the metrics: origin + path, full URL with `fullUrl`
  userAgent?: string;  // only with `includeUserAgent`
};

type Metric = {
  name: string;        // LCP, CLS, INP, FCP, TTFB, DNS, TCP, DOM, LOAD, LongTask
  value: number;       // milliseconds; CLS is unitless
  delta: number;
  id: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
  attribution?: {      // only with `attribution`
    target?: string;
    url?: string;
    largestShiftTime?: number;
    largestShiftValue?: number;
    interactionType?: string;
  };
  url: string;         // same as the report's url
  timestamp: number;
};
```

`LongTask` entries appear only with `trackLongTasks`. The type is exported as `WebVitalsReport`.

## Aggregate by `id`, deduplicate by `reportId`

CLS and INP can be reported more than once for one page visit. Keep `id` and `delta`: if your backend cannot overwrite a previous value for the same `id`, sum the deltas per `id`.

A retried report arrives with the same `reportId`. Store the IDs you have accepted for a day and answer a repeat with `204` without storing it again.

## Which page a metric belongs to

Metrics belong to the page that was loaded, as in Chrome's field data (CrUX): with Astro's ClientRouter, CLS and INP keep accumulating across client-side navigations and are reported for the landing page. Only with `trackSoftNavigations`, in browsers that report soft navigations, do metrics carry the URL of the navigated-to page. A batch never mixes URLs; metrics of different pages go out as separate reports.

## Delivery

- With `batchReporting` (default) metrics are collected and sent every `batchInterval` milliseconds (default 5000), or as soon as `maxBatchSize` entries (default 10) are waiting, and before a ClientRouter navigation.
- While the page is visible, reports go out with `fetch` (`keepalive`), and the response status is checked.
- When the page becomes hidden (`visibilitychange`) or on `pagehide`, the rest is sent with `navigator.sendBeacon`, because no response can be read at that point anyway. A queued beacon is not a confirmed delivery. With custom `headers` the client uses `fetch` here too, because beacons cannot carry headers.
- With `batchReporting={false}` every metric is sent on its own.
- A network error, HTTP 408, 429 or 5xx, or a refused beacon count as temporary failures; any other non-2xx status means the endpoint rejected the report, and it is not sent again. Temporary failures are dropped unless `retryFailedMetrics` is on, see [Diagnostics](../diagnostics/#reliable-delivery).

## An Astro endpoint

The route runs on request, so the project needs an adapter.

```ts
// src/pages/api/analytics/vitals.ts
import type { APIRoute } from 'astro';
import type { WebVitalsReport } from '@casoon/astro-webvitals';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const report = (await request.json()) as WebVitalsReport;
  // Skip reports you already stored (same reportId), then:

  for (const metric of report.metrics) {
    // Validate, rate-limit and persist the metric server-side.
  }

  return new Response(null, { status: 204 });
};
```

Do not use client-side API keys or bearer tokens in `headers`; all component props are visible to visitors. Authenticate a same-origin endpoint with an existing session, or forward to a third-party service on the server.

## Browser event

Web Vitals and `LongTask` entries are also dispatched on `window`, with or without an endpoint:

```ts
window.addEventListener('webvitals:metric', (event) => {
  const metric = (event as CustomEvent).detail;
  console.log(metric.name, metric.value, metric.rating);
});
```

Navigation timings (DNS, TCP, DOM, LOAD) are reported to the endpoint but not dispatched as events.
