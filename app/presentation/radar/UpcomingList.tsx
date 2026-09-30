import { useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import {
  BUDGET_WINDOW,
  SEGMENT_META,
  fmtMoney,
  monthName,
  monthsUntil,
  sortRadar,
  type ScoredOrg,
} from "~/business/radarBL";
import "../../app-v2.css";

interface Props {
  orgs: ScoredOrg[];
  onOpen: (abn: string) => void;
}

const MONTHS_AHEAD = 6;
const GROUP_PREVIEW = 12;

/******************************
 * Planning view: budget seasons (by financial-year end) and anniversaries
 * coming up in the next few months.
 */
export function UpcomingList({ orgs, onOpen }: Props) {
  const context: SharedContextProps = useOutletContext();
  const today = new Date();
  const year = today.getFullYear();

  const budgetGroups = Array.from({ length: MONTHS_AHEAD }, (_, i) => i + 1).map((ahead) => {
    const month = ((today.getMonth() + ahead) % 12) + 1;
    const pitchFrom = ahead - BUDGET_WINDOW[1];
    return {
      key: `fy-${month}`,
      title: `FY ends ${monthName(month, true)}`,
      note:
        ahead >= BUDGET_WINDOW[0] && ahead <= BUDGET_WINDOW[1]
          ? "Budget season now"
          : pitchFrom > 0
          ? `Budget season from ${monthName(((today.getMonth() + pitchFrom) % 12) + 1, true)}`
          : "Budget probably set already",
      orgs: orgs.filter((o) => monthsUntil(o.row.fy_end_month, today) === ahead).sort(sortRadar),
    };
  });

  const anniversaryGroups = [year, year + 1].map((y) => ({
    key: `anniv-${y}`,
    title: `Anniversaries in ${y}`,
    note: "Great for video, often a web refresh",
    orgs: orgs
      .filter((o) => o.row.anniversary_year === y)
      // Oldest first = biggest milestone first
      .sort((a, b) => (a.row.established_year ?? 9999) - (b.row.established_year ?? 9999) || sortRadar(a, b)),
  }));

  return (
    <div className={`row gap-20 start ${context.inShrink ? "col" : ""}`}>
      <section className="col gap-10 flex-card">
        <h3>Budget seasons</h3>
        {budgetGroups.map((g) => (
          <Group {...g} key={g.key} onOpen={onOpen} />
        ))}
      </section>
      <section className="col gap-10 flex-card">
        <h3>Anniversaries</h3>
        {anniversaryGroups.map((g) => (
          <Group {...g} key={g.key} onOpen={onOpen} showMilestone />
        ))}
      </section>
    </div>
  );
}

interface GroupProps {
  title: string;
  note: string;
  orgs: ScoredOrg[];
  onOpen: (abn: string) => void;
  showMilestone?: boolean;
}

function Group({ title, note, orgs, onOpen, showMilestone }: GroupProps) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? orgs : orgs.slice(0, GROUP_PREVIEW);

  return (
    <div className="stat-tile col gap-5">
      <div className="row between middle gap-10">
        <strong>{title}</strong>
        <small className="badge badge-soft num">{orgs.length}</small>
      </div>
      <small className="text-sm muted">{note}</small>
      {orgs.length === 0 && <small className="text-sm muted">None in this view.</small>}
      <ul className="col gap-5 m0 p0" style={{ listStyle: "none" }}>
        {shown.map((o) => (
          <li key={o.row.abn} className="row between middle gap-10">
            <button className="text-button text-sm truncate" onClick={() => onOpen(o.row.abn!)}>
              {o.row.name}
            </button>
            <div className="row middle gap-5">
              {showMilestone && <small className="badge badge-outline">{o.row.anniversary_label}</small>}
              <small className={`badge ${SEGMENT_META[o.segment].badge}`}>{SEGMENT_META[o.segment].label}</small>
              <small className="text-sm num muted">{fmtMoney(o.row.revenue_total)}</small>
            </div>
          </li>
        ))}
      </ul>
      {orgs.length > GROUP_PREVIEW && (
        <button className="text-button text-sm accent-text" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer" : `Show all ${orgs.length}`}
        </button>
      )}
    </div>
  );
}
