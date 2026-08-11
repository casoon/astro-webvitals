# Changelog

All notable changes to @casoon/astro-webvitals will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.3] - 2026-08-11

### Added
- Optional Web Vitals attribution (`attribution`) with compact diagnostic context.
- Optional `LongTask` reporting, browser metric events (`webvitals:metric`), configurable `maxBatchSize`, and experimental browser soft-navigation reporting.
- Explicit `consent` and `respectDnt` collection gates.
- Opt-in retry queue for failed `fetch` reports, bounded to 50 entries in `localStorage`.

### Changed
- Replaced outdated examples and feature claims with documentation matching the package API.
- Added reporting unit tests for IDs, deltas, transport selection, and retry persistence.

## [0.4.2] - 2026-08-11

### Changed
- Replaced custom vital calculations with Google's `web-vitals` package for LCP, CLS, INP, FCP, and TTFB.
- Reporting now includes stable metric IDs, deltas, ratings, and navigation types.
- Metrics flush on `visibilitychange`/`pagehide` and use `sendBeacon` where possible.
- Loaded overlay, console, SEO, and accessibility code only when those features are enabled.

### Fixed
- Prevented duplicate initialization when the component is rendered more than once.
- Removed the misleading programmatic FID/INP trigger and legacy FID collection.
- Escaped SEO and overlay data before rendering it into the debug UI.

## [0.4.1] - 2026-08-11

### Fixed
- The bundled client script's import path was `../client/index` instead of `./client/index`, pointing outside `src/` — broke the module import introduced in 0.4.0.

## [0.4.0] - 2026-08-11

### Changed
- **Client architecture** - The ~2500-line inline client script is now split into TypeScript modules under `src/client/` (metrics, UI, accessibility, SEO, reporting) and loaded as a bundled module script instead of a raw inline script. This makes the client logic covered by type-checking and linting for the first time, and lets browsers cache the script across page loads instead of re-downloading it inline on every page.
- Upgraded `typescript` to `^7.0.2` (from `^6.0.3`), `astro` to `^7.2.0`, `@biomejs/biome` to `^2.5.8`.
- Removed `src/lib/` - an unused, unreferenced set of metric/util modules that weren't exported or imported anywhere.

### Fixed
- `sampleRate` and the auto-generated `sessionId` were evaluated once at build time in the Astro frontmatter, so every visitor of a statically generated page shared the same sampling decision and session ID. Both are now evaluated client-side, per page load.
- Captured console messages were inserted into the console dock without escaping, allowing HTML/script injection via `console.log`/`console.error` calls that include untrusted content.
- A WCAG label lookup could throw on element `id`s containing CSS-selector-breaking characters, aborting the rest of the accessibility check.
- The FID measurement could register a duplicate `PerformanceObserver` on BFCache restore without disconnecting the previous one.
- `console.log/info/warn/error` were monkey-patched on every tracked page load regardless of whether `debug` or `consoleDock` was enabled; now only patched when needed.

## [0.1.6] - 2024-12-17

### Changed
- **Documentation Update** - Comprehensive README overhaul with current features and usage
- **Console Tab** - Renamed from "Console & Error Detection" to "Console Viewer" for clarity
- **CHANGELOG** - Updated to reflect all features accurately

## [0.1.5] - 2024-12-09

### Added
- **Auto-FID Measurement** - Automatic FID measurement after 3 seconds using non-intrusive hidden element
- **Improved LCP Detection** - Better LCP measurement using renderTime/loadTime with validation
- **Enhanced Debug Logging** - Detailed console logs for all metric measurements when debug mode is enabled
- **SEO Tab** - Comprehensive SEO analysis in debug overlay:
  - Title and meta description with length validation
  - Canonical URL and robots meta detection
  - X-Robots-Tag header check via fetch
  - Indexability status badge
  - Open Graph and Twitter Card validation
  - Structured Data (JSON-LD) parsing with schema-specific warnings
  - Heading outline with H1 count validation
  - Image alt text and dimension checks
  - Copyable SEO report for bug tickets

### Improved
- **LCP Measurement** - Now uses `renderTime || loadTime` instead of just `startTime` for more accurate results
- **LCP Finalization** - Reduced timeout from 3s to 2s for faster final values
- **FID Simulation** - Creates invisible, non-interactive button element:
  - Uses `pointer-events: none` to prevent accidental clicks
  - Positioned off-screen with `left: -9999px`
  - `aria-hidden="true"` and `tabindex="-1"` for accessibility
  - Automatically cleaned up after measurement
- **Console Buffer** - Increased from 50 to 200 message history
- **Radial Gauge** - Performance score displayed as circular gauge with gradient

### Fixed
- **LCP Not Updating** - Fixed renderTime/loadTime extraction for more reliable measurements
- **FID Blocking** - FID simulation now uses isolated element that can't interfere with real user interactions

## [0.1.4] - 2024-12-09

### Added
- **Radial Gauge Visualization** - Performance score displayed as circular gauge with gradient
- **Improved Metrics Layout** - Grouped sections for Core Web Vitals, Additional Metrics, and Navigation Timing
- **Expandable Accessibility Details** - Click to expand issue categories with individual element details
- **Learn More Links** - Direct links to web.dev documentation for each accessibility issue type
- **Quick Wins Section** - Actionable tips based on detected accessibility issues
- **Metric Descriptions** - Each metric now shows a helpful hint (e.g., "Loading performance", "Visual stability")

### Improved
- **Better Initial State for Metrics** - CLS shows 0.000 (good) by default instead of "waiting"
- **Interaction-based Metrics** - FID/INP now show clear call-to-action ("Click or tap to measure")
- **Enhanced Color Scheme** - Gradient progress bars, improved contrast, purple scrollbar accent
- **Scrollbar Styling** - Custom styled scrollbars matching the dark theme
- **Pulse Animation** - Loading indicators now have smooth pulse animation
- **Score Counter** - Shows how many metrics are measured (e.g., "4/6 metrics measured")

### Fixed
- **CLS Initial Display** - No longer shows "Monitoring layout shifts..." when there are no shifts

## [0.1.3] - 2024-12-01

### Added
- **Console Tab** - New Console tab displaying browser console output (log, info, warn, error)
- **Custom Logging API** - `webVitalsLog.info()`, `.warn()`, `.error()` for custom messages
- **Dockable Console** - Bottom-docked console with draggable height

### Improved
- **Responsive Mode** - Auto-updates position on viewport resize without refresh
- **Desktop Position Options** - All four corners (top/bottom, left/right)

## [0.1.2] - 2024-11-18

### Added
- **Mobile responsive design** - Full-width footer bar for viewports < 700px
- **Navigation Timing Metrics** - DNS, TCP, DOM, LOAD measurements
- **LCP timeout** - Finalizes after 3 seconds of no changes
- **Close button** - Dismissible overlay (reopens on reload)

### Fixed
- **TTFB calculation** - Now correctly measures from fetchStart to responseStart
- **Mobile layout** - Footer bar slides up instead of overlaying content
- **Metrics visibility** - All metrics show immediately or with pending state

### Improved
- Mobile UX with slide-up animation
- More comprehensive timing metrics available immediately
- Better visual hierarchy with grouped metrics

## [0.1.1] - 2024-11-18

### Added
- Note about extraction from [astro-v5-template](https://github.com/casoon/astro-v5-template)

### Improved
- Redesigned accessibility tab to show summary counts instead of detailed lists
- Enhanced details tab with session info, memory visualization, and network status
- Cleaner UI for accessibility issues with grouped counts by type
- Added helpful tips in accessibility tab
- Better network status indicators with visual quality markers
- Memory usage now shows percentage with color-coded progress bar
- Configuration status visible in details tab

### Fixed
- Accessibility tab now shows clean issue counts instead of verbose element details
- Details tab now provides useful session and configuration information
- Improved readability with better spacing and organization

## [0.1.0] - 2024-11-18

### Added
- **Initial Release** with Core Features:
  - All Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
  - Debug overlay with real-time metrics
  - Analytics endpoint support
  - Zero dependencies implementation
  - TypeScript support with full type definitions
  - Position configuration for debug overlay
  - Color-coded status indicators

- **Advanced Features**:
  - **Batch Reporting**: Collect and send metrics in batches
  - **Sampling Rate Control**: Configurable user sampling (0-1)
  - **Extended Metrics**: Long Tasks, Memory usage, Network info
  - **Smart Detection**: Rage click and dead click detection
  - **Performance Budgets**: Set and monitor metric thresholds

- **Accessibility Support**: WCAG 2.1 compliance
  - Semantic HTML with ARIA attributes
  - Full keyboard navigation
  - Screen reader announcements
  - High contrast colors
  - Focus indicators

---

## Support

For issues and feature requests, please visit:
https://github.com/casoon/astro-webvitals/issues
