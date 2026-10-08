import { PROJECTS } from "~/data/Objects";
import { projectSlug } from "~/business/commonBL";
import { SITE_URL } from "~/business/seoBL";

/*
 * /sitemap.xml — a resource route prerendered to a static file at build time
 * (see react-router.config.ts), so every /portfolio/:slug page is listed
 * without hand-maintaining the XML. Bump a page's lastmod when it changes.
 */

const PAGES: { path: string; lastmod: string; priority: string }[] = [
  { path: "/", lastmod: "2026-07-30", priority: "1.0" },
  { path: "/development", lastmod: "2026-10-08", priority: "0.9" },
  { path: "/media", lastmod: "2026-09-30", priority: "0.9" },
  { path: "/church", lastmod: "2026-10-08", priority: "0.9" },
  { path: "/portfolio", lastmod: "2026-10-08", priority: "0.8" },
  { path: "/contact", lastmod: "2026-07-30", priority: "0.7" },
];

export function loader() {
  const urls = [
    ...PAGES.map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}${p.path}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    ...PROJECTS.map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}/portfolio/${projectSlug(p, PROJECTS)}</loc>\n    <priority>0.6</priority>\n  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
