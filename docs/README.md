# @casoon/astro-webvitals Documentation

## Table of Contents

1. [Getting Started](./getting-started.md)
2. [Core Features](./core-features.md)
3. [Enhanced Features](./enhanced-features.md)
4. [API Reference](./api-reference.md)
5. [Analytics Integration](./analytics-integration.md)
6. [Performance Budgets](./performance-budgets.md)
7. [Accessibility](./accessibility.md)
8. [Examples](./examples.md)
9. [Troubleshooting](./troubleshooting.md)
10. [Migration Guide](./migration-guide.md)

## Quick Start

```bash
pnpm add @casoon/astro-webvitals
```

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<WebVitals debug={import.meta.env.DEV} />
```

## Features Overview

### Core Features
- ✅ All Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
- ✅ Zero dependencies
- ✅ Debug overlay with real-time metrics
- ✅ Analytics endpoint support

### Enhanced Features (v2.0+)
- ✅ Batch reporting to reduce requests
- ✅ Sampling rate control
- ✅ Extended metrics (Long Tasks, Memory, Network)
- ✅ Smart detection (Rage clicks, Dead clicks)
- ✅ Performance budgets with alerts
- ✅ Full accessibility support (WCAG 2.1)
- ✅ LocalStorage fallback for offline
- ✅ Session and user tracking

## Browser Support

| Browser | Minimum Version | Full Support |
|---------|----------------|--------------|
| Chrome  | 60+            | 90+          |
| Firefox | 60+            | 85+          |
| Safari  | 14+            | 15+          |
| Edge    | 79+            | 90+          |

## Performance Impact

- **Bundle Size**: ~8KB minified, ~3KB gzipped
- **Runtime Overhead**: < 1ms per metric
- **Memory Usage**: < 100KB
- **Network**: 1 request per batch (configurable)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © [CASOON](https://github.com/casoon)