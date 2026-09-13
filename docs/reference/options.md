---
title: Options
description: Every prop of the WebVitals component and every option of the dashboard integration.
order: 1
---

## `<WebVitals />` props

### Collection and reporting

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | – | Same-origin or CORS-enabled URL that receives POST batches. Without it, nothing is sent. |
| `sampleRate` | `number` | `1` | Fraction of page loads that collect, from 0 to 1. Values outside are clamped; a non-finite value becomes 1. |
| `batchReporting` | `boolean` | `true` | Collect metrics and send them together. |
| `batchInterval` | `number` | `5000` | Milliseconds between batch sends. |
| `maxBatchSize` | `number` | `10` | Entries that trigger an immediate send. Rounded down, at least 1. |
| `headers` | `Record<string, string>` | `{}` | Extra request headers; switches from `sendBeacon` to `fetch`. Public – never put secrets here. |
| `sessionId` | `string` | random per page load | Session ID in the payload. |
| `userId` | `string` | – | User ID in the payload. |
| `retryFailedMetrics` | `boolean` | `false` | Keep up to 50 failed entries in `localStorage` and retry on a later page load. |
| `attribution` | `boolean` | `false` | Add diagnostic context to LCP, CLS and INP reports. |
| `trackLongTasks` | `boolean` | `false` | Report main-thread tasks of 50ms or longer as `LongTask`. |
| `trackSoftNavigations` | `boolean` | `false` | Include experimental browser-detected soft navigations. |
| `trackInDev` | `boolean` | `false` | Render the component in `astro dev` as well. |

### Privacy gates

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `consent` | `boolean` | `true` | When `false`, the client initializes nothing. |
| `respectDnt` | `boolean` | `false` | Initialize nothing when the browser sends Do Not Track. |

See [Privacy](../../guides/privacy/) for how the gates behave on static pages.

### Local dashboard

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `dashboard` | `boolean` | `false` | Store the last 200 metrics and page-check snapshots in `localStorage` for the dashboard. |

### Development

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `debug` | `boolean` | `false` | Overlay with live metrics, SEO inspection and console viewer. |
| `checkAccessibility` | `boolean` | value of `debug` | Run the [accessibility heuristic](../../guides/accessibility/). |
| `highlightAccessibility` | `boolean` | `false` | Outline elements the heuristic reports. |
| `consoleDock` | `boolean` | `false` | Resizable console viewer docked at the bottom of the page. |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Overlay position on desktop. |
| `performanceBudget` | `{ LCP?, CLS?, FCP?, TTFB?, INP? }` | `2500`, `0.1`, `1800`, `800`, `200` | Thresholds for the overlay indicators only. |
| `extendedMetrics` | `boolean` | `false` | Show browser memory and network information in the overlay, where supported. |
| `smartDetection` | `boolean` | `false` | Kept for compatibility; currently has no effect. |

In `astro dev` the component renders only with `trackInDev`, `debug`, `consoleDock`, `highlightAccessibility` or `dashboard`. In a production build it always renders.

## `webVitalsDashboard()` options

```ts
import { webVitalsDashboard } from '@casoon/astro-webvitals/integration';
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `route` | `string` | `'/__web-vitals'` | Path of the injected dashboard. Must start with `/`, otherwise the integration throws. |
| `enabled` | `boolean` | `true` | `false` skips the route without removing the integration. |
