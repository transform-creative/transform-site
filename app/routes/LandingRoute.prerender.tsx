import { getPublishedArticles } from "~/database/Read";
import { LATEST_ARTICLE_COUNT, type LandingData } from "./LandingRoute";

/*
 * Production-only twin of LandingRoute (see routes.ts), like
 * BlogRoute.prerender.tsx: the same page plus a build-time `loader`, so the
 * newest posts are baked into the prerendered "/" and "/home". Dev uses
 * LandingRoute.tsx, because SPA mode rejects a `loader` export.
 *
 * No clientLoader here on purpose: client-side navigation reads the
 * prerendered .data file, so supabase-js stays off the homepage.
 */

export { default, meta, links } from "./LandingRoute";

export async function loader(): Promise<LandingData> {
  return { articles: await getPublishedArticles(LATEST_ARTICLE_COUNT) };
}
