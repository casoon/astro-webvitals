import type { CollectionEntry } from 'astro:content';
import { url } from './url';

export interface DocsNavItem {
  id: string;
  label: string;
  href: string;
}

export interface DocsNavGroup {
  label: string;
  items: DocsNavItem[];
}

const humanize = (dir: string) => dir.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** The docs page at docs/index.md is served at /docs/. */
export const docSlug = (id: string) => (id === 'index' ? undefined : id);

export const docHref = (id: string) => url(id === 'index' ? 'docs/' : `docs/${id}/`);

/**
 * Sidebar groups come from the folders in docs/. Group order and labels follow
 * the `docsGroups` option; unlisted folders follow alphabetically. Root-level
 * pages join the first group.
 */
export function buildDocsNav(
  entries: CollectionEntry<'docs'>[],
  groups: Record<string, string>
): DocsNavGroup[] {
  const configured = Object.keys(groups);
  const byGroup = new Map<string, CollectionEntry<'docs'>[]>();

  for (const entry of entries) {
    const dir = entry.id.includes('/') ? entry.id.split('/')[0] : (configured[0] ?? '');
    byGroup.set(dir, [...(byGroup.get(dir) ?? []), entry]);
  }

  const order = [
    ...configured.filter((dir) => byGroup.has(dir)),
    ...[...byGroup.keys()].filter((dir) => !configured.includes(dir)).sort(),
  ];

  return order.map((dir) => ({
    label: groups[dir] ?? humanize(dir),
    items: (byGroup.get(dir) ?? [])
      .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title))
      .map((entry) => ({
        id: entry.id,
        label: entry.data.sidebarLabel ?? entry.data.title,
        href: docHref(entry.id),
      })),
  }));
}
