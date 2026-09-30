import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { Org } from "~/data/CustomTypes";
import { searchOrgs } from "~/database/Read";
import { SEGMENT_META, fmtMoney, segmentOf } from "~/business/radarBL";
import { Icon } from "../elements/Icon";
import "../../app-v2.css";

interface Props {
  snapshotMonth: string | null;
  onOpen: (abn: string) => void;
}

/******************************
 * Quick lookup: any charity in the latest snapshot by name or ABN,
 * fit or not. Picking one opens its story.
 */
export function OrgSearch({ snapshotMonth, onOpen }: Props) {
  const context: SharedContextProps = useOutletContext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Org[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || !snapshotMonth) {
      setResults(null);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      searchOrgs(q, snapshotMonth)
        .then((found) => active && setResults(found))
        .catch(() => active && context.popAlert("Search failed", "Please try again", true))
        .finally(() => active && setSearching(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, snapshotMonth]);

  function pick(abn: string) {
    onOpen(abn);
    setQuery("");
    setResults(null);
  }

  return (
    <div className="relative w-100" style={{ maxWidth: 420 }}>
      <div className="row middle gap-5">
        <Icon name="search-outline" color="var(--accent)" />
        <input
          type="search"
          value={query}
          placeholder="Search any charity by name or ABN"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          aria-label="Search charities by name or ABN"
          style={{ height: 40, fontSize: "1rem" }}
        />
      </div>
      {results && (
        <ul
          className="boxed col m0 p-10 scroll-y raised"
          style={{ position: "absolute", left: 0, right: 0, top: 46, maxHeight: 360, listStyle: "none", zIndex: 20 }}
        >
          {searching && <small className="text-sm muted">Searching…</small>}
          {!searching && results.length === 0 && (
            <small className="text-sm muted">No charity matches “{query.trim()}”.</small>
          )}
          {results.map((r) => {
            const seg = segmentOf(r);
            return (
              <li key={r.abn} className="list-row" style={{ padding: "8px 0" }}>
                <button className="text-button col gap-5 w-100" onClick={() => pick(r.abn)}>
                  <strong className="text-sm">{r.name}</strong>
                  <div className="row middle gap-5 wrap">
                    {seg && <small className={`badge ${SEGMENT_META[seg].badge}`}>{SEGMENT_META[seg].label}</small>}
                    <small className="text-sm muted">
                      {[r.town, r.state].filter(Boolean).join(", ")} · {fmtMoney(r.revenue_total)} revenue · ABN {r.abn}
                    </small>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
