import { PROJECTS } from "~/data/Objects";
import { projectSlug } from "~/business/commonBL";
import { SITE_URL } from "~/business/seoBL";
import { getPublishedArticles } from "~/database/Read";

/*
 * /sitemap.xml — a resource route prerendered to a static file at build time
 * (see react-router.config.ts), so every /portfolio/:slug page and published
 * /blog/:slug post is listed without hand-maintaining the XML. Bump a page's
 * lastmod when it changes; blog posts use their own updated_at.
 */

const PAGES: { path: string; lastmod: string; priority: string }[] = [
  { path: "/", lastmod: "2026-10-16", priority: "1.0" },
  { path: "/development", lastmod: "2026-10-16", priority: "0.9" },
  { path: "/media", lastmod: "2026-09-30", priority: "0.9" },
  { path: "/church", lastmod: "2026-10-16", priority: "0.9" },
  { path: "/portfolio", lastmod: "2026-10-16", priority: "0.8" },
  { path: "/contact", lastmod: "2026-10-16", priority: "0.7" },
];

/** Every /portfolio/:slug page is built from PROJECTS in Objects.tsx — bump
 *  this when a project's copy, media or name changes */
const PROJECTS_LASTMOD = "2026-10-16";

export async function loader() {
  const articles = await getPublishedArticles();
  // The blog index changes whenever a post does
  const blogLastmod = articles
    .map((a) => a.updated_at)
    .sort()
    .at(-1)
    ?.slice(0, 10);

  const urls = [
    ...PAGES.map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}${p.path}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    `  <url>\n    <loc>${SITE_URL}/blog</loc>\n${blogLastmod ? `    <lastmod>${blogLastmod}</lastmod>\n` : ""}    <priority>0.8</priority>\n  </url>`,
    ...articles.map(
      (a) =>
        `  <url>\n    <loc>${SITE_URL}/blog/${a.slug}</loc>\n    <lastmod>${a.updated_at.slice(0, 10)}</lastmod>\n    <priority>0.7</priority>\n  </url>`,
    ),
    ...PROJECTS.map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}/portfolio/${projectSlug(p, PROJECTS)}</loc>\n    <lastmod>${PROJECTS_LASTMOD}</lastmod>\n    <priority>0.6</priority>\n  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
