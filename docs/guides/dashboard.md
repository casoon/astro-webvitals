---
title: Local dashboard
description: A static route that shows the metrics and page checks this browser recorded – for development and QA.
order: 4
---

The dashboard is backed only by this browser's `localStorage`. It needs no database, no server-side state and no Cloudflare binding. It is useful for development and QA, not for team-wide production analytics.

## Set up

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { webVitalsDashboard } from '@casoon/astro-webvitals/integration';

export default defineConfig({
  integrations: [webVitalsDashboard({ enabled: process.env.NODE_ENV !== 'production' })],
});
```

```astro
<WebVitals dashboard />
```

The integration injects a prerendered route at `/__web-vitals`, marked `noindex, nofollow`. Change it with `route` (it must start with `/`), or turn it off with `enabled: false` without removing the integration. The [dashboard route example](../../../showcase/dashboard-route/) shows the build output.

## What it shows

- The latest value per metric and route, from this browser, and – once a route has two or more loads – the 75th percentile and the number of loads. Google rates Core Web Vitals at the 75th percentile too, but a handful of loads from one browser is no field data. `dashboard` keeps up to 200 metrics.
- The [page checks](../accessibility/#dashboard-page-checks) for each visited page, up to 100 snapshots, as issues, recommendations, passes and checks that could not be evaluated.
- A button to clear the local history.

## Sitemap pass

**Run sitemap pass** opens every page listed in `sitemap.xml` (under the site's `base`) in the current tab, waits briefly for each page to settle, and returns to the dashboard with local measurements and page checks.

The explicitly started pass bypasses normal sampling. Consent and Do Not Track still apply. Its progress is kept in `sessionStorage` while it runs. Every page in the sitemap must render `<WebVitals dashboard />`, otherwise the pass stops there.

Measurements from one browser on one machine are not representative field data. The pass complements a build-time audit; it doesn't replace it.
