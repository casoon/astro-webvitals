// @ts-check
import { webVitalsDashboard } from '@casoon/astro-webvitals/integration';
import casoonPages from '@casoon/pages-theme';
import { defineConfig } from 'astro/config';

// Project page: https://casoon.github.io/astro-webvitals/ — `base` is the GitHub Pages path.
export default defineConfig({
  site: 'https://casoon.github.io/astro-webvitals',
  base: '/astro-webvitals/',
  integrations: [
    casoonPages({
      name: 'astro-webvitals',
      description:
        'Web Vitals monitoring for Astro: official metrics, consent-gated reporting to your own endpoint, a local dashboard and a development overlay.',
      tagline: 'Web Vitals monitoring for Astro',
      repo: 'casoon/astro-webvitals',
      license: 'MIT',
      demo: 'Live demo',
      packages: [{ label: 'npm', href: 'https://www.npmjs.com/package/@casoon/astro-webvitals' }],
      docsGroups: {
        'getting-started': 'Getting started',
        guides: 'Guides',
        reference: 'Reference',
      },
    }),
    // The live demo's dashboard. Only /demo/ renders the component, so the sitemap pass
    // would stop on the first theme page.
    webVitalsDashboard({ sitemapPass: false }),
  ],
});
