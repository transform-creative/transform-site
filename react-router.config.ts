import type { Config } from "@react-router/dev/config";

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
    ? [
        "/",
        "/home",
        "/portfolio",
        "/contact",
        "/development",
        "/media",
        "/church",
      ]
    : undefined,
} satisfies Config;
