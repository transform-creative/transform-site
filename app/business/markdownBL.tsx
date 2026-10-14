import { marked } from "marked";
import { sanitizeArticleHtml } from "./blogBL";

/*******************************************
 * Markdown paste for the article editor. Kept apart from blogBL so `marked`
 * only ships with the admin editor, not the public blog pages.
 */

/** Any one of these is enough to call a paste markdown */
const STRONG_SIGNALS = [
  /^#{1,6}\s+\S/m, // # Heading
  /^\s*\|.+\|\s*$/m, // | table | row |
  /^```/m, // code fence
];

/** Common in plain text too, so it takes two of these */
const WEAK_SIGNALS = [
  /\*\*[^*\n]+\*\*/, // **bold**
  /\[[^\]\n]+\]\([^)\s]+\)/, // [link](url)
  /^>\s+\S/m, // > quote
  /^\s*[-*+]\s+\S/m, // - bullet
  /^\s*\d+\.\s+\S/m, // 1. numbered
  /(^|\s)_[^_\n]+_(\s|$)/, // _italic_
];

/** Clipboard HTML that already carries real structure (Docs, Notion, web pages) */
const RICH_HTML = /<(p|h[1-6]|li|table|blockquote)[\s>]/i;

export function looksLikeMarkdown(text: string): boolean {
  if (STRONG_SIGNALS.some((re) => re.test(text))) return true;
  return WEAK_SIGNALS.filter((re) => re.test(text)).length >= 2;
}

/*******************************************
 * Markdown → article HTML ready for Quill:
 * - headings shift to fit the page (the post title is the only H1, and the
 *   toolbar only offers H2/H3), so # → H2 and #### and below → H3
 * - table headers are fixed for Quill (see `fixTableHeaders`)
 */
export function markdownToHtml(markdown: string): string {
  const html = (marked.parse(markdown, { gfm: true, async: false }) as string)
    .replace(/<h1(\s|>)/g, "<h2$1")
    .replace(/<\/h1>/g, "</h2>")
    .replace(/<h[4-6](\s|>)/g, "<h3$1")
    .replace(/<\/h[4-6]>/g, "</h3>");
  return sanitizeArticleHtml(fixTableHeaders(html));
}

/** Any header cell or header section in some HTML */
const TABLE_HEADER = /<(th|thead)[\s>]/i;

/*******************************************
 * Make table headers survive Quill. Its table format has no <th> (a header
 * row merges into one cell, the rest left empty) and no <thead> (the header
 * row splits off into a separate table). So header cells become bold
 * ordinary cells, and the header row joins the body. Must run before
 * sanitising, which would drop the <th> tags and merge their text.
 */
export function fixTableHeaders(html: string): string {
  return html
    .replace(/<th(\s[^>]*)?>([\s\S]*?)<\/th>/gi, "<td><strong>$2</strong></td>")
    .replace(/<\/thead>\s*<tbody[^>]*>/gi, "")
    .replace(/<thead[^>]*>/gi, "<tbody>")
    .replace(/<\/thead>/gi, "</tbody>");
}

/*******************************************
 * The editor's paste hook: HTML to insert instead of Quill's normal paste,
 * or null to let Quill paste as usual.
 * - Markdown (e.g. from a code editor, which sends only styled <div>s) is
 *   converted to HTML.
 * - Rich HTML (Docs / Notion / websites / chat apps) is pasted as is, except
 *   that tables with header rows are fixed first. It isn't sanitised here:
 *   Quill reads formatting like bold from inline styles, which the sanitiser
 *   strips, and the article is sanitised on save anyway.
 */
export function articlePasteHtml(text: string, html: string): string | null {
  if (RICH_HTML.test(html))
    return TABLE_HEADER.test(html) ? fixTableHeaders(html) : null;
  if (!text || !looksLikeMarkdown(text)) return null;
  return markdownToHtml(text);
}
