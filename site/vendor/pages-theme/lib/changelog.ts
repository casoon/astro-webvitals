/**
 * Parses a Keep-a-Changelog style CHANGELOG.md:
 *
 *   ## [0.4.0] - 2026-02-11
 *   ### Added
 *   - Item with `code` and [links](https://…)
 */

export interface Change {
  kind: string;
  html: string;
}

export interface Release {
  version: string;
  date: string | null;
  changes: Change[];
}

const RELEASE = /^##\s+\[?([^\]\s]+)\]?(?:\s*[-–—]\s*(\S+))?/;
const SECTION = /^###\s+(.+)/;
const ITEM = /^\s*[-*]\s+(.*)/;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inline Markdown subset: `code`, **bold**, [text](url). */
export function inlineMarkdown(md: string): string {
  return md
    .split('`')
    .map((part, i) =>
      i % 2 === 1
        ? `<code>${escapeHtml(part)}</code>`
        : escapeHtml(part)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    )
    .join('');
}

export function parseChangelog(md: string): Release[] {
  const releases: Release[] = [];
  let kind = 'changed';
  let item: string | null = null;

  const flush = () => {
    if (item !== null && releases.length > 0) {
      releases[releases.length - 1].changes.push({ kind, html: inlineMarkdown(item.trim()) });
    }
    item = null;
  };

  for (const line of md.split('\n')) {
    const release = RELEASE.exec(line);
    const section = SECTION.exec(line);
    const listItem = ITEM.exec(line);
    if (release) {
      flush();
      releases.push({ version: release[1], date: release[2] ?? null, changes: [] });
    } else if (section) {
      flush();
      kind = section[1].trim().toLowerCase();
    } else if (listItem) {
      flush();
      item = listItem[1];
    } else if (item !== null && line.trim() !== '') {
      item += ` ${line.trim()}`;
    } else {
      flush();
    }
  }
  flush();
  return releases.filter((r) => r.changes.length > 0);
}

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
