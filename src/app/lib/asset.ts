/**
 * Prefix a `public/` asset path with the deploy base path.
 *
 * Next rewrites `<Link>`, `<Image>` and `next/font` URLs automatically, but not
 * `fetch()` targets or `url(...)` in inline styles. Those go through here so a
 * GitHub Pages project deploy (served under `/fscandle-web`) resolves them.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
