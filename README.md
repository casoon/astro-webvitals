# @casoon/astro-webvitals

[![npm version](https://badge.fury.io/js/@casoon%2Fastro-webvitals.svg)](https://www.npmjs.com/package/@casoon/astro-webvitals)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Web Vitals monitoring component for Astro with debug overlay and analytics support.

> 📦 This component was extracted from the [astro-v5-template](https://github.com/casoon/astro-v5-template) to be available as a standalone package.

Inspired by [AuditMySite Studio](https://github.com/casoon/auditmysite_studio).

## Features

✨ **Core Web Vitals Tracking**
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)
- INP (Interaction to Next Paint)

🎨 **Debug Overlay**
- Compact minimized view with performance score (0-100)
- Expandable interface with tabbed organization:
  - **Core Vitals**: Real-time metrics with progress bars
  - **Accessibility**: WCAG issue summary with counts
  - **Details**: Session info, memory usage, network status
- Color-coded indicators (✅ Good, ⚠️ Needs Improvement, ❌ Poor)
- Customizable position (top/bottom, left/right)

📊 **Analytics Ready**
- Send metrics to your analytics endpoint
- JSON payload with all metric data
- Compatible with any analytics service

🚀 **Performance Focused**
- Zero dependencies
- Minimal bundle size (~11KB gzipped)
- Uses native Performance APIs
- No impact on your site's performance

♿ **Accessibility Monitoring**
- Automatic WCAG 2.1 checking
- Detects missing alt texts, labels, and heading issues
- Summary view with issue counts
- Helps maintain accessibility standards

## Installation

```bash
npm install @casoon/astro-webvitals
```

```bash
pnpm add @casoon/astro-webvitals
```

```bash
yarn add @casoon/astro-webvitals
```

## Usage

### Basic Usage

Add the component to your Astro layout or page:

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<!DOCTYPE html>
<html>
  <head>
    <title>My Site</title>
  </head>
  <body>
    <!-- Your content -->
    
    <WebVitals />
  </body>
</html>
```

### Debug Mode

Enable the debug overlay to see metrics in real-time during development:

```astro
<WebVitals debug={true} />
```

Or only in development:

```astro
<WebVitals debug={import.meta.env.DEV} />
```

### Custom Position

Choose where the debug overlay appears:

```astro
<WebVitals 
  debug={true} 
  position="bottom-left" 
/>
```

Available positions: `top-right`, `top-left`, `bottom-right`, `bottom-left`

### Analytics Integration

Send metrics to your analytics endpoint:

```astro
<WebVitals 
  endpoint="/api/analytics/vitals"
/>
```

The component will send POST requests with this payload:

```typescript
{
  name: string;        // Metric name (LCP, FID, etc.)
  value: number;       // Metric value
  url: string;         // Page URL
  timestamp: number;   // Unix timestamp
  userAgent: string;   // Browser user agent
}
```

### Example Analytics Endpoint (Astro API Route)

Create `src/pages/api/analytics/vitals.ts`:

```typescript
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const metric = await request.json();
  
  // Store in your database, send to analytics service, etc.
  console.log('Web Vital:', metric);
  
  // Example: Send to your analytics service
  // await analytics.track({
  //   event: 'web_vital',
  //   properties: metric
  // });
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `debug` | `boolean` | `false` | Show debug overlay with metrics and accessibility issues |
| `endpoint` | `string` | `undefined` | URL to send metrics to (POST request) |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Position of debug overlay |
| `trackInDev` | `boolean` | `false` | Track metrics in development mode |
| `sampleRate` | `number` | `1` | Percentage of users to track (0-1) |
| `batchReporting` | `boolean` | `true` | Batch metrics before sending |
| `batchInterval` | `number` | `5000` | Batch interval in milliseconds |
| `checkAccessibility` | `boolean` | `true` (when debug) | Enable WCAG accessibility checking |
| `extendedMetrics` | `boolean` | `false` | Track memory and network metrics |
| `performanceBudget` | `object` | Default thresholds | Custom performance thresholds |

## Metrics Explained

### LCP (Largest Contentful Paint)
Time until the largest content element is rendered.
- ✅ Good: < 2.5s
- ⚠️ Needs Improvement: 2.5s - 4s
- ❌ Poor: > 4s

### FID (First Input Delay)
Time from first user interaction to browser response.
- ✅ Good: < 100ms
- ⚠️ Needs Improvement: 100ms - 300ms
- ❌ Poor: > 300ms

### CLS (Cumulative Layout Shift)
Visual stability - measures unexpected layout shifts.
- ✅ Good: < 0.1
- ⚠️ Needs Improvement: 0.1 - 0.25
- ❌ Poor: > 0.25

### FCP (First Contentful Paint)
Time until first content is rendered.
- ✅ Good: < 1.8s
- ⚠️ Needs Improvement: 1.8s - 3s
- ❌ Poor: > 3s

### TTFB (Time to First Byte)
Server response time.
- ✅ Good: < 800ms
- ⚠️ Needs Improvement: 800ms - 1.8s
- ❌ Poor: > 1.8s

### INP (Interaction to Next Paint)
Responsiveness - time from interaction to visual update.
- ✅ Good: < 200ms
- ⚠️ Needs Improvement: 200ms - 500ms
- ❌ Poor: > 500ms

## Browser Support

This component uses the [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance) which is supported in all modern browsers:

- Chrome/Edge 60+
- Firefox 60+
- Safari 14+

## Examples

### Production Setup

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
const isDev = import.meta.env.DEV;
---

<!-- Debug overlay in development, analytics in production -->
<WebVitals 
  debug={isDev}
  endpoint={isDev ? undefined : '/api/analytics/vitals'}
/>
```

### Complete Example

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>My Astro Site</title>
  </head>
  <body>
    <h1>Welcome to my site</h1>
    
    <!-- Web Vitals monitoring -->
    <WebVitals 
      debug={import.meta.env.DEV}
      endpoint="/api/analytics/vitals"
      position="bottom-right"
    />
  </body>
</html>
```

## Development

```bash
# Clone the repository
git clone https://github.com/casoon/astro-webvitals.git
cd astro-webvitals

# Install dependencies
npm install

# Link for local testing
npm link
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT © [CASOON](https://github.com/casoon)

## Related Projects

- [Astro v5 Template](https://github.com/casoon/astro-v5-template) - The original template this component was extracted from
- [AuditMySite Studio](https://github.com/casoon/auditmysite_studio) - Comprehensive website auditing tool
- [Astro](https://astro.build) - The web framework for content-driven websites

## Support

If you find this package useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📖 Improving documentation

## Debug Overlay Interface

### Minimized View
- Shows performance score (0-100)
- Displays metric count and issue warnings
- Click to expand for details

### Expanded View - Tabs
1. **Core Vitals**: All 6 metrics with visual progress bars
2. **Accessibility**: WCAG issues grouped by type with counts
3. **Details**: Session info, memory usage, network status, configuration

## Changelog

### 0.1.1 (Latest)
- Improved accessibility tab with summary counts
- Enhanced details tab with session and network info
- Better UI organization and readability
- Memory usage visualization with progress bars

### 0.1.0
- Initial release with unified component
- Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
- WCAG accessibility checker
- Collapsible debug overlay with tabs
- Batch reporting and sampling rate
- TypeScript support without any types
- Production-ready with 11.4KB package size
