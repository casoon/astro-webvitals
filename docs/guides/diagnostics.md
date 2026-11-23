---
title: Diagnostics
description: Opt-in attribution, Long Tasks and a retry queue for failed reports.
order: 5
---

All enhanced collection features are opt-in.

## Diagnostic attribution

`attribution` adds a compact diagnostic object to LCP, CLS and INP reports: an associated target selector, LCP resource URL, or largest layout-shift details when the browser provides them. It loads the attribution build of `web-vitals` instead of the standard one.

```astro
<WebVitals endpoint="/api/vitals" attribution={true} />
```

Treat selectors and URLs as telemetry data. Do not enable this blindly on pages that expose personal data in attributes or URLs.

## Long Tasks

```astro
<WebVitals endpoint="/api/vitals" trackLongTasks={true} />
```

Supported browsers report individual main-thread tasks of at least 50ms as `LongTask` entries. This is diagnostic data, not a Core Web Vital.

## Reliable delivery

```astro
<WebVitals
  endpoint="/api/vitals"
  batchReporting={true}
  batchInterval={5000}
  maxBatchSize={20}
  retryFailedMetrics={true}
/>
```

The component flushes on `visibilitychange`, `pagehide` and before ClientRouter navigations; see [Delivery](../endpoint/#delivery) for when it uses `fetch` and when `sendBeacon`.

The optional retry queue is disabled by default. With it, a report that failed temporarily (network error, HTTP 408, 429 or 5xx, refused beacon) is stored unchanged in `localStorage` – with its original page URL, session and `reportId` – and sent again after 5 seconds, then after 20 seconds, on the same page or a later page load. After three attempts in all, or after 24 hours, it is dropped. At most 20 reports are kept. A report the endpoint rejected with another status is not retried. Withdrawing consent deletes the queue.

## Soft navigations

`trackSoftNavigations` includes soft navigations reported by the browser, an experimental feature of `web-vitals`; their metrics carry the URL of the navigated-to page. Leave it off unless you are testing it.

Astro's ClientRouter works without it: the component runs once per document, re-reads its props from each new page, re-checks consent and moves the debug overlay and console dock onto the new page.

Consent and Do Not Track are covered in [Privacy](../privacy/).
