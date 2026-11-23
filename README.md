# @casoon/astro-webvitals

Lightweight Real User Monitoring (RUM) for Astro. It measures the official Web Vitals in the browser, optionally sends batched reports to an endpoint, and includes a development-only debug overlay.

**Website and documentation:** [casoon.github.io/astro-webvitals](https://casoon.github.io/astro-webvitals/)

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

Each report holds the metrics of one page with origin and path (no query string, no user agent unless you opt in), a session ID and a `reportId` that stays the same when a failed report is retried.

## Consent

Render the component with `consent={false}` and pass the visitor's choice at runtime:

```ts
import { setWebVitalsConsent } from '@casoon/astro-webvitals/consent';

setWebVitalsConsent(true); // false stops collection and deletes queued reports
```

## Learn more

- [Live demo](https://casoon.github.io/astro-webvitals/demo/) – the package running in the page, with the reports it sends
- [Reporting to an endpoint](https://casoon.github.io/astro-webvitals/docs/guides/endpoint/) – payload, delivery, retries, an Astro endpoint
- [Privacy and consent](https://casoon.github.io/astro-webvitals/docs/guides/privacy/) – what is sent and stored, collection gates
- [Local dashboard](https://casoon.github.io/astro-webvitals/docs/guides/dashboard/) and [debug overlay](https://casoon.github.io/astro-webvitals/docs/guides/accessibility/) – for development and QA
- [All options](https://casoon.github.io/astro-webvitals/docs/reference/options/)

Works with Astro `security.csp` without `'unsafe-inline'`. All props are serialized into the page: never put secrets in `headers`.

## Development

```bash
pnpm run check
pnpm run type-check
pnpm test
```

## License

MIT © CASOON
