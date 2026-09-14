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

- The latest value per metric and route, from this browser. `dashboard` keeps up to 200 metrics.
- The [page checks](../accessibility/#dashboard-page-checks) for each visited page, up to 100 snapshots.
- A button to clear the local history.

## Sitemap pass

**Run sitemap pass** opens every page listed in `/sitemap.xml` in the current tab, waits briefly for each page to settle, and returns to the dashboard with local measurements and page checks.

The explicitly started pass bypasses normal sampling. Consent and Do Not Track still apply. Its progress is kept in `sessionStorage` while it runs.

Measurements from one browser on one machine are not representative field data. The pass complements a build-time audit; it doesn't replace it.
