# Enhanced features

All enhanced collection features are opt-in.

## Diagnostic attribution

`attribution` adds a compact diagnostic object to LCP, CLS and INP reports: an associated target selector, LCP resource URL, or largest layout-shift details when the browser provides them.

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

The component flushes on `visibilitychange` and prefers `sendBeacon`. The optional retry queue retains at most 50 failed entries in `localStorage`; it is disabled by default.

## Consent and browser preferences

```astro
<WebVitals
  endpoint="/api/vitals"
  consent={hasAnalyticsConsent}
  respectDnt={true}
/>
```

When `consent` is `false`, no observers or listeners are initialized. `respectDnt` additionally prevents initialization when the browser has enabled Do Not Track.
