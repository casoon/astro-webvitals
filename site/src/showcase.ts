import type { ShowcaseExample } from '@casoon/pages-theme/showcase';

// Everything shown here is output of @casoon/astro-webvitals itself, captured by
// examples/capture.mjs: a static build of examples/demo/ and the package's page checks run
// against examples/pages/sample.html. This site does not run the component: the theme
// allows no scripts beyond its own two, and Web Vitals measured on a visitor's device are
// not reproducible build output, so no metric values are shown.
const raw = import.meta.glob<string>(
  [
    '../../examples/output/*',
    '../../examples/demo/astro.config.mjs',
    '../../examples/demo/src/pages/*.astro',
    '../../examples/pages/*.html',
  ],
  { query: '?raw', import: 'default', eager: true },
);

function file(path: string): string {
  const content = raw[`../../${path}`];
  if (content === undefined) throw new Error(`Missing fixture: ${path}`);
  return content;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Chunk {
  file: string;
  loading: 'static' | 'dynamic' | 'dashboard' | 'other';
  bytes: number;
  gzip: number;
}
interface Check {
  name: string;
  state: 'pass' | 'issue' | 'info';
  detail: string;
}
interface Issue {
  type: string;
  element: string;
  message: string;
  wcagLevel: string;
}

const bundle = JSON.parse(file('examples/output/bundle.json')) as { entry: string; chunks: Chunk[] };
const pageChecks = JSON.parse(file('examples/output/page-checks.json')) as { checks: Check[] };
const heuristic = JSON.parse(file('examples/output/a11y-heuristic.json')) as { issues: Issue[] };

export const kB = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`;

/** Gzip size of the entry script and its static imports: what every tracked page loads first. */
export const entryGzip = bundle.chunks
  .filter((chunk) => chunk.loading === 'static')
  .reduce((sum, chunk) => sum + chunk.gzip, 0);

/** The component's output on the default demo page, escaped for a terminal panel. */
export const defaultOutput = escapeHtml(file('examples/output/default.html'));

/** Page checks as terminal lines for the start page. */
export const checksAnsi = (() => {
  const colour = { pass: '32', issue: '33', info: '36' } as const;
  const width = Math.max(...pageChecks.checks.map((check) => check.name.length));
  return pageChecks.checks
    .map(
      ({ name, state, detail }) =>
        `\x1b[${colour[state]}m${state.padEnd(5)}\x1b[0m  ${name.padEnd(width)}  ${detail}`,
    )
    .join('\n');
})();

function table(caption: string, head: string[], rows: string[][]): string {
  const th = head.map((cell) => `<th scope="col" style="text-align:left">${escapeHtml(cell)}</th>`).join('');
  const tr = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<div role="region" tabindex="0" aria-label="${escapeHtml(caption)}" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><caption style="text-align:left;padding-bottom:8px">${escapeHtml(caption)}</caption><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}

const loadingLabel: Record<Chunk['loading'], string> = {
  static: 'with the page',
  dynamic: 'dynamic import()',
  dashboard: 'dashboard route',
  other: 'other',
};

const terminal = (path: string) => ({ html: escapeHtml(file(path)), kind: 'terminal' as const });

export const examples: ShowcaseExample[] = [
  {
    slug: 'default-output',
    title: 'Default component output',
    description:
      'What <WebVitals /> adds to a statically built page: the resolved configuration as an inline script and one module script from the site’s own origin. Captured from dist/index.html of the demo build, formatted for reading.',
    file: 'examples/output/default.html',
    tags: ['WebVitals', 'defaults', 'static build'],
    input: { code: file('examples/demo/src/pages/index.astro'), lang: 'astro' },
    output: terminal('examples/output/default.html'),
  },
  {
    slug: 'production-config',
    title: 'Production configuration',
    description:
      'Endpoint, a 10 % sample rate, a consent value and Do Not Track: the props end up in the page as plain configuration, so never pass secrets. Consent, Do Not Track and sampling are evaluated in the browser on every page load.',
    file: 'examples/output/production.html',
    tags: ['endpoint', 'sampleRate', 'consent', 'respectDnt'],
    input: { code: file('examples/demo/src/pages/production.astro'), lang: 'astro' },
    output: terminal('examples/output/production.html'),
  },
  {
    slug: 'dashboard-route',
    title: 'Dashboard route',
    description:
      'webVitalsDashboard() injects a prerendered route at /__web-vitals, marked noindex, nofollow. It reads what <WebVitals dashboard /> stored in the same browser.',
    file: 'examples/output/routes.txt',
    tags: ['webVitalsDashboard', 'integration', 'localStorage'],
    input: { code: file('examples/demo/astro.config.mjs'), lang: 'js' },
    output: terminal('examples/output/routes.txt'),
  },
  {
    slug: 'client-chunks',
    title: 'Client chunks',
    description:
      'JavaScript from the demo build, all served from the site’s own origin. The entry script and its static import load with every tracked page; web-vitals (or its attribution build), Long Tasks and the console tools are dynamic imports. The debug overlay, the accessibility heuristic and the SEO inspection are currently bundled into the entry script.',
    file: 'examples/output/bundle.json',
    tags: ['bundle', 'gzip', 'web-vitals'],
    input: { code: 'pnpm install\nnode examples/capture.mjs', lang: 'shell' },
    output: {
      kind: 'panel',
      html: table(
        'Chunks in dist/_astro of the demo build',
        ['File', 'Loaded', 'Bytes', 'Gzip'],
        bundle.chunks.map((chunk) => [
          chunk.file,
          loadingLabel[chunk.loading],
          String(chunk.bytes),
          String(chunk.gzip),
        ]),
      ),
    },
  },
  {
    slug: 'page-checks',
    title: 'Dashboard page checks',
    description:
      'The browser-visible checks the local dashboard records for each page, run by src/client/page-audit.ts against a sample page with deliberate gaps.',
    file: 'examples/output/page-checks.json',
    tags: ['dashboard', 'SEO', 'accessibility'],
    input: { code: file('examples/pages/sample.html'), lang: 'html' },
    output: {
      kind: 'panel',
      html: table(
        'Page checks for examples/pages/sample.html',
        ['Check', 'Result', 'Detail'],
        pageChecks.checks.map((check) => [check.name, check.state, check.detail]),
      ),
    },
  },
  {
    slug: 'accessibility-heuristic',
    title: 'Accessibility heuristic',
    description:
      'The development overlay’s heuristic (checkAccessibility) on the same page. Unlike the page checks it reports the skipped heading level and the empty button; it does not look at metadata.',
    file: 'examples/output/a11y-heuristic.json',
    tags: ['checkAccessibility', 'debug', 'WCAG'],
    input: { code: file('examples/pages/sample.html'), lang: 'html' },
    output: {
      kind: 'panel',
      html: table(
        'Heuristic findings for examples/pages/sample.html',
        ['Element', 'Finding', 'Reference'],
        heuristic.issues.map((issue) => [issue.element, issue.message, issue.wcagLevel]),
      ),
    },
  },
];
