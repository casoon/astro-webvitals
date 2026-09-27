/**
 * Minimal ANSI → HTML conversion for the Terminal component: SGR colours
 * (16-colour palette as classes, 256-colour and 24-bit colour as inline
 * styles), bold, dim, italic, underline and carriage-return overwrites. Other
 * escape sequences are dropped. Projects with their own renderer (e.g.
 * runemark) pass its HTML to <Terminal> instead.
 */

interface Style {
  fg: number | null;
  /** A 256-colour or 24-bit foreground, as a CSS colour; wins over `fg`. */
  fgColor: string | null;
  /** A 256-colour or 24-bit background, as a CSS colour. */
  bgColor: string | null;
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
}

interface Cell {
  ch: string;
  cls: string;
  css: string;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI control sequences is the point
const TOKEN = /\x1b\[([0-9;]*)([A-Za-z])|\x1b\][^\x07]*(?:\x07|\x1b\\)|\r|[^\x1b\r]+/g;

const plain = (): Style => ({
  fg: null,
  fgColor: null,
  bgColor: null,
  bold: false,
  dim: false,
  italic: false,
  underline: false,
});

const hex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;

/** The xterm 256-colour cube and grey ramp; 0–15 are the theme's palette. */
function color256(index: number): string | number {
  if (index < 16) return index;
  if (index < 232) {
    const i = index - 16;
    const level = (n: number) => (n === 0 ? 0 : 55 + n * 40);
    return hex(level(Math.floor(i / 36)), level(Math.floor(i / 6) % 6), level(i % 6));
  }
  const grey = 8 + (index - 232) * 10;
  return hex(grey, grey, grey);
}

/**
 * `38;5;n` / `38;2;r;g;b` (and 48 for the background) starting at `codes[i]`.
 * Returns how many codes it consumed after the 38/48 itself.
 */
function extendedColour(style: Style, codes: number[], i: number): number {
  const background = codes[i] === 48;
  let value: string | number | null = null;
  let used = 0;
  if (codes[i + 1] === 5) {
    value = color256(codes[i + 2] ?? 0);
    used = 2;
  } else if (codes[i + 1] === 2) {
    value = hex(codes[i + 2] ?? 0, codes[i + 3] ?? 0, codes[i + 4] ?? 0);
    used = 4;
  }
  if (value === null) return used;
  if (background) {
    // Palette backgrounds (40–47) are not rendered either; keep the two consistent.
    style.bgColor = typeof value === 'string' ? value : null;
  } else if (typeof value === 'number') {
    paletteForeground(style, value);
  } else {
    style.fgColor = value;
  }
  return used;
}

/** A palette foreground (or none) replaces any 256/24-bit one. */
function paletteForeground(style: Style, index: number | null): void {
  style.fg = index;
  style.fgColor = null;
}

function applySgr(style: Style, params: string): void {
  const codes = params === '' ? [0] : params.split(';').map(Number);
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i];
    if (c === 0) Object.assign(style, plain());
    else if (c === 1) style.bold = true;
    else if (c === 2) style.dim = true;
    else if (c === 3) style.italic = true;
    else if (c === 4) style.underline = true;
    else if (c === 22) style.bold = style.dim = false;
    else if (c === 23) style.italic = false;
    else if (c === 24) style.underline = false;
    else if (c >= 30 && c <= 37) paletteForeground(style, c - 30);
    else if (c >= 90 && c <= 97) paletteForeground(style, c - 90 + 8);
    else if (c === 39) paletteForeground(style, null);
    else if (c === 49) style.bgColor = null;
    else if (c === 38 || c === 48) i += extendedColour(style, codes, i);
  }
}

function className(style: Style): string {
  const cls: string[] = [];
  if (style.bold) cls.push('ansi-bold');
  if (style.dim) cls.push('ansi-dim');
  if (style.italic) cls.push('ansi-italic');
  if (style.underline) cls.push('ansi-underline');
  if (style.fg !== null && style.fgColor === null) cls.push(`ansi-fg-${style.fg}`);
  return cls.join(' ');
}

function inlineStyle(style: Style): string {
  const css: string[] = [];
  if (style.fgColor !== null) css.push(`color:${style.fgColor}`);
  if (style.bgColor !== null) css.push(`background-color:${style.bgColor}`);
  return css.join(';');
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderLine(cells: Cell[]): string {
  let html = '';
  let i = 0;
  while (i < cells.length) {
    const { cls, css } = cells[i];
    let text = '';
    while (i < cells.length && cells[i].cls === cls && cells[i].css === css) text += cells[i++].ch;
    const attrs = (cls ? ` class="${cls}"` : '') + (css ? ` style="${css}"` : '');
    html += attrs ? `<span${attrs}>${escapeHtml(text)}</span>` : escapeHtml(text);
  }
  return html;
}

export function ansiToHtml(input: string): string {
  const style = plain();
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\n$/, '')
    .split('\n')
    .map((line) => {
      const cells: Cell[] = [];
      let col = 0;
      for (const [token, params, command] of line.matchAll(TOKEN)) {
        if (token === '\r') col = 0;
        else if (command === 'm') applySgr(style, params);
        else if (token[0] !== '\x1b') {
          const cls = className(style);
          const css = inlineStyle(style);
          for (const ch of token) cells[col++] = { ch, cls, css };
        }
      }
      return renderLine(cells);
    })
    .join('\n');
}

/** Show escape sequences literally, for displaying ANSI source files. */
export function escapeAnsi(input: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ESC is replaced by its literal notation
  return input.replace(/\x1b/g, '\\x1b').replace(/\r/g, '\\r').replace(/\n$/, '');
}
