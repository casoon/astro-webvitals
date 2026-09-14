---
title: Quickstart
description: Send your first reports, watch metrics locally, and open the overlay in development.
order: 2
---

## 1. Report to your own endpoint

```astro
<WebVitals endpoint="/api/analytics/vitals" sampleRate={0.1} />
```

`sampleRate={0.1}` initializes collection on about one in ten page loads. The decision is made in the browser for every page load.

A minimal endpoint in the same Astro project (it needs an adapter, since it runs on request):

```ts
// src/pages/api/analytics/vitals.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { metrics } = await request.json();
  for (const metric of metrics) {
    // Validate, rate-limit and store. Sum `delta` per `metric.id`.
  }
  return new Response(null, { status: 204 });
};
```

The payload and delivery rules are described in [Reporting to an endpoint](../../guides/endpoint/).

## 2. Or keep the data in the browser

Without `endpoint`, nothing is sent. Web Vitals are still dispatched as a browser event, which suits an analytics tool you already run:

```astro
<WebVitals />

<script>
  window.addEventListener('webvitals:metric', (event) => {
    const { name, value, rating } = event.detail;
    console.log(name, value, rating);
  });
</script>
```

## 3. Inspect in development

```astro
<WebVitals debug={import.meta.env.DEV} />
```

The overlay shows the current metrics, an SEO inspection and a small [accessibility heuristic](../../guides/accessibility/). `import.meta.env.DEV` keeps it out of production builds.

## 4. Optional: the local dashboard

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

Open `/__web-vitals`. See [Local dashboard](../../guides/dashboard/).

Before you collect in production, read [Privacy](../../guides/privacy/).
