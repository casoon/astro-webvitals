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
| `tagline` | – | A few words for the start page's `<title>` and the OG image; see „Search engines" |
| `website` | – | The project's landing page (`https://judge.casoon.de`): header, footer, JSON-LD `sameAs` |
| `catalog` | repository name | Slug of the project's entry on casoon.dev (`#projekt-<slug>`), linked in the footer; `false` for none |
| `version` | the project's manifest | Header badge, "Docs for vX"; see „Version" | 
| `license` | `MIT` | SPDX id for footer and JSON-LD; `false` for proprietary code names no licence |
| `branch` | `main` | "Edit this page" links |
| `accent` | CASOON petrol | `{ light, dark }` project colour; needs 4.5:1 on `#f6f6f5` and `#101010` |
| `packages` | `[]` | Registry and API-doc links in the footer |
| `docsGroups` | `{}` | Sidebar groups: folder in `docs/` → label, in order. Root pages join the first group |
| `changelog` | `../CHANGELOG.md` | Path relative to `site/`, or `false` |
| `showcase` | `./src/showcase.ts` | Module exporting `examples: ShowcaseExample[]`, or `false` |
| `demo` | `false` | Header label of a live demo page; the project supplies `src/pages/demo.astro` |
| `mdxComponents` | – | Module exporting `components` for docs MDX, next to the theme's; see „Docs frontmatter" |
| `lang` | `en` | `en` or `de`: `<html lang>` and the theme's own UI strings (`lib/i18n.ts`); props passed by the project win |
| `showcaseLead` | – | Lead paragraph of the showcase overview, instead of the theme's generic one |

#### Version

Left out, `version` comes from the manifest next to `site/`: `version` in `package.json`, else
`[package]` or `[workspace.package]` in `Cargo.toml`. So the number is maintained in one place,
and a release updates the site by itself. Pages read it as `config.version` from
`virtual:casoon-pages/config` — a start page that shows the release in a `Badge` takes it from
there instead of typing it out.

A wrong number is worse than none, so anything that cannot be read with certainty yields none:
a workspace whose version sits in a member crate, a `package.json` without `version`, a project
with neither manifest. Those pass `version` themselves, and `false` shows none at all.

### Routes

| Route | Source |
| --- | --- |
| `/` | the project's `src/pages/index.astro` |
| `/docs/…` | `docs/**/*.{md,mdx}`; `docs/index.md` becomes `/docs/` |
| `/showcase/`, `/showcase/<slug>/` | `examples` from the showcase module |
| `/changelog/` | `CHANGELOG.md` (`## [x.y.z] - YYYY-MM-DD`, `### Added` …, `### Breaking`) |
| `/demo/` | the project's `src/pages/demo.astro`, linked once `demo` is set |
| `/404` | theme |
| `/sitemap.xml`, `/og.png` | written after the build when `site` is set; see „Search engines" |

### Docs frontmatter

`title` (required), `description` (lead paragraph), `order` (position in its group),
`sidebarLabel`.

MDX pages use theme components **without importing them**. `docs/` sits outside `site/` and
cannot resolve packages, so the docs route provides all components. A project adds its own
with `mdxComponents: './src/mdx-components.ts'` — a module exporting
`components = { Name: Component }` — for anything only the site can build, such as a
component rendering the project's own output. Its names win over the theme's. Write links between docs
pages relative (`../quickstart/`), because the base path differs per project.

## Components

Import from `@casoon/pages-theme/components` in `.astro` files; available directly in MDX.

| Component | Use |
| --- | --- |
| `Hero` | Title, lead, default slot (install, badges), `output` slot (real output); `layout`, `command` and `tone` pick the variant |
| `Install` | Install command per ecosystem, CSS-only tabs, copy button; long commands wrap at spaces and after a `/` |
| `Badge`, `Badges` | Static badges (no external badge services) |
| `Facts` | Verifiable key figures |
| `Features` | 3–5 core points |
| `FileSet` | The files a run produced: `tabs`, `grid` or `rail` view |
| `BuildOutput` | One real build output on the start page |
| `Quickstart` | Steps, docs link, code slot |
| `CodeBlock` | Build-time highlighting (Shiki, theme-aware), copy button |
| `Terminal` | `ansi` prop (converted at build time) or pre-rendered HTML as slot |
| `Callout` | `note`, `tip`, `caution`, `deprecated` |
| `Tabs` | CSS-only tabs, one named slot per tab id |
| `ApiEntry` | API overview entry; item-level docs stay on docs.rs / TypeDoc |
| `Swatch` | Colour token preview |
| `ExamplePanel` | Input next to output; used by the showcase routes |
| `Demo` | Stage for the project running live in the page; see „Live demo" |

`@casoon/pages-theme/ansi` exports `ansiToHtml` and `escapeAnsi` for projects without their
own renderer. `ansiToHtml` renders the 16-colour palette as classes (so the theme's colours
apply) and 256-colour and 24-bit colour — foreground and background — as inline styles. `@casoon/pages-theme/layouts/Base.astro` wraps custom pages in the frame, and
`@casoon/pages-theme/url` exports `url()` — a project page that links or loads something
site-internal needs it, because the base path changes per project.

## Hero variants

`Hero` carries four start-page openings. All of them use the same props; `layout`, `command`
and `tone` decide which one, and what goes into the slots decides the rest. The `output`
slot takes the project's real output — a `Terminal`, or `FileSet` when the project writes
files.

| Variant | Hero | `output` slot |
| --- | --- | --- |
| Artefacts | `layout="split"` (default) | `FileSet view="grid"` — one card per file |
| Pipeline | `layout="stack" command="<cmd>"` plus a `source` slot | `FileSet view="tabs"` — one pane per file |
| Colour field | `tone="invert"` on any layout | `Terminal`, or whatever the project shows |
| Editorial | `layout="editorial"` | `FileSet view="rail"` — names and one line each |

The split layout gives the text column a little more than half from 900 px up, with a title
size that fits about 40 characters on two lines at 1440 px; below 900 px text and output stack.

The stack layout reads as a pipeline from top to bottom: the `source` slot (usually a
`CodeBlock` with the configuration), the `command` pill, then the output — each over the full
width of the container. Side by side the three do not fit inside `--max`: the source is cut off
mid-line and the file names wrap to a second row. Without a `source` slot the band is just the
output.

`FileSet` takes `files` — `id`, `name` and optional `path`, `size`, `note` — and one named slot
per `id` holding that file's content, the same way `Tabs` does. The `rail` view needs no slots.
The tab strip stays on one row at every width: below 640 px the names lose their suffix
(`robots.txt` → `robots`, and only when the stems stay distinct), and a strip that still does not
fit scrolls sideways. Each pane scrolls on its own for long lines.

`tone="invert"` redefines the colour tokens inside the hero, so `Install`, `Badges` and
`FileSet` follow without knowing about it. The ground is `--invert-bg` with `--invert-accent`,
the same in both colour schemes.

## Showcase descriptions

`description` is plain text with one piece of markup: `` `backtick spans` `` become inline
code on the detail page and the overview cards, styled like inline code in the docs. Everything
else is escaped, so a description cannot inject HTML. In the meta description the backticks are
dropped. Descriptions without backticks render as before.

## Large showcases

A showcase with many examples gets two optional fields per `ShowcaseExample`:

- `group`: the heading the example is listed under. Examples of one group appear together, groups in
  the order of their first example, with a jump list at the top of the overview.
- `preview`: HTML for a small preview, typically a lazily loaded image. An example with a preview
  appears on the overview as a card (title, description, preview, link to the detail page);
  input and output stay on the detail page. Without it the overview shows the full panel as before.

## Live demo

The showcase shows what a package produced at build time. A demo shows the package itself,
running in the visitor's browser — for projects whose point only becomes visible in motion.

Set `demo: '<label>'` for the header entry and write `site/src/pages/demo.astro`; the theme
injects no route, so the page is the project's own. Wrap the running instance in the `Demo`
component and put everything it needs, including its `<script is:inline>`, in the default
slot.

The component marks its stage `data-demo`, and that mark carries two exceptions from the
rules below — nowhere else on the site:

- The demo's own scripts live inside the stage. Outside it, the two inline scripts stay the
  limit.
- `check-site.cjs` excludes the stage from axe. A demo may deliberately exhibit what the
  project reports on; a broken form inside the stage is the exhibit, not a defect of the
  page.

Everything else still holds, the origin rule above all: a demo loads its code from the site
itself. One that needs a CDN cannot ship here.

## Search engines

Each page gets canonical URL, meta description, Open Graph and `twitter:card`
(`summary_large_image`), and JSON-LD `SoftwareSourceCode` with `url`, `codeRepository`, `sameAs`
(`website` and the `packages` links) and CASOON as author and publisher. All of it needs `site`
in `astro.config.mjs`.

- **Title:** the start page is `<name> – <tagline> | CASOON`, other pages `<page> · <name>`.
  Without `tagline` the start page is `<name> | CASOON`. Keep the tagline to a few words, so the
  title stays under about 60 characters; `description` remains the meta description.
- **OG image:** `og.png` (1200×630) is rendered at build time from name, tagline, description
  and address, in the theme's fonts and the dark theme, with the project's dark `accent` as edge.
- **Sitemap:** `sitemap.xml` lists every built page except 404, linked from the head. A project
  that writes its own — `@casoon/astro-site-files` does — keeps it: the theme skips the file when
  it already exists. That works only when the project's integration is listed before
  `casoonPages()` in `astro.config.mjs`, because the hooks run in that order.
- **Links out:** the header shows `website` next to the project name; the footer links
  `website`, the project's catalog entry on casoon.dev and the catalog itself, all with
  descriptive text in the page's `lang`.

The root `https://casoon.github.io/` comes from the repository `casoon/casoon.github.io`: an
overview of the project sites, the only `robots.txt` crawlers read for the domain (one `Sitemap:`
line per project), and the Google Search Console verification. Its URL-prefix property
`https://casoon.github.io/` covers every project site, so a project needs no property and no
verification file of its own. For a new site:

1. Deploy it and check that `https://casoon.github.io/<repo>/sitemap.xml` answers 200.
2. In `casoon/casoon.github.io`, add `Sitemap: https://casoon.github.io/<repo>/sitemap.xml` to
   `robots.txt` and the site to `index.html`, then push.
3. In the property `https://casoon.github.io/`, *Sitemaps* → submit `<repo>/sitemap.xml`.

Never set a custom domain on `casoon/casoon.github.io`: GitHub would redirect every project site
to it as well.

## Rules the theme enforces

- No external requests: fonts are bundled (Onest, JetBrains Mono, Latin subset), no CDNs,
  embeds, analytics or cookies.
- JavaScript: two small inline scripts (theme before first paint; theme toggle and copy
  buttons). Tabs work without JavaScript. The one exception is a `Demo` stage, see above.
- Footer on every page: "Ein Projekt von CASOON · Jörn Seidel", licence, Impressum and
  Datenschutz (casoon.de), the project catalog on casoon.dev.
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
- Auf schmalen Bildschirmen rückt die Navigation in eine zweite, einzeilige Zeile, die seitlich
  scrollt, wenn sie nicht passt; der Theme-Umschalter bleibt neben dem Namen.
