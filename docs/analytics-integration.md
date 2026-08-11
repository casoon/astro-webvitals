# Analytics integration

Configure a same-origin endpoint whenever possible.

```astro
<WebVitals endpoint="/api/analytics/vitals" sampleRate={0.1} />
```

The endpoint receives a batch of entries. Keep `id` and `delta`: CLS and INP can be reported more than once for one page visit, and deltas with the same ID must be summed when your backend cannot overwrite a prior value.

```ts
type Metric = {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
  attribution?: Record<string, string | number | undefined>;
  timestamp: number;
};
```

```ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json() as { metrics: Metric[] };

  for (const metric of payload.metrics) {
    // Validate, rate-limit and persist the metric server-side.
    console.log(metric.id, metric.name, metric.delta);
  }

  return new Response(null, { status: 204 });
};
```

Do not use client-side API keys or bearer tokens in `headers`; all component props are visible to visitors. Authenticate a same-origin endpoint with an existing session or perform third-party forwarding on the server.
