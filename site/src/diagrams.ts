import { renderChart } from '@casoon/chartlet';

type Spec = Record<string, unknown>;

// Diagrams as chartlet specifications in site/diagrams/, rendered at build time.
const specs = import.meta.glob<Spec>('../diagrams/*.json', { import: 'default', eager: true });

/**
 * Each diagram is rendered with chartlet's light and its dark theme, and CSS shows the one
 * matching the page. Overriding a few colour variables is not enough: diagrams fill their
 * nodes from role colours, and light text on a light node is unreadable.
 */
const SURFACE_STYLE = `<style>.cl-surface{padding:16px;border-radius:10px;margin-block:1.5rem}.cl-surface details{overflow-x:auto}.cl-surface>svg{display:block;width:100%;height:auto}.cl-light{background:#fff;color:#172033;color-scheme:light}.cl-dark{display:none;background:#0e131c;color:#e8edf6;color-scheme:dark}:root[data-theme=dark] .cl-light{display:none}:root[data-theme=dark] .cl-dark{display:block}@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .cl-light{display:none}:root:not([data-theme=light]) .cl-dark{display:block}}.cl-narrow{display:none}@media (max-width:640px){.cl-wide{display:none}.cl-narrow{display:revert}}</style>`;

export interface DiagramOptions {
  /**
   * `html` (default): the figure with chartlet's focus control and data table, for the docs.
   * `svg`: the figure alone, for the start page; its title and description stay in the SVG.
   */
  format?: 'html' | 'svg';
  /** Also render a portrait version of a flow chart for narrow screens (≤ 640 px). */
  narrow?: { width: number; height: number };
}

/** A diagram from site/diagrams/<name>.json. */
export function diagram(name: string, options: DiagramOptions = {}): string {
  const spec = specs[`../diagrams/${name}.json`];
  if (!spec) throw new Error(`unknown diagram: ${name}`);
  const { format = 'html', narrow } = options;
  const variants = (layout: Spec, id: string) =>
    (['light', 'dark'] as const)
      .map((theme) => {
        const { content, warnings } = renderChart(
          { ...layout, theme },
          { format, table: 'details', idPrefix: `${id}-${theme}` },
        );
        for (const warning of warnings) console.warn(`[diagram ${id}, ${theme}] ${warning.trim()}`);
        return `<div class="cl-surface cl-${theme}">${content}</div>`;
      })
      .join('');
  if (!narrow) return `${SURFACE_STYLE}${variants(spec, name)}`;
  const portrait = {
    ...spec,
    ...narrow,
    flow: { ...(spec.flow as Spec), orientation: 'portrait' },
  };
  return `${SURFACE_STYLE}<div class="cl-wide">${variants(spec, name)}</div><div class="cl-narrow">${variants(portrait, `${name}-narrow`)}</div>`;
}
