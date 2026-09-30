import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { OrgDecision } from "~/data/CustomTypes";
import { REASON_META, notFitTally } from "~/business/radarBL";
import "../../app-v2.css";

interface Props {
  byAbn: Map<string, OrgDecision[]>;
}

/******************************
 * Why orgs were rejected this quarter. A dominant reason is a filter problem,
 * not a triage one: tweak the threshold in the script.
 */
export function NotFitTally({ byAbn }: Props) {
  const context: SharedContextProps = useOutletContext();
  const tally = notFitTally(byAbn);
  const total = tally.reduce((sum, [, n]) => sum + n, 0);
  if (total === 0) return null;
  const [top, topCount] = tally[0];

  return (
    <div className={`col gap-5 p-10 outline-secondary r-default ${context.inShrink ? "" : "mb-10"}`}>
      <p className="field-label">Not a fit, last 90 days</p>
      <ul className="row wrap gap-5 m0 p0" style={{ listStyle: "none" }}>
        {tally.map(([reason, n]) => (
          <li key={reason} className="badge badge-soft num">
            {REASON_META[reason]} {n}
          </li>
        ))}
      </ul>
      {total >= 6 && topCount / total >= 0.5 && (
        <small className="text-sm muted">
          Half or more are "{REASON_META[top]}". That's a filter problem: tighten it in the script upstream.
        </small>
      )}
    </div>
  );
}
