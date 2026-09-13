/**
 * Minimal ANSI → HTML conversion for the Terminal component: SGR colours
 * (16-colour palette), bold, dim, italic, underline and carriage-return
 * overwrites. Other escape sequences are dropped. Projects with their own
 * renderer (e.g. runemark) pass its HTML to <Terminal> instead.
 */

interface Style {
  fg: number | null;
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
}

interface Cell {
  ch: string;
  cls: string;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI control sequences is the point
const TOKEN = /\x1b\[([0-9;]*)([A-Za-z])|\x1b\][^\x07]*(?:\x07|\x1b\\)|\r|[^\x1b\r]+/g;

const plain = (): Style => ({ fg: null, bold: false, dim: false, italic: false, underline: false });

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
    else if (c >= 30 && c <= 37) style.fg = c - 30;
    else if (c >= 90 && c <= 97) style.fg = c - 90 + 8;
    else if (c === 39) style.fg = null;
    else if (c === 38 || c === 48) i += codes[i + 1] === 5 ? 2 : 4; // 256/true colour: skipped
  }
}

function className(style: Style): string {
  const cls: string[] = [];
  if (style.bold) cls.push('ansi-bold');
  if (style.dim) cls.push('ansi-dim');
  if (style.italic) cls.push('ansi-italic');
  if (style.underline) cls.push('ansi-underline');
  if (style.fg !== null) cls.push(`ansi-fg-${style.fg}`);
  return cls.join(' ');
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderLine(cells: Cell[]): string {
  let html = '';
  let i = 0;
  while (i < cells.length) {
    const { cls } = cells[i];
    let text = '';
    while (i < cells.length && cells[i].cls === cls) text += cells[i++].ch;
    html += cls ? `<span class="${cls}">${escapeHtml(text)}</span>` : escapeHtml(text);
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
          for (const ch of token) cells[col++] = { ch, cls };
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
