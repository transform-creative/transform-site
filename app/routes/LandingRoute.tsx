import { useLoaderData } from "react-router";
import { LandingPage } from "~/presentation/landing/LandingPage";
import { buildMeta, canonical } from "~/business/seoBL";
import type { ArticleSummary } from "~/data/CustomTypes";

/*
 * "/" and "/home" (same page; /home canonicalises to "/").
 *
 * The newest blog posts come from a build-time `loader` in
 * LandingRoute.prerender.tsx — the production twin routes.ts swaps in, same
 * as BlogRoute — so the preview cards are in the prerendered HTML and the
 * homepage still never downloads supabase-js. Publishing a post triggers a
 * rebuild, which refreshes them. `clientLoader` is the dev (pure SPA) path.
 */

/** How many posts the "From the blog" section shows */
export const LATEST_ARTICLE_COUNT = 2;

export interface LandingData {
  articles: ArticleSummary[];
}

export async function clientLoader(): Promise<LandingData> {
  try {
    const { getPublishedArticles } = await import("~/database/Read");
    return { articles: await getPublishedArticles(LATEST_ARTICLE_COUNT) };
  } catch {
    return { articles: [] }; // the homepage shouldn't fail over the blog
  }
}

const TITLE = "Transform Creative | Website & Video for Nonprofits";
const DESCRIPTION =
  "Adelaide creative agency specialising in websites, video production and software for Australian not-for-profits and charities. Built to drive real change.";

export function meta() {
  return buildMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: "/",
    twitterDescription:
      "Adelaide creative agency specialising in websites, video production and software for Australian not-for-profits and charities.",
  });
}

export const links = () => [canonical("/")];

export default function LandingRoute() {
  const data = useLoaderData<LandingData | undefined>();
  return <LandingPage latestArticles={data?.articles ?? []} />;
}
