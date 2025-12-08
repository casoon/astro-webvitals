# Changelog

All notable changes to @casoon/astro-webvitals will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.4] - 2024-12-09

### Added
- 📊 **Radial Gauge Visualization** - Performance score displayed as circular gauge with gradient
- 📈 **Improved Metrics Layout** - Grouped sections for Core Web Vitals, Additional Metrics, and Navigation Timing
- 🔍 **Expandable Accessibility Details** - Click to expand issue categories with individual element details
- 🔗 **Learn More Links** - Direct links to web.dev documentation for each accessibility issue type
- 💡 **Quick Wins Section** - Actionable tips based on detected accessibility issues
- ✨ **Metric Descriptions** - Each metric now shows a helpful hint (e.g., "Loading performance", "Visual stability")

### Improved
- 🎯 **Better Initial State for Metrics** - CLS shows 0.000 (good) by default instead of "waiting"
- 👆 **Interaction-based Metrics** - FID/INP now show clear call-to-action ("Click or tap to measure")
- 🎨 **Enhanced Color Scheme** - Gradient progress bars, improved contrast, purple scrollbar accent
- 📱 **Scrollbar Styling** - Custom styled scrollbars matching the dark theme
- ⏳ **Pulse Animation** - Loading indicators now have smooth pulse animation
- 📊 **Score Counter** - Shows how many metrics are measured (e.g., "4/6 metrics measured")

### Fixed
- 🐛 **CLS Initial Display** - No longer shows "Monitoring layout shifts..." when there are no shifts

## [0.1.3] - 2024-12-01

### Added
- 🖥️ **Console & Error Detection** - New Console tab capturing console.error() calls
- 📝 **Custom Logging API** - webVitalsLog.info(), .warn(), .error() for custom messages
- 🔄 **Console Mode Toggle** - Enable/disable custom logging capture

## [0.1.2] - 2024-11-18

### Added
- 📱 **Mobile responsive design** - Full-width footer bar for viewports < 700px
- 📊 **Navigation Timing Metrics** - DNS, TCP, DOM, LOAD measurements
- ⏱️ **LCP timeout** - Finalizes after 3 seconds of no changes
- ❌ **Close button** - Dismissible overlay (reopens on reload)

### Fixed
- 🐛 **TTFB calculation** - Now correctly measures from fetchStart to responseStart
- 📏 **Mobile layout** - Footer bar slides up instead of overlaying content
- 🔍 **Metrics visibility** - All metrics show immediately or with pending state

### Improved
- 📱 Mobile UX with slide-up animation
- 📊 More comprehensive timing metrics available immediately
- 🎨 Better visual hierarchy with grouped metrics

## [0.1.1] - 2024-11-18

### Added
- 📦 Note about extraction from [astro-v5-template](https://github.com/casoon/astro-v5-template)

### Improved
- 🎨 Redesigned accessibility tab to show summary counts instead of detailed lists
- 📊 Enhanced details tab with session info, memory visualization, and network status
- 🔧 Cleaner UI for accessibility issues with grouped counts by type
- 📝 Added helpful tips in accessibility tab
- 🌐 Better network status indicators with visual quality markers
- 💾 Memory usage now shows percentage with color-coded progress bar
- ⚙️ Configuration status visible in details tab

### Fixed
- Accessibility tab now shows clean issue counts instead of verbose element details
- Details tab now provides useful session and configuration information
- Improved readability with better spacing and organization

## [0.1.0] - 2024-11-18

### Added
- 🎉 **Initial Release with Core Features**:
  - All Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
  - Debug overlay with real-time metrics
  - Analytics endpoint support
  - Zero dependencies implementation
  - TypeScript support with full type definitions
  - Position configuration for debug overlay
  - Color-coded status indicators (✅ Good, ⚠️ Needs Improvement, ❌ Poor)

- ✨ **Advanced Features**:
  - **Batch Reporting**: Collect and send metrics in batches to reduce network requests
    - Configurable batch interval and size
    - Automatic flush on page unload
    - LocalStorage fallback for failed requests
  
  - **Sampling Rate Control**: Manage costs with configurable user sampling
    - Random sampling (0-1 range)
    - Consistent per-session sampling
    - Debug info shows sampling rate
  
  - **Extended Metrics**: Additional performance indicators
    - Long Tasks detection (> 50ms)
    - Memory usage monitoring (Chrome only)
    - Network connection information
    - Device viewport tracking
  
  - **Smart Detection**: Automatic UX problem detection
    - Rage click detection (3+ clicks in 1s)
    - Dead click detection (clicks with no effect)
    - Configurable thresholds
  
  - **Performance Budgets**: Set and monitor metric thresholds
    - Per-metric budget configuration
    - Visual indicators in debug mode
    - `onBudgetExceeded` callback
    - Console warnings

- ♿ **Full Accessibility Support**: WCAG 2.1 compliance
  - Semantic HTML with ARIA attributes
  - Full keyboard navigation (Tab, Escape, Enter)
  - Screen reader announcements
  - High contrast colors (7:1 ratio)
  - Focus indicators
  - Close button for better usability

- 🛠️ **Developer Experience**:
  - Comprehensive TypeScript types
  - Extensive documentation with examples
  - Volta configuration for consistent environments
  - pnpm workspace setup
  - Both basic and enhanced component versions

---

## Usage

### Basic Component
```astro
import { WebVitals } from '@casoon/astro-webvitals';

<WebVitals debug={true} endpoint="/api/analytics" />
```

### Enhanced Component with Advanced Features
```astro
import { WebVitalsEnhanced } from '@casoon/astro-webvitals';

<WebVitalsEnhanced 
  debug={true}
  endpoint="/api/analytics"
  sampleRate={0.1}
  batchReporting={true}
  extendedMetrics={true}
  smartDetection={true}
  performanceBudget={{
    LCP: 2500,
    FID: 100,
    CLS: 0.1
  }}
/>
```

Both components are available - use `WebVitals` for basic needs or `WebVitalsEnhanced` for advanced features.

## Support

For issues and feature requests, please visit:
https://github.com/casoon/astro-webvitals/issues