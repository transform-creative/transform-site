import { Link, useLoaderData, useOutletContext } from "react-router";
import "../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { BlogPageData } from "~/data/CustomTypes";
import { getBlogPage } from "~/database/Read";
import {
  articleDescription,
  articleMetaTitle,
  articleSchema,
  sanitizeArticleHtml,
} from "~/business/blogBL";
import { buildMeta, canonical } from "~/business/seoBL";
import { BlogIndex } from "~/presentation/blog/BlogIndex";
import { ArticleView } from "~/presentation/blog/ArticleView";
import { ContactTab } from "~/presentation/landing/ContactTab";

/*
 * /blog and /blog/:slug — one module for both, so the route always has a
 * prerendered path (/blog) even before any post exists; `ssr: false` refuses
 * a `loader` on a route with nothing prerendered.
 *
 * - The build-time `loader` lives in BlogRoute.prerender.tsx, which routes.ts
 *   uses for production builds only. It runs for every published post (listed
 *   in react-router.config.ts), so crawlers get the full article HTML plus its
 *   title, description, keywords, share image and JSON-LD. It can't live here:
 *   dev runs as a plain SPA (no prerender), and SPA mode rejects `loader`.
 * - `clientLoader` runs in the browser: always in dev, and in production for
 *   client-side navigation and posts published since the last deploy (served
 *   by the SPA fallback). Publishing triggers a rebuild via the DB trigger,
 *   after which they're prerendered too.
 *
 * Typed by hand rather than with `./+types/BlogRoute`, because only one of
 * the two files is the registered route in any given build.
 */

interface BlogParams {
  params: { slug?: string };
}

export async function clientLoader({ params }: BlogParams) {
  const data = await getBlogPage(params.slug);
  if (data.kind === "article" && data.article)
    data.article = {
      ...data.article,
      body: sanitizeArticleHtml(data.article.body),
    };
  return data;
}

export function meta({
  loaderData,
  params,
}: BlogParams & { loaderData?: BlogPageData }) {
  if (!params.slug) {
    return [
      ...buildMeta({
        title: "Blog | Video & Web Tips for Nonprofits | Transform Creative",
        description:
          "Practical ideas on video, websites and digital comms for Australian charities, churches and not-for-profits, from Adelaide's Transform Creative.",
        path: "/blog",
        keywords:
          "nonprofit marketing blog, charity video, nonprofit website, church communications, Adelaide",
      }),
      { tagName: "link", ...canonical("/blog") },
    ];
  }

  const path = `/blog/${params.slug}`;
  const article =
    loaderData?.kind === "article" ? loaderData.article : null;
  if (!article) {
    return buildMeta({
      title: "Article not found | Transform Creative",
      description: "This article couldn't be found.",
      path,
      noIndex: true,
    });
  }

  return [
    ...buildMeta({
      title: articleMetaTitle(article),
      description: articleDescription(article),
      path,
      keywords: article.keywords.join(", ") || undefined,
      image: article.cover_image ?? undefined,
      // Uploads come in any size, so don't claim 1200x630
      imageWidth: 0,
      imageHeight: 0,
      imageAlt: article.cover_image_alt ?? undefined,
      type: "article",
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      tags: article.keywords,
      jsonLd: articleSchema(article),
    }),
    // links() gets no params, so the per-article canonical rides on meta
    { tagName: "link", ...canonical(path) },
  ];
}

export default function BlogRoute() {
  const context: SharedContextProps = useOutletContext();
  const loaderData = useLoaderData() as BlogPageData;

  if (loaderData.kind === "index")
    return (
      <>
        <BlogIndex articles={loaderData.articles} />
        <div className="horizontal-line mediumFade mt-20" />
        <div className="w-100 col middle">
          <ContactTab />
        </div>
      </>
    );

  if (!loaderData.article)
    return (
      <div className="col middle center gap-20" style={{ minHeight: "70vh" }}>
        <h1 className="textCenter">Article not found</h1>
        <Link to="/blog" className="btn-look link-plain">
          Back to the blog
        </Link>
      </div>
    );

  return (
    <div className={`col middle w-100 gap-20 ${context.inShrink ? "" : "mb-20"}`}>
      <ArticleView article={loaderData.article} more={loaderData.more} />
      <div className="horizontal-line mediumFade mt-20" />
      <div className="w-100 col middle">
        <ContactTab />
      </div>
    </div>
  );
}
