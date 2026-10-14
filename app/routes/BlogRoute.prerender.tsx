import { getBlogPage } from "~/database/Read";

/*
 * Production-only twin of BlogRoute (see routes.ts): the same page plus a
 * build-time `loader`, so every published post is prerendered with its full
 * HTML and meta for crawlers. Dev uses BlogRoute.tsx directly, because dev
 * runs as a plain SPA and SPA mode rejects a `loader` export.
 *
 * Typed by hand: the dev server regenerates route types for the dev route
 * only, so `./+types/BlogRoute.prerender` doesn't always exist.
 */

export { default, meta, clientLoader } from "./BlogRoute";

export async function loader({ params }: { params: { slug?: string } }) {
  return getBlogPage(params.slug);
}
