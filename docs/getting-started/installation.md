---
title: Installation
description: Install the package and add the component once to your shared layout.
order: 1
---

## Requirements

- Astro 4, 5, 6 or 7 (peer dependency `^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0`).
- Node.js 18.17 or later.

The package ships its TypeScript source; Astro compiles it together with your project. Its only runtime dependency is [`web-vitals`](https://github.com/GoogleChrome/web-vitals).

## Install

```bash
pnpm add @casoon/astro-webvitals
```

```bash
npm install @casoon/astro-webvitals
```

## Add the component

Render `<WebVitals />` once, in the layout every page uses, immediately before `</body>`:

```astro
---
import { WebVitals } from '@casoon/astro-webvitals';
---

<html lang="en">
  <body>
    <slot />
    <WebVitals endpoint="/api/analytics/vitals" sampleRate={0.1} />
  </body>
</html>
```

Rendering it more than once is harmless: the client initializes only once per page.

## When it renders

- In `astro build` output the component always renders.
- In `astro dev` it renders only when `trackInDev`, `debug`, `consoleDock`, `highlightAccessibility` or `dashboard` is set, so local development doesn't produce reports by accident.

## What it adds to the page

Two script tags: an inline script with the resolved configuration, and a module script that Astro bundles and serves from your own origin, `web-vitals` included. The [default output](../../../showcase/default-output/) shows both, captured from a real build.

If your site sends a Content Security Policy, allow the inline script, for example with its hash, and your own origin as a script source.

Next: [Quickstart](../quickstart/).
