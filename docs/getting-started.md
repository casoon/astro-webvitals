# Getting started

Install the package and add it once to your shared Astro layout, near the end of `body`.

```bash
pnpm add @casoon/astro-webvitals
```

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals endpoint="/api/analytics/vitals" sampleRate={0.1} />
```

For local diagnosis, enable the overlay only in development:

```astro
<WebVitals debug={import.meta.env.DEV} />
```

## Local dashboard

The optional dashboard stores up to 200 metrics in this browser's `localStorage`. It needs no Cloudflare binding, database, or server-side state.

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

Open `/__web-vitals` to inspect or clear the local history. **Run sitemap pass** opens each `/sitemap.xml` page sequentially in the current tab, then returns with locally captured measurements. The explicitly started pass bypasses normal sampling, but never the consent or Do Not Track gates. This is a developer/QA tool, not shared or representative analytics.

Production collection is consent-aware when configured:

```astro
<WebVitals
  endpoint="/api/analytics/vitals"
  sampleRate={0.1}
  consent={hasAnalyticsConsent}
  respectDnt={true}
  attribution={false}
/>
```

See the package README for the complete API and payload schema.
