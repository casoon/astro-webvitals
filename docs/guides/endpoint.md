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

Every request carries a batch:

```ts
type Payload = {
  metrics: Metric[];
  sessionId: string;   // random per page load unless you pass `sessionId`
  userId?: string;     // only when you pass `userId`
  timestamp: number;   // when the batch was sent
  url: string;         // window.location.href
  userAgent: string;
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
  timestamp: number;
};
```

`LongTask` entries appear only with `trackLongTasks`.

## Aggregate by `id`

CLS and INP can be reported more than once for one page visit. Keep `id` and `delta`: if your backend cannot overwrite a previous value for the same `id`, sum the deltas per `id`.

## Delivery

- With `batchReporting` (default) metrics are collected and sent every `batchInterval` milliseconds (default 5000), or as soon as `maxBatchSize` entries (default 10) are waiting.
- The batch is flushed when the page becomes hidden (`visibilitychange`) and on `pagehide`.
- Requests use `navigator.sendBeacon` where available. With custom `headers` the client uses `fetch` with `keepalive` instead, because beacons cannot carry headers.
- With `batchReporting={false}` every metric is sent on its own.
- A failed `fetch` is dropped unless `retryFailedMetrics` is on, see [Diagnostics](../diagnostics/).

## An Astro endpoint

The route runs on request, so the project needs an adapter.

```ts
// src/pages/api/analytics/vitals.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const payload = (await request.json()) as { metrics: Metric[] };

  for (const metric of payload.metrics) {
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
