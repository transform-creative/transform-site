import DOMPurify from "dompurify";
import type Quill from "quill";
import type { Article, ArticleSummary } from "~/data/CustomTypes";
import { SITE_URL } from "./seoBL";

/*******************************************
 * Blog business logic: slugs, SEO fields, the editor's SEO checklist,
 * Quill HTML clean-up and the article's JSON-LD.
 */

/** Google cuts titles around 60 characters and descriptions around 160 */
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MIN = 70;
export const SEO_DESCRIPTION_MAX = 160;

/** Storage folder for cover + inline images (public `transform` bucket) */
export const ARTICLE_IMAGE_BUCKET = "transform";
export const ARTICLE_IMAGE_FOLDER = "articles";

/** Quill toolbar. Headings start at H2 — the article title is the page's H1.
 *  The table buttons are added by QuillEditor's `tables` prop. */
export const ARTICLE_TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }, "blockquote"],
  ["link", "image", "video"],
  [{ align: [] }],
  ["clean"],
];

/** Only these hosts may be embedded as video iframes */
const VIDEO_EMBED =
  /^https:\/\/(www\.)?(youtube(-nocookie)?\.com|player\.vimeo\.com)\//i;

/*******************************************
 * Turn a title into a URL slug: "Why NFPs need video!" → "why-nfps-need-video".
 * Matches the DB check `^[a-z0-9]+(-[a-z0-9]+)*$`.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/, "");
}

/** Light clean-up while typing in the slug box — keeps a trailing dash so
 *  "my-" can become "my-post". `slugify` finishes it off on blur/save. */
export function slugInput(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");
}

/** "video, charity marketing , ,SEO" → ["video", "charity marketing", "SEO"] */
export function parseKeywords(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(",")
    .map((k) => k.trim())
    .filter((k) => {
      const key = k.toLowerCase();
      if (!k || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** The <title> for an article: the SEO override, else the post title */
export function articleMetaTitle(
  article: Pick<Article, "title" | "seo_title">,
): string {
  return `${article.seo_title?.trim() || article.title} | Transform Creative`;
}

/** Plain text of some HTML (works at build time too, without a DOM) */
export function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/blockquote)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cut on a word boundary so it fits a meta description */
export function truncate(text: string, max = SEO_DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, "")}…`;
}

/** Meta description: the excerpt, else the opening of the body */
export function articleDescription(
  article: Pick<Article, "excerpt" | "body">,
): string {
  return truncate(article.excerpt?.trim() || htmlToText(article.body));
}

export function readingMinutes(html: string): number {
  const words = htmlToText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "14 October 2026". Pinned to Adelaide so the prerendered HTML and the
 *  browser always print the same date (no hydration mismatch). */
export function formatArticleDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Adelaide",
  });
}

export function articleUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

/** Live (published and not scheduled for later) */
export function isPublished(
  article: Pick<ArticleSummary, "published_at">,
): boolean {
  return (
    !!article.published_at && new Date(article.published_at) <= new Date()
  );
}

/*******************************************
 * Quill's HTML for saving. `getSemanticHTML` gives real <ul>/<ol> lists
 * (better for crawlers than Quill's internal markup) but writes every space
 * as &nbsp;, so those are put back. An empty editor saves as "".
 */
export function quillToHtml(quill: Quill): string {
  if (quill.getLength() <= 1) return "";
  return quill.getSemanticHTML().replace(/&nbsp;/g, " ");
}

/*******************************************
 * Strip anything that isn't plain article markup. Writing is admin-only (RLS),
 * so this is defence in depth: run on save and before rendering a post that
 * was fetched in the browser. Needs a DOM — at build time the stored HTML
 * (already cleaned on save) is passed through.
 */
export function sanitizeArticleHtml(dirty: string): string {
  if (typeof window === "undefined" || !DOMPurify.isSupported) return dirty;

  // Only allow video iframes from YouTube / Vimeo
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName !== "iframe") return;
    const src = (node as Element).getAttribute("src") ?? "";
    if (!VIDEO_EMBED.test(src)) node.parentNode?.removeChild(node);
  });
  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s",
        "sub", "sup", "ul", "ol", "li", "blockquote", "pre", "code", "a",
        "img", "iframe", "table", "thead", "tbody", "tr", "td",
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "src", "alt", "title", "width", "height",
        "class", "allowfullscreen", "frameborder", "allow",
      ],
      ADD_TAGS: ["iframe"],
      // Drops Quill's internal data-* attributes (e.g. table cells' data-row)
      ALLOW_DATA_ATTR: false,
    });
  } finally {
    DOMPurify.removeHook("uponSanitizeElement");
  }
}

/** One line of the editor's SEO checklist */
export interface SeoCheck {
  label: string;
  ok: boolean;
}

export interface SeoCheckInput {
  title: string;
  seo_title: string;
  excerpt: string;
  keywords: string[];
  cover_image: string;
  cover_image_alt: string;
  body: string;
}

/*******************************************
 * The editor's SEO checklist. Advisory only — nothing here blocks publishing.
 * The first keyword is treated as the focus keyword.
 */
export function seoChecks(input: SeoCheckInput): SeoCheck[] {
  const metaTitle = input.seo_title.trim() || input.title.trim();
  const description = input.excerpt.trim();
  const text = htmlToText(input.body);
  const words = text.split(" ").filter(Boolean).length;
  const focus = input.keywords[0]?.toLowerCase();
  const firstParagraph = text.slice(0, 400).toLowerCase();

  return [
    {
      label: `Title is 1–${SEO_TITLE_MAX} characters (${metaTitle.length})`,
      ok: metaTitle.length > 0 && metaTitle.length <= SEO_TITLE_MAX,
    },
    {
      label: `Description is ${SEO_DESCRIPTION_MIN}–${SEO_DESCRIPTION_MAX} characters (${description.length})`,
      ok:
        description.length >= SEO_DESCRIPTION_MIN &&
        description.length <= SEO_DESCRIPTION_MAX,
    },
    { label: "At least one keyword", ok: input.keywords.length > 0 },
    {
      label: "Focus keyword is in the title",
      ok: !!focus && metaTitle.toLowerCase().includes(focus),
    },
    {
      label: "Focus keyword is in the description",
      ok: !!focus && description.toLowerCase().includes(focus),
    },
    {
      label: "Focus keyword is in the opening paragraph",
      ok: !!focus && firstParagraph.includes(focus),
    },
    { label: "Has a share image", ok: !!input.cover_image.trim() },
    {
      label: "Share image has alt text",
      ok: !!input.cover_image.trim() && !!input.cover_image_alt.trim(),
    },
    { label: "Uses subheadings (H2)", ok: /<h2[\s>]/i.test(input.body) },
    { label: `At least 300 words (${words})`, ok: words >= 300 },
  ];
}

/*******************************************
 * schema.org BlogPosting for an article, so Google can show it as an article
 * result (headline, image, dates).
 */
export function articleSchema(article: Article) {
  const url = articleUrl(article.slug);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.seo_title?.trim() || article.title,
    description: articleDescription(article),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(article.cover_image && { image: [article.cover_image] }),
    ...(article.published_at && { datePublished: article.published_at }),
    dateModified: article.updated_at,
    ...(article.keywords.length > 0 && {
      keywords: article.keywords.join(", "),
    }),
    inLanguage: "en-AU",
    author: { "@type": "Organization", name: "Transform Creative", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Transform Creative",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/transform-icon-color-donut.png`,
      },
    },
  };
}
