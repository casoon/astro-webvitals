# Enhanced Features

The enhanced version of @casoon/astro-webvitals includes advanced features for production-grade monitoring.

## Batch Reporting

Reduce network requests by batching metrics before sending.

### How It Works
Instead of sending each metric individually, the component collects metrics and sends them in batches.

### Configuration
```astro
<WebVitals 
  endpoint="/api/analytics"
  batchReporting={true}      // Enable batching
  batchInterval={5000}        // Send every 5 seconds
  maxBatchSize={10}          // Or when 10 metrics collected
/>
```

### Benefits
- **Reduced Network Load**: Fewer HTTP requests
- **Better Performance**: Less overhead
- **Cost Savings**: Lower bandwidth usage
- **Reliability**: Automatic retry with localStorage fallback

### Batch Payload Format
```json
{
  "metrics": [
    {
      "name": "LCP",
      "value": 1234,
      "timestamp": 1704067200000
    },
    {
      "name": "FID", 
      "value": 45,
      "timestamp": 1704067201000
    }
  ],
  "sessionId": "session_123",
  "userId": "user_456",
  "url": "https://example.com/page",
  "timestamp": 1704067202000
}
```

## Sampling Rate

Control the percentage of users tracked to manage costs and data volume.

### Configuration
```astro
<WebVitals 
  endpoint="/api/analytics"
  sampleRate={0.1}  // Track 10% of users
/>
```

### Sampling Strategies

#### Random Sampling
```astro
<!-- Default: Random 10% of page loads -->
<WebVitals sampleRate={0.1} />
```

#### User-Based Sampling
```javascript
// Consistent sampling per user
const userHash = hashCode(userId);
const shouldSample = (userHash % 100) < 10; // 10% of users

<WebVitals 
  sampleRate={shouldSample ? 1 : 0}
  userId={userId}
/>
```

#### Time-Based Sampling
```javascript
// Sample more during peak hours
const hour = new Date().getHours();
const sampleRate = (hour >= 9 && hour <= 17) ? 0.2 : 0.05;

<WebVitals sampleRate={sampleRate} />
```

## Extended Metrics

Track additional performance indicators beyond Core Web Vitals.

### Available Extended Metrics

#### Long Tasks
Detect JavaScript execution blocking the main thread:
```javascript
// Tracks tasks > 50ms
{
  "name": "LongTask",
  "value": 127,  // Duration in ms
  "timestamp": 1704067200000
}
```

#### Memory Usage
Monitor JavaScript heap size (Chrome only):
```javascript
{
  "extended": {
    "memory": {
      "used": 45678901,   // Bytes
      "total": 67890123   // Bytes
    }
  }
}
```

#### Network Information
Track connection quality:
```javascript
{
  "extended": {
    "connection": {
      "type": "4g",
      "rtt": 50,        // Round-trip time in ms
      "downlink": 10    // Mbps
    }
  }
}
```

### Enabling Extended Metrics
```astro
<WebVitals 
  extendedMetrics={true}
  endpoint="/api/analytics"
/>
```

## Smart Detection

Automatically detect problematic user interactions.

### Rage Click Detection
Identifies frustrated users rapidly clicking:

```astro
<WebVitals 
  smartDetection={true}
  endpoint="/api/analytics"
/>
```

**Detection Logic:**
- 3+ clicks within 1 second
- On the same element or area
- Sends `RageClick` metric

**Metric Format:**
```json
{
  "name": "RageClick",
  "value": 5,  // Number of rapid clicks
  "target": "button#submit",
  "timestamp": 1704067200000
}
```

### Dead Click Detection
Identifies clicks with no effect:

**Detection Logic:**
- Click doesn't trigger navigation
- No DOM changes detected
- No focus change
- Sends `DeadClick` metric

**Metric Format:**
```json
{
  "name": "DeadClick", 
  "value": 1,
  "target": "div.unclickable",
  "timestamp": 1704067200000
}
```

### Configuration
```astro
<WebVitals 
  smartDetection={true}
  onRageClick={(data) => {
    console.log('User frustrated:', data);
    // Trigger help widget
  }}
  onDeadClick={(data) => {
    console.log('Dead click on:', data.target);
    // Log for UX improvement
  }}
/>
```

## Performance Budgets

Set thresholds and get alerts when metrics exceed limits.

### Setting Budgets
```astro
<WebVitals 
  performanceBudget={{
    LCP: 2000,    // Max 2 seconds
    FID: 50,      // Max 50ms
    CLS: 0.05,    // Max 0.05
    FCP: 1500,    // Max 1.5 seconds
    TTFB: 600,    // Max 600ms
    INP: 150      // Max 150ms
  }}
  onBudgetExceeded={(metric, value, budget) => {
    console.error(`Budget exceeded: ${metric} = ${value}, budget = ${budget}`);
    // Send alert to monitoring service
  }}
/>
```

### Visual Indicators
When debug mode is enabled, budget violations show:
- 📈 icon next to exceeded metrics
- Red color coding
- Console warnings

### Integration with Monitoring
```javascript
// Example: Send to monitoring service
<WebVitals 
  performanceBudget={budgets}
  onBudgetExceeded={(metric, value, budget) => {
    // Send to Sentry
    Sentry.captureMessage(`Performance budget exceeded: ${metric}`, {
      level: 'warning',
      extra: { value, budget, url: window.location.href }
    });
    
    // Send to Analytics
    gtag('event', 'performance_budget_exceeded', {
      metric_name: metric,
      metric_value: value,
      budget_value: budget
    });
  }}
/>
```

## LocalStorage Fallback

Automatic fallback when network requests fail.

### How It Works
1. If endpoint request fails, metrics stored in localStorage
2. On next successful request, buffered metrics are sent
3. Maximum 50 metrics stored (FIFO)

### Manual Recovery
```javascript
// Retrieve failed metrics
const buffer = localStorage.getItem('webvitals_buffer');
const metrics = JSON.parse(buffer || '[]');

// Process manually
metrics.forEach(metric => {
  console.log(metric);
});

// Clear buffer
localStorage.removeItem('webvitals_buffer');
```

## Session & User Tracking

Track metrics across sessions and users.

### Automatic Session ID
```astro
<!-- Auto-generated session ID -->
<WebVitals endpoint="/api/analytics" />
```

### Custom IDs
```astro
<WebVitals 
  sessionId={getSessionId()}
  userId={getUserId()}
  endpoint="/api/analytics"
/>
```

### ID Format in Payload
```json
{
  "metrics": [...],
  "sessionId": "session_1704067200000_abc123",
  "userId": "user_456",
  "timestamp": 1704067200000
}
```

## Custom Headers

Add authentication or custom headers to requests.

```astro
<WebVitals 
  endpoint="/api/analytics"
  headers={{
    'X-API-Key': 'your-api-key',
    'X-Client-Version': '1.0.0',
    'Authorization': `Bearer ${token}`
  }}
/>
```

## Advanced Configuration Example

```astro
---
// Full-featured production setup
const config = {
  endpoint: import.meta.env.PUBLIC_ANALYTICS_URL,
  sampleRate: 0.1,
  batchReporting: true,
  batchInterval: 10000,
  maxBatchSize: 20,
  extendedMetrics: true,
  smartDetection: true,
  performanceBudget: {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    FCP: 1800,
    TTFB: 800,
    INP: 200
  },
  headers: {
    'X-API-Key': import.meta.env.PUBLIC_API_KEY
  },
  sessionId: getSessionId(),
  userId: getUserId()
};
---

<WebVitals {...config} />
```

## Performance Considerations

| Feature | Performance Impact | Recommendation |
|---------|-------------------|----------------|
| Batch Reporting | Positive | Always enable in production |
| Sampling Rate | Neutral | Use 0.1-0.2 for most sites |
| Extended Metrics | Minimal | Enable for detailed insights |
| Smart Detection | Minimal | Enable for UX monitoring |
| Performance Budgets | None | Always configure |
| LocalStorage Fallback | Positive | Automatic, no config needed |