import type { Config } from "@react-router/dev/config";
import { loadEnv } from "vite";
import { existsSync } from "node:fs";
import { rename, rm } from "node:fs/promises";
import { join } from "node:path";

/**
 * Prerender only for production builds.
 *
 * Setting `prerender` switches routes to render server-side — which is what
 * we want at build time, but in `react-router dev` it also makes the dev
 * server SSR every route. This app has never done that (CJS deps and
 * browser-global access break under an ESM/Node render), so dev stays in pure
 * SPA mode and keeps behaving exactly as before.
 */
const isProductionBuild = process.env.NODE_ENV !== "development";

/**
 * Slugs of every published blog post, so each gets its own static HTML page.
 * Read straight from Supabase's REST API (this config isn't bundled by Vite,
 * so the app's supabase client and `import.meta.env` aren't available here).
 * RLS only returns published posts to the anon key.
 *
 * A failed fetch fails the build rather than quietly shipping a site with
 * every post missing — Vercel keeps serving the previous deployment.
 */
async function publishedArticleSlugs(): Promise<string[]> {
  const env = loadEnv("production", process.cwd(), "");
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set");

  const res = await fetch(`${url}/rest/v1/articles?select=slug`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok)
    throw new Error(`Could not list blog posts to prerender: ${res.status}`);
  const rows = (await res.json()) as { slug: string }[];
  return rows.map((r) => r.slug);
}

export default {
  ssr: false,
  /**
   * Static HTML snapshots of the marketing routes, generated at build time.
   * Crawlers and link-preview scrapers get real markup + the route's own
   * `meta`/`links`; the SPA then hydrates and all animations run client-side
   * exactly as before.
   *
   * Auth-gated and dynamic routes (/auth, /client, /client/:id, /forms/:id)
   * are deliberately excluded — they stay on the SPA fallback.
   *
   * NOTE: because "/" is listed, the SPA shell is emitted as
   * `__spa-fallback.html` instead of `index.html`, which is what
   * vercel.json's catch-all rewrite must point at.
   */
  prerender: isProductionBuild
    ? async () => {
        const { PROJECTS } = await import("./app/data/Objects");
        const { projectSlug } = await import("./app/business/commonBL");
        const articleSlugs = await publishedArticleSlugs();
        return [
          "/",
          "/home",
          "/portfolio",
          "/contact",
          "/development",
          "/media",
          "/church",
          "/blog",
          "/sitemap.xml",
          // The "*" route; buildEnd moves it to 404.html
          "/404",
          // One indexable page per project (the popup's twin)
          ...PROJECTS.map((p) => `/portfolio/${projectSlug(p, PROJECTS)}`),
          // One static page per published blog post
          ...articleSlugs.map((slug) => `/blog/${slug}`),
        ];
      }
    : undefined,
  /**
   * Vercel serves 404.html, with a 404 status, for any URL that isn't a file
   * and isn't rewritten (vercel.json only rewrites the auth-only routes).
   * Prerendering can only write <path>/index.html, so move /404's page there.
   * Removing the folder also stops /404 itself answering with a 200.
   */
  async buildEnd({ reactRouterConfig }) {
    if (!isProductionBuild) return;
    const client = join(reactRouterConfig.buildDirectory, "client");
    const page = join(client, "404", "index.html");
    if (!existsSync(page)) throw new Error(`Expected a prerendered ${page}`);
    await rename(page, join(client, "404.html"));
    await rm(join(client, "404"), { recursive: true, force: true });
  },
} satisfies Config;
