import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import {
  SEGMENT_META,
  STALE_FINANCIALS_MONTHS,
  STATUS_META,
  decisionLabel,
  fmtDate,
  fmtCount,
  fmtGrowth,
  fmtMoney,
  fmtPct,
  fyLabel,
  isJenny,
  isStaleFinancials,
  tipLeak,
  websiteUrl,
  type ScoredOrg,
  type TipLeakAssumptions,
} from "~/business/radarBL";
import { Icon } from "../elements/Icon";
import { FundingMixBar } from "./FundingMixBar";
import "../../app-v2.css";

interface Props {
  org: ScoredOrg;
  assumptions: TipLeakAssumptions;
  picked: boolean;
  onTogglePick: () => void;
  onOpen: () => void;
  onDecide: () => void;
}

/******************************
 * One org in the radar list: who they are, why now, and the money at a glance.
 */
export function OrgRow({ org, assumptions, picked, onTogglePick, onOpen, onDecide }: Props) {
  const context: SharedContextProps = useOutletContext();
  const { row, segment, signals, triage } = org;
  const decision = triage?.current?.status !== "new" ? triage?.current : null;
  const seg = SEGMENT_META[segment];
  const site = websiteUrl(row.website);
  const stale = isStaleFinancials(row.ais_period_end);
  const leak = isJenny(row) ? tipLeak(row, assumptions) : null;

  return (
    <article className={`list-row row gap-20 ${context.inShrink ? "col" : ""}`}>
      <div className="col gap-5 flex-card-2">
        <div className="row middle gap-10">
          <input
            type="checkbox"
            className="checkbox"
            checked={picked}
            onChange={onTogglePick}
            aria-label={`Pick ${row.name} for the hit list`}
            title="Pick for the Notion hit list"
          />
          <button className="text-button" onClick={onOpen}>
            <h3>{row.name}</h3>
          </button>
          <button className="chip row middle gap-5" onClick={onDecide} title="Pursue, snooze, pass...">
            <Icon name="git-branch-outline" size={14} color="var(--accent)" />
            Decide
          </button>
        </div>

        <div className="row wrap middle gap-5">
          {triage?.woke && (
            <small className="badge badge-warn row middle gap-5" title="Came back to the inbox">
              <Icon name="alarm-outline" size={12} />
              Woke: {triage.woke}
            </small>
          )}
          {triage && triage.status !== "new" && (
            <small className={`badge ${STATUS_META[triage.status].badge} row middle gap-5`}>
              <Icon name={STATUS_META[triage.status].icon} size={12} />
              {decision ? decisionLabel(decision) : STATUS_META[triage.status].label}
            </small>
          )}
          <small className={`badge ${seg.badge}`}>{seg.label}</small>
          {row.pass_through && (
            <small
              className="badge badge-warn row middle gap-5"
              title="Most of their spending goes straight back out as grants. Revenue looks big, but little is left for their own tech."
            >
              <Icon name="warning-outline" size={12} />
              Pass-through · {fmtPct(row.grants_share)} granted out
            </small>
          )}
          {row.state !== "SA" && row.operates_in_sa && (
            <small className="badge badge-outline">Based in {row.state}, operates in SA</small>
          )}
        </div>

        <p className="text-sm muted">
          {[row.town, row.state].filter(Boolean).join(", ")}
          {site && (
            <>
              {" · "}
              <a className="link text-sm" href={site} target="_blank" rel="noreferrer">
                {row.website}
              </a>
            </>
          )}
        </p>

        {decision && (triage?.woke || decision.note) && (
          <small className="text-sm muted">
            {triage?.woke ? `Was ${decisionLabel(decision)}, ` : ""}
            {fmtDate(decision.decided_at)}
            {decision.note ? ` · "${decision.note}"` : ""}
          </small>
        )}

        {signals.length > 0 && (
          <ul className="row wrap gap-5 m0 p0" style={{ listStyle: "none" }}>
            {signals.map((s) => (
              <li key={s.key} className="badge badge-soft row middle gap-5" title={s.detail}>
                <Icon name={s.icon} size={12} />
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="col gap-10 flex-card">
        <dl className="grid-110 m0">
          <Stat label="Revenue" value={fmtMoney(row.revenue_total)} />
          <Stat label="Donations" value={fmtMoney(row.donations_bequests)} />
          <Stat
            label="Growth YoY"
            value={fmtGrowth(row.donations_growth ?? row.revenue_growth)}
            hint={
              row.donations_growth != null
                ? `Donations ${fmtGrowth(row.donations_growth)}, revenue ${fmtGrowth(row.revenue_growth)}`
                : `Revenue ${fmtGrowth(row.revenue_growth)}`
            }
          />
          <Stat
            label="Staff · Vols"
            value={`${fmtCount(row.fte)} · ${fmtCount(row.volunteers)}`}
            hint="Full-time equivalent staff · volunteers"
          />
          <Stat
            label="Online giving"
            value={row.fundraising_online == null ? "–" : row.fundraising_online ? "Yes" : "No"}
          />
          <Stat
            label="Financials"
            value={fyLabel(row.ais_period_end)}
            hint={
              stale
                ? `Stale: these numbers are over ${STALE_FINANCIALS_MONTHS} months old`
                : row.ais_period_end ? `Year ending ${row.ais_period_end}` : ""
            }
            warn={stale}
          />
          {isJenny(row) && (
            <Stat
              label="Tip leak (what-if)"
              value={leak == null ? "–" : `~${fmtMoney(leak)}/yr`}
              hint={
                leak == null
                  ? "Not fundraising online"
                  : "Donations x online share x donor tip. Adjustable assumptions, not a fact."
              }
            />
          )}
        </dl>
        {row.revenue_total != null && <FundingMixBar row={row} />}
      </div>
    </article>
  );
}

interface StatProps {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}

function Stat({ label, value, hint, warn }: StatProps) {
  return (
    <div className="col gap-5" title={hint}>
      <dt className="field-label">{label}</dt>
      <dd className={`m0 num ${warn ? "danger-text" : ""}`}>
        <strong>{value}</strong>
      </dd>
    </div>
  );
}
