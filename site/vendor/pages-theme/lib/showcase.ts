export interface ShowcaseExample {
  /** URL segment of the detail page. */
  slug: string;
  title: string;
  description?: string;
  /** Source file in the project repository, e.g. "examples/report.ansi". */
  file: string;
  tags?: string[];
  /** What goes in: source, fixture, configuration. */
  input: { code: string; lang?: string };
  /**
   * What comes out: HTML produced at build time by the project's own package.
   * "terminal" renders on the dark terminal surface, "panel" on the page surface (SVG, tables …).
   */
  output: { html: string; kind?: 'terminal' | 'panel' };
}
