# Getting Started with @casoon/astro-webvitals

## Installation

### Using pnpm (recommended)
```bash
pnpm add @casoon/astro-webvitals
```

### Using npm
```bash
npm install @casoon/astro-webvitals
```

### Using yarn
```bash
yarn add @casoon/astro-webvitals
```

## Basic Setup

### 1. Import the Component

Add the WebVitals component to your layout file (e.g., `src/layouts/Layout.astro`):

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Astro Site</title>
  </head>
  <body>
    <slot />
    
    <!-- Add WebVitals component before closing body -->
    <WebVitals />
  </body>
</html>
```

### 2. Development Setup

For development, enable the debug overlay:

```astro
<WebVitals debug={true} />
```

Or conditionally based on environment:

```astro
<WebVitals debug={import.meta.env.DEV} />
```

### 3. Production Setup

For production, configure analytics endpoint:

```astro
<WebVitals 
  endpoint="/api/analytics/vitals"
  debug={false}
/>
```

## Configuration Options

### Minimal Configuration
```astro
<WebVitals />
```
- Tracks metrics silently
- No visual overlay
- No data sending

### Development Configuration
```astro
<WebVitals 
  debug={true}
  position="bottom-right"
  trackInDev={true}
/>
```

### Production Configuration
```astro
<WebVitals 
  endpoint={import.meta.env.PUBLIC_ANALYTICS_ENDPOINT}
  sampleRate={0.1} // Track 10% of users
  batchReporting={true}
  batchInterval={5000}
/>
```

### Full Configuration
```astro
<WebVitals 
  debug={import.meta.env.DEV}
  endpoint="/api/analytics/vitals"
  position="top-right"
  trackInDev={false}
  sampleRate={1}
  batchReporting={true}
  batchInterval={5000}
  maxBatchSize={10}
  extendedMetrics={true}
  smartDetection={true}
  performanceBudget={{
    LCP: 2500,
    FID: 100,
    CLS: 0.1
  }}
  headers={{
    'X-API-Key': 'your-api-key'
  }}
  sessionId="custom-session-id"
  userId="user-123"
  accessible={true}
  ariaLabel="Performance metrics overlay"
/>
```

## TypeScript Support

The component includes full TypeScript support:

```typescript
import type { WebVitalsProps, WebVitalsMetric } from '@casoon/astro-webvitals';

// Using in API endpoint
export const POST: APIRoute = async ({ request }) => {
  const metric: WebVitalsMetric = await request.json();
  console.log(metric.name, metric.value);
  return new Response(JSON.stringify({ success: true }));
};
```

## Environment Variables

Recommended environment setup:

```env
# .env.development
PUBLIC_DEBUG_VITALS=true
PUBLIC_VITALS_POSITION=bottom-right

# .env.production
PUBLIC_ANALYTICS_ENDPOINT=https://api.example.com/vitals
PUBLIC_SAMPLE_RATE=0.1
```

Usage:

```astro
---
const debugVitals = import.meta.env.PUBLIC_DEBUG_VITALS === 'true';
const analyticsEndpoint = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT;
const sampleRate = parseFloat(import.meta.env.PUBLIC_SAMPLE_RATE || '1');
---

<WebVitals 
  debug={debugVitals}
  endpoint={analyticsEndpoint}
  sampleRate={sampleRate}
/>
```

## Next Steps

- [Learn about Core Features](./core-features.md)
- [Set up Analytics Integration](./analytics-integration.md)
- [Configure Performance Budgets](./performance-budgets.md)
- [View Examples](./examples.md)