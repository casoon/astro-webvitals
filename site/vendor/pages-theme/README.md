# @casoon/pages-theme

Shared Astro theme for the GitHub Pages sites of CASOON open-source projects: one layout,
one set of tokens and components, and generated routes for docs, showcase, changelog and 404.
Projects supply content, examples and configuration.

## Project layout

```
<repo>/
├── site/                 # Astro project (this theme as dependency)
│   ├── astro.config.mjs  # casoonPages({ … })
│   └── src/
│       ├── pages/index.astro   # start page, composed from theme components
│       ├── showcase.ts         # exports `examples`
│       └── content.config.ts   # docs collection
├── docs/                 # Markdown / MDX, versioned with the code
├── examples/             # fixtures, shared with the test suite
├── CHANGELOG.md          # Keep a Changelog
└── .github/workflows/pages.yml
```

A complete example lives in `starter/` of the gh-pages-template repository.

## Distribution

Not published to a registry (`"private": true`). `scripts/sync-theme.sh` in gh-pages-template
copies this folder into a project as `site/vendor/pages-theme/` and sets the dependency to
`"file:./vendor/pages-theme"`. `vendor/pages-theme/SOURCE` records the copied version and
commit. Change the theme in gh-pages-template only, then sync; run `pnpm install` afterwards so
the copy in `node_modules` is refreshed.

## Setup

```js
// site/astro.config.mjs
import casoonPages from '@casoon/pages-theme';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://casoon.github.io/runemark',
  base: '/runemark/',
  integrations: [
    casoonPages({
      name: 'runemark',
      description: 'Renders ANSI terminal output as accessible, script-free HTML.',
      repo: 'casoon/runemark',
      version: '0.4.2',
      packages: [{ label: 'crates.io', href: 'https://crates.io/crates/runemark' }],
      docsGroups: { 'getting-started': 'Getting started', reference: 'Reference' },
    }),
  ],
});
```

```ts
// site/src/content.config.ts
import { docsCollection } from '@casoon/pages-theme/content';
export const collections = { docs: docsCollection() };
```

### Options

| Option | Default | Purpose |
| --- | --- | --- |
| `name`, `description`, `repo` | – | Header, meta tags, GitHub links, JSON-LD |
| `version` | – | Header badge, "Docs for vX" |
| `license` | `MIT` | Footer, JSON-LD |
| `branch` | `main` | "Edit this page" links |
| `accent` | CASOON petrol | `{ light, dark }` project colour; needs 4.5:1 on `#f6f6f5` and `#101010` |
| `packages` | `[]` | Registry and API-doc links in the footer |
| `docsGroups` | `{}` | Sidebar groups: folder in `docs/` → label, in order. Root pages join the first group |
| `changelog` | `../CHANGELOG.md` | Path relative to `site/`, or `false` |
| `showcase` | `./src/showcase.ts` | Module exporting `examples: ShowcaseExample[]`, or `false` |

### Routes

| Route | Source |
| --- | --- |
| `/` | the project's `src/pages/index.astro` |
| `/docs/…` | `docs/**/*.{md,mdx}`; `docs/index.md` becomes `/docs/` |
| `/showcase/`, `/showcase/<slug>/` | `examples` from the showcase module |
| `/changelog/` | `CHANGELOG.md` (`## [x.y.z] - YYYY-MM-DD`, `### Added` …, `### Breaking`) |
| `/404` | theme |

### Docs frontmatter

`title` (required), `description` (lead paragraph), `order` (position in its group),
`sidebarLabel`.

MDX pages use theme components **without importing them**. `docs/` sits outside `site/` and
cannot resolve packages, so the docs route provides all components. Write links between docs
pages relative (`../quickstart/`), because the base path differs per project.

## Components

Import from `@casoon/pages-theme/components` in `.astro` files; available directly in MDX.

| Component | Use |
| --- | --- |
| `Hero` | Title, lead, default slot (install, badges), `output` slot (real output) |
| `Install` | Install command per ecosystem, CSS-only tabs, copy button |
| `Badge`, `Badges` | Static badges (no external badge services) |
| `Facts` | Verifiable key figures |
| `Features` | 3–5 core points |
| `BuildOutput` | One real build output on the start page |
| `Quickstart` | Steps, docs link, code slot |
| `CodeBlock` | Build-time highlighting (Shiki, theme-aware), copy button |
| `Terminal` | `ansi` prop (converted at build time) or pre-rendered HTML as slot |
| `Callout` | `note`, `tip`, `caution`, `deprecated` |
| `Tabs` | CSS-only tabs, one named slot per tab id |
| `ApiEntry` | API overview entry; item-level docs stay on docs.rs / TypeDoc |
| `Swatch` | Colour token preview |
| `ExamplePanel` | Input next to output; used by the showcase routes |

`@casoon/pages-theme/ansi` exports `ansiToHtml` and `escapeAnsi` for projects without their
own renderer. `@casoon/pages-theme/layouts/Base.astro` wraps custom pages in the frame.

## Rules the theme enforces

- No external requests: fonts are bundled (Onest, JetBrains Mono, Latin subset), no CDNs,
  embeds, analytics or cookies.
- JavaScript: two small inline scripts (theme before first paint; theme toggle and copy
  buttons). Tabs work without JavaScript.
- Footer on every page: "Ein Projekt von CASOON · Jörn Seidel", licence, Impressum and
  Datenschutz (casoon.de), "Weitere Projekte" (casoon.dev).
- Light and dark theme, following `prefers-color-scheme` until the visitor chooses.

## Abweichungen vom Entwurf

Grundlage ist das Claude-Design-Projekt „CASOON Pages Template“. Bewusst geändert:

- Schriften selbst gehostet statt Google Fonts (Recht, plan/04); JetBrains Mono 600 → 500.
- Kein radialer Verlauf als Seitenhintergrund, keine gestreifte Platzhalterfläche: die Fläche
  „Generated at build time“ zeigt echte Ausgabe (`SLOP-DECOR-GRADIENT`, `JUDGE-STOCK`).
- Kartenschatten-Unschärfe 32 → 14 px (`SLOP-GHOST-CARD`), Schrift mindestens 12 px
  (`SLOP-TINY-TEXT`).
- Kontrast 4.5:1: Akzent hell `rgb(0 131 148)` → `rgb(0 118 133)`, `--muted` `#6d7171` →
  `#656969`, gedimmter Terminaltext `#6f767b` → `#8b9297`.
- Footer mit echtem CASOON-Logo (hell/dunkel) statt Farbquadrat; alle `#`-Links durch echte
  Ziele ersetzt.
- Tabs ohne JavaScript (Radio-Buttons); „Last updated“ in der Doku entfällt vorerst.
- Auf schmalen Bildschirmen rückt die Navigation in eine zweite Zeile.
