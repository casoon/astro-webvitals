# @casoon/astro-webvitals

[![npm version](https://badge.fury.io/js/@casoon%2Fastro-webvitals.svg)](https://www.npmjs.com/package/@casoon/astro-webvitals)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive Web Vitals & SEO monitoring component for Astro with debug overlay and analytics support.

> This component was extracted from the [astro-v5-template](https://github.com/casoon/astro-v5-template) to be available as a standalone package.

## Features

### Core Web Vitals Tracking
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Input responsiveness with auto-measurement
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Initial render
- **TTFB** (Time to First Byte) - Server response
- **INP** (Interaction to Next Paint) - Overall responsiveness
- **Navigation Timing**: DNS, TCP, DOM, LOAD

### Debug Overlay
- Radial gauge visualization with performance score (0-100)
- Expandable interface with tabbed organization:
  - **Core Vitals**: All metrics with visual progress bars and descriptions
  - **SEO**: Title, description, canonical, robots, Open Graph, Twitter Cards, Structured Data (JSON-LD) validation
  - **Accessibility**: WCAG issue summary with expandable details and quick wins
  - **Details**: Session info, memory usage, network status
  - **Console**: Browser console output viewer
- Responsive mobile design (< 700px):
  - Full-width footer bar that slides up
  - 60vh max height for better mobile viewing
  - Auto-switches on viewport resize
- Desktop floating box with customizable position
- Color-coded indicators (Good, Needs Improvement, Poor)
- Close button to dismiss overlay

### SEO Insights
- Title and meta description analysis with length validation
- Canonical URL and robots meta detection
- X-Robots-Tag header check
- Indexability status badge
- Open Graph and Twitter Card validation
- Structured Data (JSON-LD) parsing with warnings
- Heading outline with H1 count check
- Images: alt text and dimension checks
- Copyable SEO report for bug tickets

### Analytics Ready
- Send metrics to your analytics endpoint
- JSON payload with all metric data
- Batch reporting to reduce requests
- Configurable sampling rate

### Accessibility Monitoring
- Automatic WCAG 2.1 checking
- Detects missing alt texts, labels, heading issues
- Expandable issue details with element info
- Learn more links to web.dev documentation
- Optional on-page highlighting for issues

### Console Viewer
- Displays browser console output (log, info, warn, error)
- Scrollable message history (last 200 entries)
- Color-coded log levels
- Dockable bottom console with draggable height
- Custom logging API: `webVitalsLog.info()`, `.warn()`, `.error()`

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

Choose where the debug overlay appears (desktop only):

```astro
<WebVitals 
  debug={true} 
  position="bottom-left" 
/>
```

Available positions: `top-right`, `top-left`, `bottom-right`, `bottom-left`

### WCAG Highlighting

Highlight elements with WCAG issues directly on the page:

```astro
<WebVitals 
  debug={true}
  checkAccessibility={true}
  highlightAccessibility={true}
/>
```

### Console Logging & Dock

Console output is captured automatically and shown in the Console tab. Use the helper for custom messages:

```javascript
webVitalsLog.info('Info message');
webVitalsLog.warn('Warning message');  
webVitalsLog.error('Error message');
```

Open a docked console at the bottom of the page:

```astro
<WebVitals debug={true} consoleDock={true} />
```

### Analytics Integration

Send metrics to your analytics endpoint:

```astro
<WebVitals 
  endpoint="/api/analytics/vitals"
  sampleRate={0.1}
  batchReporting={true}
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

### Example Analytics Endpoint

Create `src/pages/api/analytics/vitals.ts`:

```typescript
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const metric = await request.json();
  
  // Store in your database, send to analytics service, etc.
  console.log('Web Vital:', metric);
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

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
  sampleRate={0.1}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `debug` | `boolean` | `false` | Show debug overlay with metrics |
| `consoleDock` | `boolean` | `false` | Show dockable console at bottom |
| `endpoint` | `string` | `undefined` | URL to send metrics to (POST) |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Position of debug overlay |
| `trackInDev` | `boolean` | `false` | Track metrics in development |
| `sampleRate` | `number` | `1` | Percentage of users to track (0-1) |
| `batchReporting` | `boolean` | `true` | Batch metrics before sending |
| `batchInterval` | `number` | `5000` | Batch interval in milliseconds |
| `checkAccessibility` | `boolean` | `true` (when debug) | Enable WCAG checking |
| `highlightAccessibility` | `boolean` | `false` | Highlight elements with WCAG issues |
| `extendedMetrics` | `boolean` | `false` | Track memory and network metrics |
| `smartDetection` | `boolean` | `false` | Detect rage/dead clicks |
| `performanceBudget` | `object` | Default thresholds | Custom performance thresholds |
| `headers` | `object` | `{}` | Custom headers for endpoint requests |
| `sessionId` | `string` | Auto-generated | Session ID for tracking |
| `userId` | `string` | `undefined` | User ID for tracking |

## Metrics Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | < 1.8s | 1.8s - 3s | > 3s |
| TTFB | < 800ms | 800ms - 1.8s | > 1.8s |
| INP | < 200ms | 200ms - 500ms | > 500ms |

## Browser Support

Uses the [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance) supported in all modern browsers:

- Chrome/Edge 60+
- Firefox 60+
- Safari 14+

## Development

```bash
# Clone the repository
git clone https://github.com/casoon/astro-webvitals.git
cd astro-webvitals

# Install dependencies
pnpm install

# Type check
pnpm run type-check
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
- Starring the repository
- Reporting bugs
- Suggesting new features
- Improving documentation
