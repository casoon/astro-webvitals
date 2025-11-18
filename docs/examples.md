# Examples

## Basic Examples

### Minimal Setup
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals />
```

### Development with Debug
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals debug={true} position="bottom-right" />
```

### Production with Analytics
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals 
  endpoint="/api/analytics/vitals"
  sampleRate={0.1}
/>
```

## Advanced Examples

### E-commerce Site
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';

// Track all users on product pages, sample on others
const isProductPage = Astro.url.pathname.startsWith('/product/');
const sampleRate = isProductPage ? 1 : 0.1;

// Stricter budgets for product pages
const budgets = isProductPage ? {
  LCP: 2000,  // 2s max for product images
  FID: 50,    // Super responsive for add to cart
  CLS: 0.05   // Minimal layout shift
} : {
  LCP: 3000,
  FID: 100,
  CLS: 0.1
};
---

<WebVitals 
  endpoint="/api/analytics/vitals"
  sampleRate={sampleRate}
  performanceBudget={budgets}
  extendedMetrics={true}
  smartDetection={true}
  onBudgetExceeded={(metric, value, budget) => {
    // Log to error tracking
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage(`Performance budget exceeded on ${location.pathname}`, {
        level: 'warning',
        extra: { metric, value, budget }
      });
    }
  }}
/>
```

### Blog with User Tracking
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';

// Get user ID from cookie or localStorage
const getUserId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId') || 'anonymous';
  }
  return 'anonymous';
};
---

<WebVitals 
  endpoint="/api/analytics/vitals"
  userId={getUserId()}
  batchReporting={true}
  batchInterval={10000}
  headers={{
    'X-Blog-Version': '2.0.0'
  }}
/>
```

### SPA with Route Changes
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals 
  endpoint="/api/analytics/vitals"
  extendedMetrics={true}
/>

<script>
  // Re-measure on route changes for SPAs
  let previousUrl = '';
  
  const observer = new MutationObserver(() => {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      
      // Trigger new measurements
      if (window.webVitals) {
        window.webVitals.reset();
      }
    }
  });
  
  observer.observe(document, { subtree: true, childList: true });
</script>
```

### Multi-tenant Application
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';

// Get tenant from subdomain
const tenant = Astro.url.hostname.split('.')[0];
const apiKey = import.meta.env[`PUBLIC_API_KEY_${tenant.toUpperCase()}`];
---

<WebVitals 
  endpoint={`https://api.${tenant}.example.com/vitals`}
  headers={{
    'X-API-Key': apiKey,
    'X-Tenant': tenant
  }}
  sessionId={`${tenant}_${Date.now()}`}
/>
```

### A/B Testing Integration
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';

// Get experiment variant
const variant = Astro.cookies.get('experiment_variant')?.value || 'control';
---

<WebVitals 
  endpoint="/api/analytics/vitals"
  headers={{
    'X-Experiment-Variant': variant
  }}
  performanceBudget={{
    // Stricter budgets for variant B
    LCP: variant === 'B' ? 2000 : 2500,
    FID: variant === 'B' ? 80 : 100
  }}
/>

<script define:vars={{ variant }}>
  // Add variant to all metric payloads
  window.addEventListener('webvital', (e) => {
    e.detail.variant = variant;
  });
</script>
```

## Integration Examples

### With Google Analytics 4
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals 
  debug={import.meta.env.DEV}
/>

<script>
  // Send Web Vitals to GA4
  function sendToGoogleAnalytics({name, value}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', name, {
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        metric_value: value,
        metric_unit: name === 'CLS' ? 'unitless' : 'milliseconds',
        non_interaction: true
      });
    }
  }

  // Listen for web vitals
  window.addEventListener('webvital', (e) => {
    sendToGoogleAnalytics(e.detail);
  });
</script>
```

### With Plausible Analytics
```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals 
  onBudgetExceeded={(metric, value, budget) => {
    if (typeof plausible !== 'undefined') {
      plausible('Performance Budget Exceeded', {
        props: {
          metric: metric,
          value: String(value),
          budget: String(budget),
          page: location.pathname
        }
      });
    }
  }}
/>
```

### With Custom Analytics Endpoint
```typescript
// src/pages/api/analytics/vitals.ts
import type { APIRoute } from 'astro';
import { db } from '../../../lib/database';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Process batch or single metric
    const metrics = data.metrics || [data];
    
    // Store in database
    for (const metric of metrics) {
      await db.metrics.create({
        name: metric.name,
        value: metric.value,
        url: data.url,
        sessionId: data.sessionId,
        userId: data.userId,
        timestamp: new Date(metric.timestamp),
        userAgent: data.userAgent,
        viewport: data.viewport,
        extended: data.extended
      });
    }
    
    // Check performance budgets
    const budgets = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1
    };
    
    const violations = metrics.filter(m => 
      budgets[m.name] && m.value > budgets[m.name]
    );
    
    if (violations.length > 0) {
      // Send alerts
      await sendAlertToSlack(violations);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to process metrics:', error);
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## Layout Examples

### Base Layout
```astro
---
// src/layouts/Layout.astro
import { WebVitals } from '@casoon/astro-webvitals';

export interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
const isDev = import.meta.env.DEV;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <slot />
    
    <WebVitals 
      debug={isDev}
      endpoint={isDev ? undefined : '/api/analytics'}
      sampleRate={isDev ? 1 : 0.1}
      batchReporting={true}
      extendedMetrics={!isDev}
      smartDetection={true}
      performanceBudget={{
        LCP: 2500,
        FID: 100,
        CLS: 0.1,
        FCP: 1800,
        TTFB: 800,
        INP: 200
      }}
    />
  </body>
</html>
```

### MDX Layout
```astro
---
// src/layouts/MDXLayout.astro
import Layout from './Layout.astro';
import { WebVitals } from '@casoon/astro-webvitals';

const { frontmatter } = Astro.props;
---

<Layout title={frontmatter.title} description={frontmatter.description}>
  <article>
    <h1>{frontmatter.title}</h1>
    <time>{frontmatter.date}</time>
    <slot />
  </article>
  
  <!-- Additional metrics for blog posts -->
  <WebVitals 
    debug={false}
    endpoint="/api/blog-analytics"
    headers={{
      'X-Content-Type': 'blog-post',
      'X-Post-Id': frontmatter.slug
    }}
  />
</Layout>
```

## Environment-based Configuration

```astro
---
// Comprehensive environment-based setup
import { WebVitals } from '@casoon/astro-webvitals';

const env = import.meta.env.MODE; // 'development', 'staging', 'production'

const config = {
  development: {
    debug: true,
    position: 'bottom-right',
    trackInDev: true,
    sampleRate: 1
  },
  staging: {
    debug: false,
    endpoint: 'https://staging-api.example.com/vitals',
    sampleRate: 0.5,
    extendedMetrics: true
  },
  production: {
    debug: false,
    endpoint: 'https://api.example.com/vitals',
    sampleRate: 0.1,
    batchReporting: true,
    batchInterval: 10000,
    extendedMetrics: true,
    smartDetection: true,
    performanceBudget: {
      LCP: 2500,
      FID: 100,
      CLS: 0.1
    }
  }
};

const currentConfig = config[env] || config.production;
---

<WebVitals {...currentConfig} />
```