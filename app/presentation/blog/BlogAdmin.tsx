import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import "../../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { Article } from "~/data/CustomTypes";
import { getBusinessArticles } from "~/database/Read";
import { formatArticleDate, isPublished } from "~/business/blogBL";
import { Icon } from "../elements/Icon";
import { ArticleEditor } from "./ArticleEditor";

export interface BlogAdminProps {
  businessId: number;
}

/** "Published 14 October 2026" / "Scheduled …" / "Draft" */
function statusBadge(article: Article): { label: string; className: string } {
  if (!article.published_at) return { label: "Draft", className: "badge-warn" };
  if (!isPublished(article))
    return {
      label: `Scheduled ${formatArticleDate(article.published_at)}`,
      className: "badge-outline",
    };
  return {
    label: `Published ${formatArticleDate(article.published_at)}`,
    className: "badge-accent",
  };
}

/******************************
 * Admin portal "Blog" tab: every post (drafts included), newest edit first.
 * Opening one (or "New article") swaps the list for the ArticleEditor.
 */
export function BlogAdmin({ businessId }: BlogAdminProps) {
  const context: SharedContextProps = useOutletContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  // The open post; "new" = a fresh one, null = showing the list
  const [editing, setEditing] = useState<Article | "new" | null>(null);

  useEffect(() => {
    let active = true;
    getBusinessArticles(businessId)
      .then((data) => active && setArticles(data))
      .catch(() =>
        context.popAlert("Could not load the articles", "Please try again", true),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [businessId]);

  function handleSaved(saved: Article) {
    setArticles((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
  }

  function handleDeleted(articleId: number) {
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    setEditing(null);
  }

  if (editing)
    return (
      <ArticleEditor
        article={editing === "new" ? undefined : editing}
        businessId={businessId}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onClose={() => setEditing(null)}
      />
    );

  const liveCount = articles.filter(isPublished).length;

  return (
    <div className="col gap-20 w-100">
      <div
        className="row wrap middle between gap-10 p-20 r-default outline-secondary"
        style={{ background: "var(--accent-sm)" }}
      >
        <div className="col gap-5">
          <h1 className="accent">Blog</h1>
          <p>
            <strong>{liveCount}</strong> published ·{" "}
            <strong>{articles.length - liveCount}</strong> drafts / scheduled
          </p>
        </div>
        <button
          className="accentButton row middle gap-5"
          onClick={() => setEditing("new")}
        >
          <Icon name="add-outline" color="var(--bkg)" />
          New article
        </button>
      </div>

      {loading ? (
        <p className="center w-100">Loading…</p>
      ) : articles.length === 0 ? (
        <div className="col middle center gap-10 p-20">
          <Icon name="newspaper-outline" size={48} color="var(--accent)" />
          <h3>No articles yet</h3>
          <p>Click “New article” to write your first post.</p>
        </div>
      ) : (
        <ul className="col p0 list-none">
          {articles.map((article) => {
            const badge = statusBadge(article);
            return (
              <li key={article.id} className="list-row m0">
                <button
                  className="text-button row middle gap-20 w-100"
                  onClick={() => setEditing(article)}
                >
                  <div className="media-16-9 r-default fill-bkg no-shrink" style={{ width: 120 }}>
                    {article.cover_image && (
                      <img
                        src={article.cover_image}
                        alt=""
                        loading="lazy"
                        className="media-cover"
                      />
                    )}
                  </div>
                  <div className="col gap-5 min-w-0 grow-1">
                    <h3 className="truncate">{article.title}</h3>
                    <p className="text-sm muted truncate">/blog/{article.slug}</p>
                  </div>
                  <p className={`badge ${badge.className}`}>{badge.label}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
