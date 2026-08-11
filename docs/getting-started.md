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
