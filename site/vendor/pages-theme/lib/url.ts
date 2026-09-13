const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Prefix a site-internal path with the Pages base path ("/<repo>/"). */
export function url(path = ''): string {
  return base + path.replace(/^\//, '');
}
