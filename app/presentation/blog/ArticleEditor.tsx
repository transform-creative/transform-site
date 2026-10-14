import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import "../../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { Article, ArticleUpdate } from "~/data/CustomTypes";
import {
  ARTICLE_TOOLBAR,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  isPublished,
  parseKeywords,
  sanitizeArticleHtml,
  seoChecks,
  slugInput,
  slugify,
  truncate,
} from "~/business/blogBL";
import { articlePasteHtml } from "~/business/markdownBL";
import { createArticle, uploadArticleImage } from "~/database/Create";
import { updateArticle } from "~/database/Update";
import { deleteArticle } from "~/database/Delete";
import { LabelInput } from "../elements/LabelInput/LabelInput";
import { QuillEditor } from "../elements/QuillEditor";
import { Icon } from "../elements/Icon";
import { ArticleView } from "./ArticleView";

export interface ArticleEditorProps {
  /** The post to edit; omit to write a new one */
  article?: Article;
  /** Business the post belongs to (drives RLS) */
  businessId: number;
  onSaved: (article: Article) => void;
  onDeleted: (articleId: number) => void;
  onClose: () => void;
}

/** The editor's text fields; the Quill body is kept separately */
interface ArticleForm {
  title: string;
  slug: string;
  excerpt: string;
  seo_title: string;
  /** Comma separated while editing; saved as text[] */
  keywords: string;
  cover_image: string;
  cover_image_alt: string;
}

function formFrom(article?: Article): ArticleForm {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    seo_title: article?.seo_title ?? "",
    keywords: article?.keywords.join(", ") ?? "",
    cover_image: article?.cover_image ?? "",
    cover_image_alt: article?.cover_image_alt ?? "",
  };
}

/** Open the browser's file picker for one image; null when cancelled */
function pickImage(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/** Character count that turns red past the limit */
function Counter({ length, max }: { length: number; max: number }) {
  return (
    <p className={`text-sm ${length > max ? "color-danger" : "muted"}`}>
      {length}/{max}
    </p>
  );
}

/******************************
 * Write / edit one blog post: title, URL slug, Quill body, and the SEO fields
 * that feed the page's meta tags (description, title override, keywords,
 * share image + alt). The sidebar shows a Google result preview and an SEO
 * checklist. Admin Blog tab only.
 */
export function ArticleEditor({
  article,
  businessId,
  onSaved,
  onDeleted,
  onClose,
}: ArticleEditorProps) {
  const context: SharedContextProps = useOutletContext();
  // The saved row — starts empty for a new post and fills on first save
  const [current, setCurrent] = useState<Article | null>(article ?? null);
  const [form, setForm] = useState<ArticleForm>(() => formFrom(article));
  const [body, setBody] = useState(article?.body ?? "");
  // A new post's slug follows the title until it's edited by hand
  const [slugTouched, setSlugTouched] = useState(!!article);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const live = !!current && isPublished(current);
  const slug = slugify(form.slug);
  const keywords = useMemo(() => parseKeywords(form.keywords), [form.keywords]);
  const metaTitle = form.seo_title.trim() || form.title.trim();
  const checks = useMemo(
    () => seoChecks({ ...form, keywords, body }),
    [form, keywords, body],
  );
  const passed = checks.filter((c) => c.ok).length;

  function update<K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) {
    setDirty(true);
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  }

  function handleBody(html: string) {
    setBody(html);
    setDirty(true);
  }

  async function uploadImage(): Promise<string | null> {
    const file = await pickImage();
    if (!file) return null;
    try {
      return await uploadArticleImage(file);
    } catch (error: any) {
      context.popAlert("Could not upload the image", error?.message, true);
      return null;
    }
  }

  async function handleCoverUpload() {
    setUploadingCover(true);
    const url = await uploadImage();
    setUploadingCover(false);
    if (url) update("cover_image", url);
  }

  /**
   * Save the post. "publish" makes it live (keeping its original date if it
   * was already published), "draft" takes it offline, "keep" leaves it as is.
   */
  async function save(state: "publish" | "draft" | "keep") {
    if (!form.title.trim())
      return context.popAlert("Add a title first", undefined, true);
    if (!slug)
      return context.popAlert("Add a URL slug first", undefined, true);
    if (state === "publish" && !body)
      return context.popAlert("Write the article before publishing", undefined, true);

    const published_at =
      state === "publish"
        ? (current?.published_at ?? new Date().toISOString())
        : state === "draft"
          ? null
          : (current?.published_at ?? null);

    const payload: ArticleUpdate = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || null,
      seo_title: form.seo_title.trim() || null,
      keywords,
      cover_image: form.cover_image.trim() || null,
      cover_image_alt: form.cover_image_alt.trim() || null,
      body: sanitizeArticleHtml(body),
      published_at,
    };

    setSaving(true);
    try {
      const saved = current
        ? await updateArticle(current.id, payload)
        : await createArticle({
            ...payload,
            title: payload.title!,
            slug,
            business_id: businessId,
          });
      setCurrent(saved);
      setForm((prev) => ({ ...prev, slug: saved.slug }));
      setSlugTouched(true);
      setDirty(false);
      onSaved(saved);
      context.popAlert(
        state === "publish" && !live
          ? "Published"
          : state === "draft" && live
            ? "Unpublished"
            : "Saved",
        isPublished(saved)
          ? "The site rebuilds in a few minutes so search engines see the update"
          : undefined,
      );
    } catch (error: any) {
      context.popAlert(
        error?.code === "23505"
          ? "That URL is already used by another article"
          : "Could not save the article",
        error?.code === "23505" ? "Change the URL slug and try again" : error?.message,
        true,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!current) return;
    setSaving(true);
    try {
      await deleteArticle(current.id);
      context.popAlert("Article deleted");
      onDeleted(current.id);
    } catch (error: any) {
      context.popAlert("Could not delete the article", error?.message, true);
      setSaving(false);
    }
  }

  function handleBack() {
    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?"))
      return;
    onClose();
  }

  return (
    <div className="col gap-20 w-100">
      {/* Action bar */}
      <div
        className="row wrap middle between gap-10 p-20 r-default outline-secondary"
        style={{ background: "var(--accent-sm)" }}
      >
        <div className="row middle gap-10">
          <button className="row middle gap-5 outline-secondary" onClick={handleBack}>
            <Icon name="arrow-back" color="var(--accent)" />
            Articles
          </button>
          <p className={`badge ${live ? "badge-accent" : "badge-warn"}`}>
            {live ? "Published" : "Draft"}
            {dirty ? " · unsaved changes" : ""}
          </p>
        </div>
        <div className="row wrap middle gap-10">
          <button
            className="row middle gap-5 outline-secondary"
            onClick={() => setPreview((p) => !p)}
          >
            <Icon name={preview ? "create-outline" : "eye-outline"} color="var(--accent)" />
            {preview ? "Edit" : "Preview"}
          </button>
          {live && (
            <a
              href={`/blog/${current!.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn-look link-plain row middle gap-5"
            >
              <Icon name="open-outline" color="var(--accent)" />
              View live
            </a>
          )}
          {live ? (
            <>
              <button className="outline-secondary" disabled={saving} onClick={() => save("draft")}>
                Unpublish
              </button>
              <button className="accentButton row middle gap-5" disabled={saving} onClick={() => save("keep")}>
                <Icon name="save-outline" color="var(--bkg)" />
                Update
              </button>
            </>
          ) : (
            <>
              <button className="outline-secondary" disabled={saving} onClick={() => save("draft")}>
                Save draft
              </button>
              <button className="accentButton row middle gap-5" disabled={saving} onClick={() => save("publish")}>
                <Icon name="globe-outline" color="var(--bkg)" />
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      <div className="row wrap start gap-20 w-100">
        {/* Main column: content */}
        <div className="flex-card-2 col gap-10">
          {preview && (
            <div className="fill-bkg r-default pb-20">
              <ArticleView
                preview
                article={{
                  title: form.title,
                  body: sanitizeArticleHtml(body),
                  cover_image: form.cover_image || null,
                  cover_image_alt: form.cover_image_alt || null,
                  published_at: current?.published_at ?? null,
                  keywords,
                }}
              />
            </div>
          )}
          {/* Hidden rather than unmounted while previewing, so Quill keeps its undo history */}
          <div className="col gap-10" hidden={preview}>
            <LabelInput
              name="Title"
              placeholder="e.g. Why every charity needs a 60-second video"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
            <LabelInput
              name="URL slug"
              placeholder="why-every-charity-needs-a-60-second-video"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", slugInput(e.target.value));
              }}
            />
            <div className="row wrap middle between gap-10">
              <p className="text-sm muted break-word">
                transformcreative.com.au/blog/<b>{slug || "…"}</b>
              </p>
              {slugTouched && form.title && slug !== slugify(form.title) && (
                <button
                  className="text-button text-sm accent-text w-fit"
                  onClick={() => {
                    setSlugTouched(false);
                    update("slug", slugify(form.title));
                  }}
                >
                  Match the title
                </button>
              )}
            </div>
            {live && slug !== current!.slug && (
              <p className="text-sm color-danger row middle gap-5">
                <Icon name="warning-outline" color="var(--dangerColor)" />
                Changing a live post's URL breaks links already shared or indexed.
              </p>
            )}
            <QuillEditor
              key={article?.id ?? "new"}
              initialHTML={body}
              placeholder="Write your article… (use H2 / H3 for subheadings)"
              toolbar={ARTICLE_TOOLBAR}
              onChange={handleBody}
              onImageRequest={uploadImage}
              tables
              onPasteText={articlePasteHtml}
              className="editor-tall"
            />
            <p className="text-sm muted">
              Paste markdown (headings, bold, links, lists, tables) and it's
              formatted automatically. Ctrl+Z undoes the paste.
            </p>
          </div>
        </div>

        {/* Sidebar: SEO */}
        <aside className="flex-card col gap-20">
          <section className="col gap-10 p-20 r-default outline-secondary">
            <h3 className="bold">Search & sharing</h3>
            <LabelInput
              name="Meta description"
              isTextArea
              className="textarea-md"
              placeholder="One or two sentences that sell the click. Shown under the title in Google and on social cards."
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
            />
            <Counter length={form.excerpt.trim().length} max={SEO_DESCRIPTION_MAX} />
            <LabelInput
              name="SEO title (optional)"
              placeholder={form.title || "Defaults to the post title"}
              value={form.seo_title}
              onChange={(e) => update("seo_title", e.target.value)}
            />
            <Counter length={metaTitle.length} max={SEO_TITLE_MAX} />
            <LabelInput
              name="Keywords"
              placeholder="charity video, nonprofit marketing, Adelaide"
              value={form.keywords}
              onChange={(e) => update("keywords", e.target.value)}
            />
            <p className="text-sm muted">
              Comma separated. The first is your focus keyword.
            </p>
          </section>

          <section className="col gap-10 p-20 r-default outline-secondary">
            <h3 className="bold">Share image</h3>
            <div className="media-16-9 r-default fill-bkg col middle center">
              {form.cover_image ? (
                <img
                  src={form.cover_image}
                  alt={form.cover_image_alt}
                  className="media-cover"
                />
              ) : (
                <Icon name="image-outline" size={40} color="var(--accent-lg)" />
              )}
            </div>
            <button
              className="row middle center gap-5 outline-secondary"
              disabled={uploadingCover}
              onClick={handleCoverUpload}
            >
              <Icon
                name="cloud-upload-outline"
                color="var(--accent)"
                className={uploadingCover ? "spin360" : ""}
              />
              {uploadingCover ? "Uploading…" : "Upload image"}
            </button>
            <LabelInput
              name="…or image URL"
              placeholder="https://"
              value={form.cover_image}
              onChange={(e) => update("cover_image", e.target.value)}
            />
            <LabelInput
              name="Alt text"
              placeholder="Describe the image for screen readers and Google Images"
              value={form.cover_image_alt}
              onChange={(e) => update("cover_image_alt", e.target.value)}
            />
            <p className="text-sm muted">
              Shown at the top of the post and on Facebook / LinkedIn / Google
              cards. 1200×630 works best.
            </p>
          </section>

          <section className="col gap-10 p-20 r-default outline-secondary">
            <h3 className="bold">Google preview</h3>
            <div className="fill-white-card col gap-5">
              <p className="text-sm color-url break-word">
                transformcreative.com.au › blog › {slug || "…"}
              </p>
              <p className="text-xl color-link">
                {truncate(`${metaTitle || "Untitled"} | Transform Creative`, SEO_TITLE_MAX + 3)}
              </p>
              <p className="text-sm">
                {form.excerpt.trim()
                  ? truncate(form.excerpt.trim())
                  : "Add a meta description, or Google will pick some text from the article."}
              </p>
            </div>
          </section>

          <section className="col gap-10 p-20 r-default outline-secondary">
            <h3 className="bold">
              SEO checklist ({passed}/{checks.length})
            </h3>
            <ul className="col gap-5 p0 list-none">
              {checks.map((c) => (
                <li key={c.label} className="row middle gap-10 m0 text-sm">
                  <Icon
                    name={c.ok ? "checkmark-circle-outline" : "ellipse-outline"}
                    color={c.ok ? "var(--accent)" : "var(--accent-lg)"}
                  />
                  {c.label}
                </li>
              ))}
            </ul>
          </section>

          {current && (
            <section className="col gap-10 p-20 r-default outline-secondary">
              {confirmDelete ? (
                <>
                  <p>Delete “{current.title}” for good? This can't be undone.</p>
                  <div className="row gap-10">
                    <button className="outline-secondary w-100" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </button>
                    <button className="dangerButton w-100" disabled={saving} onClick={handleDelete}>
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="row middle center gap-5 outline-secondary"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Icon name="trash-outline" color="var(--dangerColor)" />
                  Delete article
                </button>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
