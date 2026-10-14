import { useOutletContext } from "react-router";
import "../../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { ArticleSummary } from "~/data/CustomTypes";
import { ArticleCard } from "./ArticleCard";

export interface BlogIndexProps {
  articles: ArticleSummary[];
}

/******************************
 * /blog: every published post, newest first.
 */
export function BlogIndex({ articles }: BlogIndexProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <div className="col middle w-100 gap-20 mb-20 shrink-p-10 border-box">
      <header className="col middle center gap-10 mt-20 max-w-720">
        <h1 className="textCenter" style={{ letterSpacing: -1.5 }}>
          <small className="eyebrow accent-text">Blog</small>
          Ideas for nonprofits that want to be seen
        </h1>
        <p className="textCenter">
          Video, websites and digital comms for Australian charities, churches
          and not-for-profits, from the Transform Creative team in Adelaide.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="muted mt-20">New articles are on the way.</p>
      ) : (
        <div className={`grid-350 gap-40 ${context.inShrink ? "w-100" : "w-75"}`}>
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
