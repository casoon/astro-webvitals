---
title: Examples
description: Common configurations for production, diagnosis and analytics without an endpoint.
order: 6
---

## Production endpoint

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals
  endpoint="/api/analytics/vitals"
  sampleRate={0.1}
  consent={hasAnalyticsConsent}
  respectDnt={true}
/>
```

## Diagnostic mode for selected pages

```astro
<WebVitals
  endpoint="/api/analytics/vitals"
  attribution={true}
  trackLongTasks={true}
  maxBatchSize={20}
/>
```

## Local integration without an endpoint

```astro
<WebVitals />

<script>
  window.addEventListener('webvitals:metric', (event) => {
    const metric = event.detail;
    window.gtag?.('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.delta * 1000 : metric.delta),
      metric_id: metric.id,
      metric_rating: metric.rating,
    });
  });
</script>
```

## Development only

```astro
<WebVitals debug={import.meta.env.DEV} consoleDock={import.meta.env.DEV} />
```

The [showcase](../../../showcase/) shows what these props turn into in a real build.
