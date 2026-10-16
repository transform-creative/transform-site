import { Link, useOutletContext } from "react-router";
import "../../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { Article, ArticleSummary } from "~/data/CustomTypes";
import { formatArticleDate, readingMinutes } from "~/business/blogBL";
import { Icon } from "../elements/Icon";
import { ArticleCard } from "./ArticleCard";

export interface ArticleViewProps {
  article: Pick<
    Article,
    "title" | "body" | "cover_image" | "cover_image_alt" | "published_at" | "keywords"
  > &
    // Absent in the editor preview
    Partial<Pick<Article, "author_name">>;
  /** Other posts to link to underneath (internal links help SEO) */
  more?: ArticleSummary[];
  /** Editor preview: no back link or "more" section */
  preview?: boolean;
}

/******************************
 * A full blog post: title, date, cover and the Quill HTML body. Used by
 * /blog/:slug (prerendered, so crawlers get the full text) and by the
 * editor's preview.
 */
export function ArticleView({ article, more = [], preview }: ArticleViewProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <article className="col middle w-100 gap-20 shrink-p-10 border-box">
      <header className="col middle center gap-10 mt-20 max-w-1000">
        {!preview && (
          <Link
            to="/blog"
            className="btn-look link-plain row middle center gap-5"
          >
            <Icon name="arrow-back" color="var(--accent)" />
            All articles
          </Link>
        )}
        <h1 className="textCenter" style={{ letterSpacing: -1.5 }}>
          {article.title || "Untitled"}
        </h1>
        <p className="muted textCenter">
          {/* Matches the BlogPosting author in the JSON-LD */}
          {article.author_name && `By ${article.author_name} · `}
          {article.published_at ? (
            <time dateTime={article.published_at}>
              {formatArticleDate(article.published_at)}
            </time>
          ) : (
            "Draft"
          )}
          {` · ${readingMinutes(article.body)} min read`}
        </p>
      </header>

      {article.cover_image && (
        <img
          src={article.cover_image}
          alt={article.cover_image_alt ?? ""}
          className="max-w-1000 media-16-9 object-cover"
        />
      )}

      <div
        className="prose max-w-720"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />

      {article.keywords.length > 0 && (
        <ul className="row wrap gap-10 max-w-720 p0 list-none" aria-label="Topics">
          {article.keywords.map((k) => (
            <li key={k} className="badge badge-soft m0">
              {k}
            </li>
          ))}
        </ul>
      )}

      {!preview && more.length > 0 && (
        <section className="col gap-20 w-75 mt-20">
          <div className="horizontal-line mediumFade" />
          <h2>More articles</h2>
          <div className="grid-350 gap-20">
            {more.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
