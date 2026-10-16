import type { LinkDescriptor, MetaDescriptor } from "react-router";

export const SITE_URL = "https://www.transformcreative.com.au";

const SHARE_CARDS =
  "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/images";

/** 1200x630 share cards (the size buildMeta declares by default) */
export const SHARE_CARD = {
  home: `${SHARE_CARDS}/home_card.jpg`,
  software: `${SHARE_CARDS}/software_card.jpg`,
  video: `${SHARE_CARDS}/video_card.jpg`,
};

const DEFAULT_OG_IMAGE = SHARE_CARD.home;

/** Scrapers reject relative og:image / og:url, so everything is absolute.
 *  Already-absolute URLs (e.g. project images in Supabase storage) pass through. */
function absolute(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface SeoOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Pixel size of `image`. Defaults to the 1200x630 share card size;
   *  pass 0 to omit the size tags when it isn't known. */
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  /** Share-card title (og/twitter). Defaults to `title`. */
  shareTitle?: string;
  /** Share-card description (og/twitter). Defaults to `description`. */
  shareDescription?: string;
  /** Shorter description for the Twitter card. Defaults to `description`. */
  twitterDescription?: string;
  /** Private/auth-gated pages: emit robots noindex and skip social tags. */
  noIndex?: boolean;
  /** og:type — "article" adds the article:* tags below */
  type?: "website" | "article";
  /** ISO dates for article:published_time / article:modified_time */
  publishedTime?: string | null;
  modifiedTime?: string | null;
  /** One article:tag each (e.g. a post's keywords) */
  tags?: string[];
  /** schema.org payload rendered into <head> as JSON-LD */
  jsonLd?: Record<string, unknown>;
}

/*******************************************
 * Build the full meta tag set for a route.
 * Prerendering bakes these into the served HTML per path.
 */
export function buildMeta({
  title,
  description,
  path,
  image,
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt,
  shareTitle = title,
  shareDescription = description,
  twitterDescription,
  noIndex,
  type = "website",
  publishedTime,
  modifiedTime,
  tags = [],
  jsonLd,
}: SeoOptions): MetaDescriptor[] {
  if (noIndex) {
    return [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
    ];
  }

  const ogImage = absolute(image ?? DEFAULT_OG_IMAGE);

  return [
    { title },
    { name: "description", content: description },
    // Open Graph
    { property: "og:title", content: shareTitle },
    { property: "og:description", content: shareDescription },
    { property: "og:image", content: ogImage },
    ...(imageWidth && imageHeight
      ? [
          { property: "og:image:width", content: String(imageWidth) },
          { property: "og:image:height", content: String(imageHeight) },
        ]
      : []),
    ...(imageAlt ? [{ property: "og:image:alt", content: imageAlt }] : []),
    { property: "og:type", content: type },
    ...(type === "article"
      ? [
          ...(publishedTime
            ? [{ property: "article:published_time", content: publishedTime }]
            : []),
          ...(modifiedTime
            ? [{ property: "article:modified_time", content: modifiedTime }]
            : []),
          ...tags.map((tag) => ({ property: "article:tag", content: tag })),
        ]
      : []),
    { property: "og:site_name", content: "Transform Creative" },
    { property: "og:locale", content: "en_AU" },
    { property: "og:url", content: absolute(path) },
    // Twitter card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: shareTitle },
    {
      name: "twitter:description",
      content: twitterDescription ?? shareDescription,
    },
    { name: "twitter:image", content: ogImage },
    ...(imageAlt ? [{ name: "twitter:image:alt", content: imageAlt }] : []),
    ...(jsonLd ? [{ "script:ld+json": jsonLd }] : []),
  ];
}

/*******************************************
 * Canonical URL for a route. Pass the path this page should be
 * indexed as — e.g. /home canonicalises to "/" to avoid duplicate content.
 */
export function canonical(path: string): LinkDescriptor {
  return { rel: "canonical", href: absolute(path) };
}
