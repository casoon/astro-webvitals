---
title: Accessibility checks
description: Two small, browser-side checks – the overlay heuristic and the dashboard page checks – and what they don't cover.
order: 3
---

The package has two independent checks. Both run in the browser against the rendered page. Neither is a WCAG audit or a conformance claim.

## Overlay heuristic

With `debug`, `checkAccessibility` defaults to `true` and the overlay lists likely issues. `highlightAccessibility` outlines the affected elements on the page.

```astro
<WebVitals
  debug={import.meta.env.DEV}
  checkAccessibility={true}
  highlightAccessibility={true}
/>
```

| Check | Reported as | Reference |
| --- | --- | --- |
| `img` without `alt` attribute | Image missing alt attribute | 1.1.1 |
| `button` without text and without `aria-label` | Button has no accessible text | 4.1.2 |
| `input`, `select`, `textarea` without `label[for]` or `aria-label` | Form control missing label | 1.3.1 |
| Heading level skipped, e.g. `h1` → `h3` | Heading level skipped | 1.3.1 |
| `a[href]` without text and without `aria-label` | Link has no accessible text | 2.4.4 |

The [heuristic example](../../../showcase/accessibility-heuristic/) shows its findings on a sample page.

Limits: it does not evaluate keyboard flows, focus, contrast, `aria-labelledby`, or names derived from surrounding markup. A control wrapped in a `<label>` without `for`, or a link whose only content is an image with `alt` text, is reported even though it has an accessible name.

Keep `checkAccessibility` tied to development. In a production build it would load the overlay for visitors.

## Dashboard page checks

With `dashboard`, every page records a snapshot for the [local dashboard](../dashboard/):

| Check | Passes when |
| --- | --- |
| Title | exactly one non-empty `<title>` |
| Description | exactly one non-empty `meta name="description"` |
| Canonical | exactly one `link rel="canonical"` with an `href` |
| Language | `<html lang>` is set |
| H1 | exactly one `h1` |
| Open Graph | `og:title`, `og:description` and `og:image` are present |
| Skip link | a link to `#main` exists |
| Image alt | every `img` has an `alt` attribute |
| Link text | every `a[href]` has text, `aria-label`, `aria-labelledby` or an image with `alt` |
| Form labels | every control has a `<label>` or `aria-label` |
| Structured data | informational; reports JSON-LD blocks that don't parse |

See the [page checks example](../../../showcase/page-checks/).

## Use a real audit as well

Validate important pages with manual testing – keyboard, screen reader, zoom – and a dedicated tool such as axe. The two checks here catch a few common slips early; they don't replace either.
