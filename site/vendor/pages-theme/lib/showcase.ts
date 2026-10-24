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
  /**
   * Heading the example is listed under on the overview. Examples sharing a group appear together,
   * groups in the order of their first example, with a jump list above them.
   */
  group?: string;
  /**
   * A small preview for the overview, typically a lazily loaded image. With it the overview shows
   * a compact card (title, description, preview, link); input and output stay on the detail page.
   * Suits showcases with many examples.
   */
  preview?: { html: string };
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * A description as HTML: text escaped, `backtick spans` as `<code>`, no other markup.
 * Text without backticks comes out as the escaped text alone.
 */
export function descriptionHtml(text: string): string {
  return text
    .split(/(`[^`]+`)/)
    .map((part, i) =>
      i % 2 === 1 ? `<code>${escapeHtml(part.slice(1, -1))}</code>` : escapeHtml(part)
    )
    .join('');
}

/** A description as plain text (meta description and other text-only places): backticks of code spans removed. */
export function descriptionText(text: string): string {
  return text.replace(/`([^`]+)`/g, '$1');
}
