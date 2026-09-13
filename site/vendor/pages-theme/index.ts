import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import type { AstroIntegration } from 'astro';

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
  /** GitHub repository as "owner/name". */
  repo: string;
  /** Current release, shown in the header and on docs pages. */
  version?: string;
  /** SPDX licence identifier. Default: "MIT". */
  license?: string;
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
}

export interface ResolvedConfig
  extends Required<Omit<CasoonPagesOptions, 'accent' | 'changelog' | 'showcase'>> {
  accent: { light: string; dark: string } | null;
  /** Absolute path to CHANGELOG.md, or null when disabled. */
  changelog: string | null;
  hasShowcase: boolean;
}

const CONFIG_ID = 'virtual:casoon-pages/config';
const SHOWCASE_ID = 'virtual:casoon-pages/showcase';

export default function casoonPages(options: CasoonPagesOptions): AstroIntegration {
  return {
    name: '@casoon/pages-theme',
    hooks: {
      'astro:config:setup': ({ config, updateConfig, injectRoute }) => {
        const root = fileURLToPath(config.root);
        const showcasePath =
          options.showcase === false
            ? null
            : resolve(root, options.showcase ?? './src/showcase.ts');

        const resolved: ResolvedConfig = {
          name: options.name,
          description: options.description,
          repo: options.repo,
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
    },
  };
}
