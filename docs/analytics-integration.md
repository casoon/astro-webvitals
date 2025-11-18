# Analytics Integration Guide

This guide provides comprehensive documentation on how to integrate @casoon/astro-webvitals with various analytics services.

## Table of Contents

1. [Overview](#overview)
2. [Payload Format](#payload-format)
3. [Basic Integration](#basic-integration)
4. [Service-Specific Integrations](#service-specific-integrations)
5. [Custom Analytics Endpoints](#custom-analytics-endpoints)
6. [Batch Processing](#batch-processing)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

## Overview

The @casoon/astro-webvitals component is **service-agnostic**, meaning it can send metrics to any analytics service that accepts HTTP POST requests with JSON payloads. This design makes it compatible with:

- Custom analytics backends
- Google Analytics
- Plausible Analytics
- Mixpanel
- Amplitude
- Segment
- DataDog
- New Relic
- Elastic APM
- Any REST API endpoint

## Payload Format

### Single Metric Payload

When `batchReporting` is disabled, each metric is sent individually:

```typescript
interface SingleMetricPayload {
  // Core metric data
  name: string;        // Metric name: "LCP" | "FID" | "CLS" | "FCP" | "TTFB" | "INP" | "LongTask" | "RageClick" | "DeadClick"
  value: number;       // Metric value (milliseconds for time metrics, unitless for CLS, count for clicks)
  timestamp: number;   // Unix timestamp when metric was captured (milliseconds)
  
  // Context information
  url: string;         // Full URL where metric was measured
  userAgent: string;   // Browser user agent string
  
  // Session tracking (if configured)
  sessionId?: string;  // Unique session identifier
  userId?: string;     // User identifier (if provided)
  
  // Viewport information
  viewport?: {
    width: number;     // Browser viewport width in pixels
    height: number;    // Browser viewport height in pixels
  };
  
  // Extended metrics (if enabled)
  extended?: {
    memory?: {         // JavaScript memory usage (Chrome only)
      used: number;    // Used JS heap size in bytes
      total: number;   // Total JS heap size in bytes
    };
    connection?: {     // Network information
      type: string;    // Connection type: "4g" | "3g" | "2g" | "slow-2g" | "wifi" | "ethernet"
      rtt?: number;    // Round-trip time in milliseconds
      downlink?: number; // Downlink speed in Mbps
    };
  };
  
  // Smart detection (for interaction metrics)
  target?: string;     // Element selector for rage/dead clicks (e.g., "button#submit")
}
```

### Batch Payload Format

When `batchReporting` is enabled, metrics are grouped:

```typescript
interface BatchMetricPayload {
  // Array of metrics
  metrics: Array<{
    name: string;
    value: number;
    timestamp: number;
    target?: string;
  }>;
  
  // Shared context for all metrics in batch
  url: string;
  userAgent: string;
  sessionId?: string;
  userId?: string;
  timestamp: number;    // Batch send timestamp
  viewport?: {
    width: number;
    height: number;
  };
  extended?: {
    memory?: {
      used: number;
      total: number;
    };
    connection?: {
      type: string;
      rtt?: number;
      downlink?: number;
    };
  };
}
```

## Basic Integration

### 1. Configure the Component

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals 
  endpoint="/api/analytics/vitals"  <!-- Your endpoint URL -->
  headers={{
    'Content-Type': 'application/json',  <!-- Automatically set -->
    'X-API-Key': 'your-api-key'         <!-- Optional authentication -->
  }}
/>
```

### 2. Create Your Analytics Endpoint

```typescript
// src/pages/api/analytics/vitals.ts (Astro API Route)
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    
    // Check if batch or single metric
    const metrics = payload.metrics || [payload];
    
    // Process each metric
    for (const metric of metrics) {
      console.log(`Received ${metric.name}: ${metric.value}ms`);
      
      // Store in your database
      await saveMetricToDatabase({
        name: metric.name,
        value: metric.value,
        url: payload.url,
        sessionId: payload.sessionId,
        timestamp: metric.timestamp || payload.timestamp
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Failed to process metrics:', error);
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## Service-Specific Integrations

### Google Analytics 4

```typescript
// api/analytics/vitals.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  const metrics = payload.metrics || [payload];
  
  // Send to Google Analytics using Measurement Protocol
  const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
  const GA_API_SECRET = process.env.GA_API_SECRET;
  
  for (const metric of metrics) {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: payload.sessionId || 'anonymous',
        user_id: payload.userId,
        events: [{
          name: 'web_vitals',
          params: {
            metric_name: metric.name,
            metric_value: metric.value,
            metric_unit: metric.name === 'CLS' ? 'unitless' : 'milliseconds',
            page_url: payload.url,
            engagement_time_msec: 1
          }
        }]
      })
    });
  }
  
  return new Response(JSON.stringify({ success: true }));
};
```

### Plausible Analytics

```typescript
// api/analytics/vitals.ts
export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  const metrics = payload.metrics || [payload];
  
  const PLAUSIBLE_DOMAIN = 'your-domain.com';
  const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY;
  
  for (const metric of metrics) {
    await fetch('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'User-Agent': payload.userAgent
      },
      body: JSON.stringify({
        name: 'Web Vitals',
        url: payload.url,
        domain: PLAUSIBLE_DOMAIN,
        props: {
          metric: metric.name,
          value: String(Math.round(metric.value)),
          rating: getMetricRating(metric.name, metric.value)
        }
      })
    });
  }
  
  return new Response(JSON.stringify({ success: true }));
};

function getMetricRating(name: string, value: number): string {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 }
  };
  
  const threshold = thresholds[name];
  if (!threshold) return 'unknown';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}
```

### Mixpanel

```typescript
// api/analytics/vitals.ts
import Mixpanel from 'mixpanel';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  const metrics = payload.metrics || [payload];
  
  const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);
  
  for (const metric of metrics) {
    mixpanel.track('Web Vital', {
      distinct_id: payload.userId || payload.sessionId,
      metric_name: metric.name,
      metric_value: metric.value,
      url: payload.url,
      viewport_width: payload.viewport?.width,
      viewport_height: payload.viewport?.height,
      connection_type: payload.extended?.connection?.type,
      memory_used_mb: payload.extended?.memory ? 
        (payload.extended.memory.used / 1048576).toFixed(2) : undefined
    });
  }
  
  return new Response(JSON.stringify({ success: true }));
};
```

### DataDog

```typescript
// api/analytics/vitals.ts
import { StatsD } from 'hot-shots';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  const metrics = payload.metrics || [payload];
  
  const dogstatsd = new StatsD({
    host: process.env.DD_AGENT_HOST,
    port: 8125,
    globalTags: [`env:${process.env.NODE_ENV}`]
  });
  
  for (const metric of metrics) {
    // Send as gauge metric
    dogstatsd.gauge(`web.vitals.${metric.name.toLowerCase()}`, metric.value, [
      `url:${payload.url}`,
      `session:${payload.sessionId}`,
      `user:${payload.userId || 'anonymous'}`
    ]);
    
    // Also send as histogram for percentiles
    dogstatsd.histogram(`web.vitals.histogram.${metric.name.toLowerCase()}`, metric.value);
  }
  
  return new Response(JSON.stringify({ success: true }));
};
```

### Segment

```typescript
// api/analytics/vitals.ts
import Analytics from 'analytics-node';

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  const metrics = payload.metrics || [payload];
  
  const analytics = new Analytics(process.env.SEGMENT_WRITE_KEY);
  
  for (const metric of metrics) {
    analytics.track({
      userId: payload.userId || null,
      anonymousId: payload.sessionId,
      event: 'Web Vital Measured',
      properties: {
        metric: metric.name,
        value: metric.value,
        unit: metric.name === 'CLS' ? 'score' : 'milliseconds',
        url: payload.url,
        viewport: payload.viewport,
        extended: payload.extended,
        rating: getMetricRating(metric.name, metric.value)
      },
      context: {
        userAgent: payload.userAgent
      }
    });
  }
  
  await analytics.flush();
  return new Response(JSON.stringify({ success: true }));
};
```

## Custom Analytics Endpoints

### PostgreSQL Database

```typescript
// api/analytics/vitals.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  const metrics = payload.metrics || [payload];
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const metric of metrics) {
      await client.query(`
        INSERT INTO web_vitals (
          metric_name, metric_value, url, session_id, user_id,
          timestamp, user_agent, viewport_width, viewport_height,
          connection_type, memory_used, memory_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        metric.name,
        metric.value,
        payload.url,
        payload.sessionId,
        payload.userId,
        new Date(metric.timestamp || payload.timestamp),
        payload.userAgent,
        payload.viewport?.width,
        payload.viewport?.height,
        payload.extended?.connection?.type,
        payload.extended?.memory?.used,
        payload.extended?.memory?.total
      ]);
    }
    
    await client.query('COMMIT');
    return new Response(JSON.stringify({ success: true }));
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

### MongoDB

```typescript
// api/analytics/vitals.ts
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  const metrics = payload.metrics || [payload];
  
  await client.connect();
  const db = client.db('analytics');
  const collection = db.collection('webvitals');
  
  const documents = metrics.map(metric => ({
    metricName: metric.name,
    value: metric.value,
    url: payload.url,
    sessionId: payload.sessionId,
    userId: payload.userId,
    timestamp: new Date(metric.timestamp || payload.timestamp),
    userAgent: payload.userAgent,
    viewport: payload.viewport,
    extended: payload.extended,
    rating: getMetricRating(metric.name, metric.value)
  }));
  
  await collection.insertMany(documents);
  await client.close();
  
  return new Response(JSON.stringify({ success: true }));
};
```

### InfluxDB (Time Series)

```typescript
// api/analytics/vitals.ts
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const influx = new InfluxDB({
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN
});

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  const metrics = payload.metrics || [payload];
  
  const writeApi = influx.getWriteApi(
    process.env.INFLUX_ORG,
    process.env.INFLUX_BUCKET
  );
  
  for (const metric of metrics) {
    const point = new Point('web_vitals')
      .tag('metric', metric.name)
      .tag('url', payload.url)
      .tag('session_id', payload.sessionId || 'unknown')
      .tag('user_id', payload.userId || 'anonymous')
      .floatField('value', metric.value)
      .timestamp(new Date(metric.timestamp || payload.timestamp));
    
    if (payload.extended?.connection?.type) {
      point.tag('connection_type', payload.extended.connection.type);
    }
    
    writeApi.writePoint(point);
  }
  
  await writeApi.close();
  return new Response(JSON.stringify({ success: true }));
};
```

## Batch Processing

### Optimized Batch Handler

```typescript
// api/analytics/vitals.ts
export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json();
  
  // Determine if batch or single
  const isBatch = Array.isArray(payload.metrics);
  const metrics = isBatch ? payload.metrics : [payload];
  
  // Group metrics by type for efficient processing
  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) acc[metric.name] = [];
    acc[metric.name].push(metric);
    return acc;
  }, {} as Record<string, typeof metrics>);
  
  // Process different metric types with appropriate strategies
  const results = await Promise.all(
    Object.entries(groupedMetrics).map(async ([metricName, metricList]) => {
      switch (metricName) {
        case 'LCP':
        case 'FCP':
        case 'TTFB':
          // Time-based metrics: calculate percentiles
          return processTimeMetrics(metricName, metricList, payload);
        
        case 'CLS':
          // Layout shift: track cumulative values
          return processLayoutMetrics(metricList, payload);
        
        case 'FID':
        case 'INP':
          // Interaction metrics: focus on worst cases
          return processInteractionMetrics(metricName, metricList, payload);
        
        case 'RageClick':
        case 'DeadClick':
          // User frustration: immediate alerts
          return processUserFrustration(metricName, metricList, payload);
        
        default:
          return processGenericMetrics(metricName, metricList, payload);
      }
    })
  );
  
  return new Response(JSON.stringify({ 
    success: true,
    processed: metrics.length,
    results 
  }));
};
```

## Error Handling

### Retry Logic

```typescript
// Component configuration with retry
<WebVitals 
  endpoint="/api/analytics/vitals"
  onError={(error, metrics) => {
    console.error('Failed to send metrics:', error);
    
    // Store failed metrics for retry
    const failed = JSON.parse(localStorage.getItem('failed_metrics') || '[]');
    failed.push(...metrics);
    localStorage.setItem('failed_metrics', JSON.stringify(failed.slice(-100)));
  }}
/>
```

### Endpoint with Validation

```typescript
// api/analytics/vitals.ts
import { z } from 'zod';

const MetricSchema = z.object({
  name: z.enum(['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP', 'LongTask', 'RageClick', 'DeadClick']),
  value: z.number().min(0),
  timestamp: z.number().optional(),
  target: z.string().optional()
});

const PayloadSchema = z.object({
  metrics: z.array(MetricSchema).optional(),
  name: z.string().optional(),
  value: z.number().optional(),
  url: z.string().url(),
  userAgent: z.string(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.number(),
  viewport: z.object({
    width: z.number(),
    height: z.number()
  }).optional(),
  extended: z.object({
    memory: z.object({
      used: z.number(),
      total: z.number()
    }).optional(),
    connection: z.object({
      type: z.string(),
      rtt: z.number().optional(),
      downlink: z.number().optional()
    }).optional()
  }).optional()
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawPayload = await request.json();
    const payload = PayloadSchema.parse(rawPayload);
    
    // Process validated payload
    // ...
    
    return new Response(JSON.stringify({ success: true }));
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid payload',
        details: error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## Security Considerations

### 1. Authentication

```astro
<!-- Use API keys -->
<WebVitals 
  endpoint="/api/analytics/vitals"
  headers={{
    'X-API-Key': import.meta.env.PUBLIC_ANALYTICS_API_KEY
  }}
/>
```

### 2. Rate Limiting

```typescript
// api/analytics/vitals.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests'
});

// Apply rate limiting to endpoint
```

### 3. CORS Configuration

```typescript
// api/analytics/vitals.ts
export const POST: APIRoute = async ({ request }) => {
  // Validate origin
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ];
  
  if (!allowedOrigins.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Process request...
  
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin
    }
  });
};
```

### 4. Data Sanitization

```typescript
// Sanitize user-provided data
function sanitizePayload(payload: any) {
  return {
    ...payload,
    url: new URL(payload.url).toString(), // Validate URL
    userAgent: payload.userAgent.substring(0, 500), // Limit length
    sessionId: payload.sessionId?.replace(/[^a-zA-Z0-9_-]/g, ''),
    userId: payload.userId?.replace(/[^a-zA-Z0-9_-]/g, '')
  };
}
```

## Best Practices

1. **Always validate incoming data** - Use schema validation (Zod, Joi, etc.)
2. **Implement rate limiting** - Prevent abuse and DoS attacks
3. **Use HTTPS only** - Never send metrics over unencrypted connections
4. **Batch metrics** - Reduce network overhead
5. **Handle errors gracefully** - Implement retry logic with exponential backoff
6. **Monitor your endpoints** - Track success rates and response times
7. **Respect user privacy** - Don't collect PII without consent
8. **Document your API** - Provide clear integration guides

## Troubleshooting

### Common Issues

1. **Metrics not being sent**
   - Check browser console for errors
   - Verify endpoint URL is correct
   - Check CORS configuration
   - Ensure sampling rate isn't 0

2. **Invalid JSON errors**
   - Validate payload structure
   - Check for malformed metrics
   - Ensure proper Content-Type header

3. **Authentication failures**
   - Verify API keys are correct
   - Check header names match expected
   - Ensure tokens aren't expired

4. **Performance issues**
   - Enable batch reporting
   - Reduce sampling rate
   - Optimize endpoint processing
   - Use appropriate database indexes

## Summary

The @casoon/astro-webvitals component provides a flexible, service-agnostic approach to analytics integration. By sending standard JSON payloads over HTTP POST, it can integrate with virtually any analytics service or custom backend. The key is understanding the payload format and implementing appropriate endpoint handlers for your specific needs.