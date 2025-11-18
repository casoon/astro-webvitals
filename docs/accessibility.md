# Accessibility Features

@casoon/astro-webvitals is built with accessibility in mind, following WCAG 2.1 guidelines.

## Built-in Accessibility Features

### 1. Semantic HTML and ARIA

The debug overlay uses proper semantic HTML and ARIA attributes:

```html
<!-- Automatic ARIA attributes -->
<div role="status" 
     aria-label="Web Vitals Performance Metrics" 
     aria-live="polite"
     tabindex="0">
  <!-- Content -->
</div>
```

### 2. Keyboard Navigation

Full keyboard support for the debug overlay:

- **Tab**: Navigate through interactive elements
- **Escape**: Close the overlay
- **Enter/Space**: Activate buttons

```astro
<WebVitals 
  debug={true}
  accessible={true} <!-- Enabled by default -->
/>
```

### 3. Screen Reader Support

The component provides meaningful information for screen readers:

- Status updates announced via `aria-live`
- Descriptive labels for all metrics
- Context for performance indicators

### 4. Visual Accessibility

#### High Contrast
The debug overlay maintains WCAG AA contrast ratios:
- Text: 7:1 contrast ratio minimum
- Interactive elements: Clear focus indicators
- Status colors: Distinguishable without color alone

#### Focus Management
```css
/* Automatic focus styles */
:focus {
  outline: 2px solid #60A5FA;
  outline-offset: 2px;
}
```

#### Reduced Motion
Respects user preferences:
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### 5. Customizable Labels

Override default ARIA labels:

```astro
<WebVitals 
  ariaLabel="Site performance metrics dashboard"
  debug={true}
/>
```

## Accessibility Configuration

### Basic Setup
```astro
<!-- Accessibility enabled by default -->
<WebVitals debug={true} />
```

### Custom Configuration
```astro
<WebVitals 
  debug={true}
  accessible={true}
  ariaLabel="Custom performance metrics"
  position="bottom-left" <!-- Avoid overlapping content -->
/>
```

### Disable for Testing
```astro
<!-- Not recommended for production -->
<WebVitals 
  debug={true}
  accessible={false}
/>
```

## Best Practices

### 1. Overlay Positioning
Position the overlay to avoid covering important content:

```astro
<WebVitals 
  debug={true}
  position="bottom-right" <!-- Less likely to cover navigation -->
/>
```

### 2. Alternative Formats
Provide alternative ways to access metrics:

```javascript
// API endpoint for programmatic access
app.get('/api/metrics/current', (req, res) => {
  res.json({
    metrics: getCurrentMetrics(),
    timestamp: Date.now()
  });
});
```

### 3. Documentation
Inform users about the overlay:

```html
<!-- In your help documentation -->
<section>
  <h2>Performance Monitoring</h2>
  <p>
    When debug mode is enabled, performance metrics appear in an overlay.
    Press <kbd>Escape</kbd> to dismiss or use the close button.
  </p>
</section>
```

## WCAG 2.1 Compliance

### Level A Compliance ✅
- [x] Alternative text for icons
- [x] Keyboard accessible
- [x] Focus order logical
- [x] Page language identified

### Level AA Compliance ✅
- [x] Contrast ratio 7:1 for normal text
- [x] Contrast ratio 4.5:1 for large text
- [x] Focus visible
- [x] Consistent navigation

### Level AAA Features
- [x] Contrast ratio 7:1+ for all text
- [x] No reliance on color alone
- [x] Context-sensitive help available

## Testing Accessibility

### Manual Testing Checklist

1. **Keyboard Navigation**
   - [ ] Tab through all elements
   - [ ] Escape closes overlay
   - [ ] No keyboard traps

2. **Screen Reader Testing**
   - [ ] NVDA (Windows)
   - [ ] JAWS (Windows)
   - [ ] VoiceOver (macOS/iOS)
   - [ ] TalkBack (Android)

3. **Visual Testing**
   - [ ] High contrast mode
   - [ ] Zoom to 200%
   - [ ] Color blind modes

### Automated Testing

```javascript
// Using axe-core for testing
import { AxePuppeteer } from '@axe-core/puppeteer';
import puppeteer from 'puppeteer';

test('WebVitals overlay is accessible', async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  const results = await new AxePuppeteer(page).analyze();
  expect(results.violations).toHaveLength(0);
  
  await browser.close();
});
```

### Browser Extensions
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Common Issues and Solutions

### Issue: Overlay covers important content
**Solution**: Change position or make dismissible
```astro
<WebVitals debug={true} position="bottom-left" />
```

### Issue: Metrics not announced by screen reader
**Solution**: Ensure accessible prop is enabled
```astro
<WebVitals debug={true} accessible={true} />
```

### Issue: Poor contrast in light mode
**Solution**: The overlay uses a dark background by default for consistency

## Future Enhancements

- [ ] Customizable color schemes
- [ ] Sound notifications for budget exceeded
- [ ] Braille display optimization
- [ ] Voice control integration
- [ ] Exportable metrics in accessible formats

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices-1.1/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)