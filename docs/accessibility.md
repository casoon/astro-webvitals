# Accessibility heuristic

With `debug` enabled, the overlay can flag a small set of likely issues: missing `alt` attributes, unlabeled controls, empty buttons or links, and skipped heading levels.

```astro
<WebVitals
  debug={import.meta.env.DEV}
  checkAccessibility={true}
  highlightAccessibility={true}
/>
```

This is a development heuristic, not a WCAG audit or a conformance claim. In particular it does not evaluate keyboard flows, contrast, semantics beyond the listed checks, `aria-labelledby`, or an accessible name derived from surrounding markup. Validate important pages with manual testing and a dedicated accessibility tool.
