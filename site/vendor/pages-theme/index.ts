import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import type { AstroIntegration } from 'astro';
import type { Lang } from './lib/i18n';
import { renderOgImage } from './lib/og';

export interface PackageLink {
  /** Label shown in the footer and as badge, e.g. "crates.io" or "npm". */
  label: string;
  href: string;
}

export interface CasoonPagesOptions {
  /** Project name as shown in the header, e.g. "runemark". */
  name: string;
  /** One sentence; used as default meta description. */
  description: string;
  /** A few words for the start page's `<title>` and the OG image: "<name> – <tagline> | CASOON". */
  tagline?: string;
  /** The project's own landing page, e.g. "https://judge.casoon.de". Linked in header and footer. */
  website?: string;
  /** Slug of the project's entry on casoon.dev (`#projekt-<slug>`), or false. Default: repository name. */
  catalog?: string | false;
  /** GitHub repository as "owner/name". Omit for a private repository: no GitHub or edit links. */
  repo?: string;
  /** Current release, shown in the header and on docs pages. */
  version?: string;
  /** SPDX licence identifier, or false for proprietary code (no licence named). Default: "MIT". */
  license?: string | false;
  /** Default branch, used for "Edit this page" links. Default: "main". */
  branch?: string;
  /** Project accent colour for light and dark theme. Default: CASOON petrol. Both must meet 4.5:1 on the page background. */
  accent?: { light: string; dark: string };
  /** Registry and API-doc links (crates.io, npm, docs.rs …). */
  packages?: PackageLink[];
  /** Docs sidebar groups: folder name in docs/ → label, in display order. Root-level pages join the first group. */
  docsGroups?: Record<string, string>;
  /** Path to the docs folder relative to the repository root, for edit links. Default: "docs". */
  docsDir?: string;
  /** Path to CHANGELOG.md relative to the site root, or false. Default: "../CHANGELOG.md". */
  changelog?: string | false;
  /** Module exporting `examples: ShowcaseExample[]`, relative to the site root, or false. Default: "./src/showcase.ts". */
  showcase?: string | false;
  /**
   * Live demo: the header label linking to /demo/, or false for none. Default: false.
   *
   * The page itself belongs to the project (`src/pages/demo.astro`) and wraps its
   * running instance in the `Demo` component — the theme only adds the entry.
   */
  demo?: string | false;
  /**
   * Module exporting `components: Record<string, AstroComponent>`, relative to the site
   * root, for docs MDX next to the theme's own. `docs/` cannot import anything, so this
   * is how a page reaches something only the site can build — a component rendering the
   * project's own output, say. Same name as a theme component: the project's wins.
   */
  mdxComponents?: string;
  /** Language of the theme's own UI strings and of `<html lang>`. Default: "en". */
  lang?: Lang;
  /** Lead paragraph of the showcase overview, instead of the theme's generic one. */
  showcaseLead?: string;
}

export interface ResolvedConfig
  extends Required<
    Omit<
      CasoonPagesOptions,
      'accent' | 'changelog' | 'showcase' | 'demo' | 'mdxComponents' | 'catalog'
    >
  > {
  accent: { light: string; dark: string } | null;
  /** Absolute path to CHANGELOG.md, or null when disabled. */
  changelog: string | null;
  hasShowcase: boolean;
  /** Header label of the demo page, or an empty string when there is none. */
  demo: string;
  /** casoon.dev catalog slug, or an empty string when there is none. */
  catalog: string;
}

const CONFIG_ID = 'virtual:casoon-pages/config';
const SHOWCASE_ID = 'virtual:casoon-pages/showcase';
const MDX_COMPONENTS_ID = 'virtual:casoon-pages/mdx-components';

export default function casoonPages(options: CasoonPagesOptions): AstroIntegration {
  let resolved: ResolvedConfig;
  /** Absolute URL of the site's base path, or null without `site`. */
  let site: URL | null = null;
  return {
    name: '@casoon/pages-theme',
    hooks: {
      'astro:config:setup': ({ config, updateConfig, injectRoute }) => {
        site = config.site ? new URL(config.base.replace(/\/?$/, '/'), config.site) : null;
        const root = fileURLToPath(config.root);
        const showcasePath =
          options.showcase === false
            ? null
            : resolve(root, options.showcase ?? './src/showcase.ts');

        resolved = {
          name: options.name,
          description: options.description,
          tagline: options.tagline ?? '',
          website: options.website ?? '',
          catalog:
            options.catalog === false ? '' : (options.catalog ?? options.repo?.split('/')[1] ?? ''),
          repo: options.repo ?? '',
          version: options.version ?? '',
          license: options.license ?? 'MIT',
          branch: options.branch ?? 'main',
          accent: options.accent ?? null,
          packages: options.packages ?? [],
          docsGroups: options.docsGroups ?? {},
          docsDir: options.docsDir ?? 'docs',
          changelog:
            options.changelog === false
              ? null
              : resolve(root, options.changelog ?? '../CHANGELOG.md'),
          hasShowcase: showcasePath !== null,
          demo: options.demo === false || options.demo === undefined ? '' : options.demo,
          lang: options.lang ?? 'en',
          showcaseLead: options.showcaseLead ?? '',
        };

        const route = (pattern: string, file: string) =>
          injectRoute({ pattern, entrypoint: `@casoon/pages-theme/routes/${file}` });
        route('/docs/[...slug]', 'docs/[...slug].astro');
        if (resolved.hasShowcase) {
          route('/showcase', 'showcase/index.astro');
          route('/showcase/[slug]', 'showcase/[slug].astro');
        }
        if (resolved.changelog) route('/changelog', 'changelog.astro');
        route('/404', '404.astro');

        const modules: Record<string, string> = {
          [CONFIG_ID]: `export default ${JSON.stringify(resolved)};`,
          [SHOWCASE_ID]: showcasePath
            ? `export { examples } from ${JSON.stringify(showcasePath)};`
            : 'export const examples = [];',
          [MDX_COMPONENTS_ID]: options.mdxComponents
            ? `export { components } from ${JSON.stringify(resolve(root, options.mdxComponents))};`
            : 'export const components = {};',
        };

        updateConfig({
          integrations: [mdx()],
          markdown: { shikiConfig: { theme: 'css-variables' } },
          vite: {
            plugins: [
              {
                name: 'casoon-pages-virtual',
                resolveId: (id: string) => (id in modules ? `\0${id}` : undefined),
                load: (id: string) =>
                  id.startsWith('\0') && id.slice(1) in modules ? modules[id.slice(1)] : undefined,
              },
            ],
            // docs/, examples/ and CHANGELOG.md live next to site/ in the project repository.
            server: { fs: { allow: [resolve(root, '..')] } },
          },
        });
      },
      // Sitemap and OG image need absolute URLs, so both depend on `site`.
      'astro:build:done': async ({ dir, pages }) => {
        const base = site;
        if (!base) return;
        // A project that writes its own sitemap keeps it: this one is the fallback, not the
        // authority. It only sees that file when the project's integration is listed first.
        const sitemap = new URL('sitemap.xml', dir);
        if (!existsSync(sitemap)) {
          const urls = pages
            .map((page) => page.pathname)
            .filter((pathname) => pathname !== '404/')
            .map((pathname) => `  <url><loc>${new URL(pathname, base).href}</loc></url>`);
          await writeFile(
            sitemap,
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
              `${urls.join('\n')}\n</urlset>\n`
          );
        }
        await writeFile(new URL('og.png', dir), await renderOgImage(resolved, base));
      },
    },
  };
}
