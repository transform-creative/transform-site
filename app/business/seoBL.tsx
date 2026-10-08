import type { LinkDescriptor, MetaDescriptor } from "react-router";

export const SITE_URL = "https://www.transformcreative.com.au";

/**
 * {{TODO: Isaac to supply public/og-image.jpg at 1200x630}}
 * Until then we fall back to the icon so link previews aren't broken —
 * swap this to "/og-image.jpg" once the real asset lands.
 */
const DEFAULT_OG_IMAGE = "/transform-icon-color-donut.png";

/** Scrapers reject relative og:image / og:url, so everything is absolute. */
function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface SeoOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  image?: string;
  /** Pixel size of `image`. Defaults to the 1200x630 share card size. */
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
}

/*******************************************
 * Build the full meta tag set for a route.
 * Prerendering bakes these into the served HTML per path.
 */
export function buildMeta({
  title,
  description,
  path,
  keywords,
  image,
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt,
  shareTitle = title,
  shareDescription = description,
  twitterDescription,
  noIndex,
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
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    // Open Graph
    { property: "og:title", content: shareTitle },
    { property: "og:description", content: shareDescription },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: String(imageWidth) },
    { property: "og:image:height", content: String(imageHeight) },
    ...(imageAlt ? [{ property: "og:image:alt", content: imageAlt }] : []),
    { property: "og:type", content: "website" },
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
  ];
}

/*******************************************
 * Canonical URL for a route. Pass the path this page should be
 * indexed as — e.g. /home canonicalises to "/" to avoid duplicate content.
 */
export function canonical(path: string): LinkDescriptor {
  return { rel: "canonical", href: absolute(path) };
}
