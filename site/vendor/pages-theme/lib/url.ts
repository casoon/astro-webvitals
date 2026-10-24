import type { Lang } from './i18n';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Prefix a site-internal path with the Pages base path ("/<repo>/"). */
export function url(path = ''): string {
  return base + path.replace(/^\//, '');
}

/** casoon.de, canonical host. */
export const CASOON_URL = 'https://www.casoon.de/';

/** The project catalog on casoon.dev (canonical host), or one project's entry in it. */
export function catalogUrl(lang: Lang, slug = ''): string {
  return `https://casoon.dev/${lang === 'en' ? 'en/' : ''}${slug && `#projekt-${slug}`}`;
}
