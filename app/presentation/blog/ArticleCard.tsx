import { Link, useOutletContext } from "react-router";
import "../../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { ArticleSummary } from "~/data/CustomTypes";
import { formatArticleDate } from "~/business/blogBL";

export interface ArticleCardProps {
  article: ArticleSummary;
}

/******************************
 * A blog post in a listing: cover, date, title and excerpt. A real <a> so
 * crawlers follow it to the post.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <Link
      to={`/blog/${article.slug}`}
      className="col gap-10 link-plain zoom-on-hover"
      prefetch="intent"
    >
      <div className="media-16-9 r-default fill-bkg">
        {article.cover_image && (
          <img
            src={article.cover_image}
            alt={article.cover_image_alt ?? ""}
            loading="lazy"
            className="media-cover"
          />
        )}
      </div>
      <time className="muted text-sm" dateTime={article.published_at ?? ""}>
        {formatArticleDate(article.published_at)}
      </time>
      <h2 className="text-xl">{article.title}</h2>
      {article.excerpt && (
        <p className={context.inShrink ? "text-md" : ""}>{article.excerpt}</p>
      )}
    </Link>
  );
}
