import { Link, useOutletContext } from "react-router";
import "../../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { ArticleSummary } from "~/data/CustomTypes";
import { Icon } from "../elements/Icon";
import { ArticleCard } from "./ArticleCard";

export interface LatestArticlesProps {
  articles: ArticleSummary[];
}

/******************************
 * "From the blog": preview cards for the newest posts, plus a link to the
 * rest. Renders nothing until there's a post to show.
 */
export function LatestArticles({ articles }: LatestArticlesProps) {
  const context: SharedContextProps = useOutletContext();

  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="latest-articles"
      className={`col middle gap-20 shrink-p-10 border-box ${
        context.inShrink ? "w-100" : "w-75"
      }`}
    >
      <h2
        id="latest-articles"
        className="textCenter"
        style={{ color: "var(--txt)", letterSpacing: -1.5 }}
      >
        Ideas we've been exploring lately{" "}
      </h2>
      <div className="grid-350 gap-40 w-100">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
      <Link
        to="/blog"
        className="btn-look link-plain row middle center gap-5"
      >
        All articles
        <Icon name="arrow-forward" color="var(--accent)" />
      </Link>
    </section>
  );
}
