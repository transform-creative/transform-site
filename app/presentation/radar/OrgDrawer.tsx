import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { Org, OrgDecision } from "~/data/CustomTypes";
import { getOrgHistory } from "~/database/Read";
import {
  SEGMENT_META,
  STATUS_META,
  acncUrl,
  decisionLabel,
  fmtDate,
  fmtCount,
  fmtGrowth,
  fmtMoney,
  fmtPct,
  fmtSnapshot,
  fyLabel,
  isJenny,
  isStaleFinancials,
  monthName,
  moneyOverTime,
  purposeTags,
  segmentOf,
  tipLeak,
  websiteUrl,
  type ScoredOrg,
  type TipLeakAssumptions,
  type Triage,
} from "~/business/radarBL";
import { DecisionForm } from "./DecideMenu";
import BasicMenu from "../elements/BasicMenu";
import { Icon } from "../elements/Icon";
import { MoneySparkline } from "./MoneySparkline";
import { FundingMixBar } from "./FundingMixBar";
import "../../app-v2.css";

interface Props {
  abn: string | null;
  /** Present when the org is on this month's radar (gives its warm signals) */
  scored?: ScoredOrg;
  assumptions: TipLeakAssumptions;
  /** This org's decisions, newest first */
  decisions: OrgDecision[];
  triage: Triage;
  /** The latest snapshot month (the baseline for waking) */
  month: string | null;
  onClose: () => void;
  onCopy: (org: ScoredOrg) => void;
  onDecided: (rows: OrgDecision[]) => void;
}

/******************************
 * An org's story before outreach: why now, the money over time, what it
 * does, and where to find it (website, ACNC).
 */
export function OrgDrawer({
  abn,
  scored,
  assumptions,
  decisions,
  triage,
  month,
  onClose,
  onCopy,
  onDecided,
}: Props) {
  const context: SharedContextProps = useOutletContext();
  const [history, setHistory] = useState<Org[] | null>(null);

  useEffect(() => {
    if (!abn) return;
    let active = true;
    setHistory(null);
    getOrgHistory(abn)
      .then((h) => active && setHistory(h))
      .catch(() => {
        if (!active) return;
        context.popAlert("Could not load this charity", "Please try again", true);
        onClose();
      });
    return () => {
      active = false;
    };
  }, [abn]);

  const org = history?.[history.length - 1];

  return (
    <BasicMenu active={!!abn} onClose={onClose} width={context.inShrink ? "95%" : 820}>
      {!org && <p className="center w-100 text-sm">Loading…</p>}
      {org && (
        <div className="col gap-20">
          <Header org={org} scored={scored} onCopy={onCopy} />
          <Decision
            org={org}
            decisions={decisions}
            triage={triage}
            month={month}
            onDecided={onDecided}
          />
          <WhyNow org={org} scored={scored} />
          <KeyNumbers org={org} assumptions={assumptions} />
          <section className="col gap-10">
            <p className="field-label">Money over time</p>
            <MoneySparkline points={moneyOverTime(history!)} />
          </section>
          <WhatTheyDo org={org} />
          <small className="text-sm muted">
            In {history!.length} monthly snapshot{history!.length === 1 ? "" : "s"} since{" "}
            {fmtSnapshot(history![0].snapshot_month)}. ABN {org.abn}.
          </small>
        </div>
      )}
    </BasicMenu>
  );
}

function Header({ org, scored, onCopy }: { org: Org; scored?: ScoredOrg; onCopy: (o: ScoredOrg) => void }) {
  const seg = segmentOf(org);
  const site = websiteUrl(org.website);
  return (
    <header className="col gap-10">
      <h3 style={{ fontSize: "1.6rem", lineHeight: 1.2 }}>{org.name}</h3>
      {org.other_names && <small className="text-sm muted">Also known as {org.other_names}</small>}
      <div className="row wrap middle gap-5">
        {seg && <small className={`badge ${SEGMENT_META[seg].badge}`}>{SEGMENT_META[seg].label}</small>}
        {org.charity_size && <small className="badge badge-outline">{org.charity_size}</small>}
        {org.pass_through && (
          <small className="badge badge-warn row middle gap-5">
            <Icon name="warning-outline" size={12} />
            Pass-through · {fmtPct(org.grants_share)} of spending granted out
          </small>
        )}
        {org.excluded && <small className="badge badge-warn">Excluded ({org.excluded_reason})</small>}
        <small className="text-sm muted">{[org.town, org.state, org.postcode].filter(Boolean).join(", ")}</small>
      </div>
      <div className="row wrap middle gap-10">
        {site && (
          <a className="row middle gap-5 outline-secondary p-5 r-default text-sm accent-text" href={site} target="_blank" rel="noreferrer">
            <Icon name="globe-outline" size={16} color="var(--accent)" />
            {org.website}
          </a>
        )}
        <a className="row middle gap-5 outline-secondary p-5 r-default text-sm accent-text" href={acncUrl(org.abn)} target="_blank" rel="noreferrer">
          <Icon name="open-outline" size={16} color="var(--accent)" />
          ACNC register
        </a>
        {scored && (
          <button className="accentButton row middle gap-5 text-sm" onClick={() => onCopy(scored)}>
            <Icon name="copy-outline" size={16} color="var(--bkg)" />
            Copy for Notion
          </button>
        )}
      </div>
    </header>
  );
}

interface DecisionProps {
  org: Org;
  decisions: OrgDecision[];
  triage: Triage;
  month: string | null;
  onDecided: (rows: OrgDecision[]) => void;
}

/** Where this org sits, why, and every call made on it */
function Decision({ org, decisions, triage, month, onDecided }: DecisionProps) {
  const [deciding, setDeciding] = useState(false);
  const meta = STATUS_META[triage.status];

  return (
    <section className="col gap-10 p-10 outline-secondary r-default">
      <div className="row between middle gap-10 wrap">
        <div className="row wrap middle gap-5">
          <p className="field-label">Decision</p>
          <small className={`badge ${meta.badge} row middle gap-5`}>
            <Icon name={meta.icon} size={12} />
            {triage.status === "new" ? "Inbox" : meta.label}
          </small>
          {triage.woke && (
            <small className="badge badge-warn row middle gap-5">
              <Icon name="alarm-outline" size={12} />
              Woke: {triage.woke}
            </small>
          )}
        </div>
        <button className="chip row middle gap-5" onClick={() => setDeciding(!deciding)}>
          <Icon name={deciding ? "close-outline" : "git-branch-outline"} size={14} color="var(--accent)" />
          {deciding ? "Cancel" : "Decide"}
        </button>
      </div>

      {deciding && (
        <DecisionForm
          target={org}
          status={triage.status}
          month={month}
          onSaved={(rows) => {
            onDecided(rows);
            setDeciding(false);
          }}
        />
      )}

      {decisions.length > 0 && (
        <ol className="col gap-5 m0 p0" style={{ listStyle: "none" }}>
          {decisions.map((d) => (
            <li key={d.id} className="row gap-10 text-sm">
              <small className="text-sm muted num" style={{ minWidth: 80 }}>
                {fmtDate(d.decided_at)}
              </small>
              <div className="col">
                <strong className="text-sm">{decisionLabel(d)}</strong>
                {d.note && <small className="text-sm muted">"{d.note}"</small>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function WhyNow({ org, scored }: { org: Org; scored?: ScoredOrg }) {
  return (
    <section className="col gap-10">
      <p className="field-label">Why now</p>
      {!scored ? (
        <p className="text-sm muted">
          {org.segment ? "Not on this month's radar." : "Doesn't fit Jenny or Phil on the current thresholds."}
        </p>
      ) : scored.signals.length === 0 ? (
        <p className="text-sm muted">Fits, but no warm signal this month. Fit, not warmth.</p>
      ) : (
        <ul className="col gap-5 m0 p0" style={{ listStyle: "none" }}>
          {scored.signals.map((s) => (
            <li key={s.key} className="row start gap-10 text-sm">
              <Icon name={s.icon} size={16} color="var(--accent)" />
              <div className="col">
                <strong>{s.label}</strong>
                <small className="text-sm muted">{s.detail}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function KeyNumbers({ org, assumptions }: { org: Org; assumptions: TipLeakAssumptions }) {
  const stale = isStaleFinancials(org.ais_period_end);
  const leak = isJenny(org) ? tipLeak(org, assumptions) : null;
  const stats: [string, string, boolean?][] = [
    ["Revenue", fmtMoney(org.revenue_total)],
    ["Donations", fmtMoney(org.donations_bequests)],
    ["Revenue growth", fmtGrowth(org.revenue_growth)],
    ["Donations growth", fmtGrowth(org.donations_growth)],
    ["Net surplus", fmtMoney(org.net_surplus)],
    ["Staff (FTE)", fmtCount(org.fte)],
    ["Volunteers", fmtCount(org.volunteers)],
    ["Online giving", org.fundraising_online == null ? "–" : org.fundraising_online ? "Yes" : "No"],
    ["Financials", `${fyLabel(org.ais_period_end)}${stale ? " (stale)" : ""}`, stale],
    ["FY ends", monthName(org.fy_end_month, true)],
    ["Board size", fmtCount(org.responsible_persons_count)],
    ["Established", org.established_year ? `${org.established_year}${org.anniversary_label ? ` · ${org.anniversary_label} in ${org.anniversary_year}` : ""}` : "–"],
  ];
  if (isJenny(org)) stats.push(["Tip leak (what-if)", leak == null ? "Not online" : `~${fmtMoney(leak)}/yr`]);

  return (
    <section className="col gap-10">
      <p className="field-label">Key numbers</p>
      <dl className="grid-110 m0">
        {stats.map(([label, value, warn]) => (
          <div key={label} className="col gap-5">
            <dt className="text-sm muted">{label}</dt>
            <dd className={`m0 num ${warn ? "danger-text" : ""}`}>
              <strong>{value}</strong>
            </dd>
          </div>
        ))}
      </dl>
      {org.revenue_total != null && <FundingMixBar row={org} />}
    </section>
  );
}

function WhatTheyDo({ org }: { org: Org }) {
  const tags = purposeTags(org);
  return (
    <section className="col gap-10">
      <p className="field-label">What they do</p>
      {tags.length > 0 && (
        <div className="row wrap gap-5">
          {tags.map((t) => (
            <small key={t} className="badge badge-soft">{t}</small>
          ))}
        </div>
      )}
      <p className="text-sm" style={{ whiteSpace: "pre-line" }}>
        {org.how_purposes_pursued || "No description lodged."}
      </p>
    </section>
  );
}
