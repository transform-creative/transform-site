import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { OrgDecision, OrgOwner, OrgRadarRow, OrgSegment, OrgStatus } from "~/data/CustomTypes";
import { getOrgDecisions, getOrgOwners, getRadarOrgs } from "~/database/Read";
import { createOrgDecisions } from "~/database/Create";
import {
  DEFAULT_TIP_LEAK,
  SEGMENTS,
  SEGMENT_META,
  SORT_OPTIONS,
  STATUSES,
  STATUS_META,
  buildDecision,
  decisionLabel,
  decisionsByAbn,
  downloadFile,
  fmtDate,
  inSA,
  matchesSegment,
  notionSnippet,
  ownerSegment,
  ownersByAbn,
  scoreOrgs,
  snapshotFreshness,
  sortOrgs,
  toCsv,
  triage,
  withOwners,
  withTriage,
  type ScoredOrg,
  type SortDir,
  type SortKey,
  type TipLeakAssumptions,
} from "~/business/radarBL";
import { Icon } from "../elements/Icon";
import { PillToggle } from "../elements/PillToggle";
import { RadarKpis } from "./RadarKpis";
import { OrgRow } from "./OrgRow";
import { OrgSearch } from "./OrgSearch";
import { OrgDrawer } from "./OrgDrawer";
import { TipLeakPanel } from "./TipLeakPanel";
import { UpcomingList } from "./UpcomingList";
import { FundingMixLegend } from "./FundingMixBar";
import { DecideMenu, type DecideTarget } from "./DecideMenu";
import { NotFitTally } from "./NotFitTally";
import "../../app-v2.css";

type Scope = "sa" | "national";
type View = "warm" | "all" | "upcoming";
type SegmentFilter = OrgSegment | "all";

const PAGE_SIZE = 40;
const MAX_PICKS = 5;

const EMPTY_TEXT: Record<OrgStatus, string> = {
  new: "Inbox zero. Nothing new matches these filters.",
  pursuing: "Nothing being pursued. Copy picks for Notion to add them here.",
  snoozed: "Nothing snoozed.",
  not_fit: "Nothing marked as not a fit.",
  never: "Nothing on the never list.",
  client: "No clients marked yet.",
};

/******************************
 * The ACNC radar: which charities are worth a coffee this month, and why.
 */
interface Props {
  // Fill the parent instead of the standalone page's centred 75% column
  // (used when embedded in the client portal beside its side-nav).
  embedded?: boolean;
}

export function Radar({ embedded = false }: Props) {
  const context: SharedContextProps = useOutletContext();
  const [rows, setRows] = useState<OrgRadarRow[]>([]);
  const [decisions, setDecisions] = useState<OrgDecision[]>([]);
  const [owners, setOwners] = useState<OrgOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>("sa");
  const [status, setStatus] = useState<OrgStatus>("new");
  const [view, setView] = useState<View>("warm");
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [hidePassThrough, setHidePassThrough] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [assumptions, setAssumptions] = useState<TipLeakAssumptions>(DEFAULT_TIP_LEAK);
  const [picked, setPicked] = useState<string[]>([]);
  const [openAbn, setOpenAbn] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<ScoredOrg | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;
    Promise.all([getRadarOrgs(), getOrgDecisions(), getOrgOwners()])
      .then(([r, d, o]) => {
        if (!active) return;
        setRows(r);
        setDecisions(d);
        setOwners(o);
      })
      .catch(() => active && context.popAlert("Could not load the radar", "Please try again", true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const scored = useMemo(() => scoreOrgs(rows), [rows]);
  const decisionMap = useMemo(() => decisionsByAbn(decisions), [decisions]);
  const ownerMap = useMemo(() => ownersByAbn(owners), [owners]);
  const triaged = useMemo(
    () => withTriage(withOwners(scored, ownerMap), decisionMap),
    [scored, ownerMap, decisionMap]
  );
  const byAbn = useMemo(() => new Map(triaged.map((o) => [o.row.abn!, o])), [triaged]);
  const latestMonth = rows[0]?.snapshot_month ?? null;
  const loadedAt = rows.reduce<string | null>(
    (max, r) => (r.loaded_at && (!max || r.loaded_at > max) ? r.loaded_at : max),
    null
  );
  const freshness = snapshotFreshness(latestMonth, loadedAt);

  // Scope + filters shared by every tab and view
  const filtered = useMemo(
    () =>
      triaged.filter(
        (o) =>
          (scope === "national" || inSA(o.row)) &&
          matchesSegment(o.segment, segment) &&
          !(hidePassThrough && o.row.pass_through)
      ),
    [triaged, scope, segment, hidePassThrough]
  );
  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<OrgStatus, number>;
    for (const o of filtered) counts[o.triage!.status]++;
    return counts;
  }, [filtered]);
  const inStatus = useMemo(() => filtered.filter((o) => o.triage!.status === status), [filtered, status]);
  const warmCount = useMemo(() => inStatus.filter((o) => o.signals.length > 0).length, [inStatus]);
  const list = useMemo(
    () =>
      sortOrgs(
        view === "warm" ? inStatus.filter((o) => o.signals.length > 0) : inStatus,
        sortKey,
        sortDir,
        assumptions
      ),
    [inStatus, view, sortKey, sortDir, assumptions]
  );

  // Clients outside the fit segments aren't in the radar data; list them by saved
  // name. Only a manual tag can put them under Jenny / Phil.
  const allOffRadarClients = useMemo(
    () =>
      [...decisionMap.values()]
        .map((h) => h[0])
        .filter(
          (d) =>
            d.status === "client" &&
            !byAbn.has(d.abn) &&
            matchesSegment(ownerSegment(ownerMap.get(d.abn)), segment)
        ),
    [decisionMap, byAbn, ownerMap, segment]
  );
  const offRadarClients = status === "client" ? allOffRadarClients : [];

  function setOwner(abn: string, owner: OrgOwner | null) {
    setOwners((prev) => [...prev.filter((o) => o.abn !== abn), ...(owner ? [owner] : [])]);
  }

  useEffect(() => setLimit(PAGE_SIZE), [scope, status, view, segment, hidePassThrough, sortKey, sortDir]);

  function togglePick(abn: string) {
    if (picked.includes(abn)) {
      setPicked(picked.filter((a) => a !== abn));
    } else if (picked.length >= MAX_PICKS) {
      context.popAlert(`Up to ${MAX_PICKS} a week`, "Unpick one to add another", true);
    } else {
      setPicked([...picked, abn]);
    }
  }

  function addDecisions(saved: OrgDecision[]) {
    setDecisions((prev) => [...prev, ...saved]);
    const abns = new Set(saved.map((d) => d.abn));
    setPicked((prev) => prev.filter((a) => !abns.has(a)));
  }

  /** Copy for the Notion hit list, and mark them Pursuing (Notion owns them from here) */
  async function copyForNotion(orgs: ScoredOrg[]) {
    try {
      await navigator.clipboard.writeText(notionSnippet(orgs));
    } catch {
      context.popAlert("Could not copy", "Your browser blocked the clipboard", true);
      return;
    }
    const fresh = orgs.filter((o) => o.triage?.status !== "pursuing");
    try {
      if (fresh.length) {
        const saved = await createOrgDecisions(
          fresh.map((o) =>
            buildDecision({ ...o.row, abn: o.row.abn! }, "pursuing", {
              note: o.signals.map((s) => s.label).join(", ") || null,
              month: latestMonth,
            })
          )
        );
        addDecisions(saved);
      }
      setPicked([]);
      context.popAlert(
        orgs.length === 1 ? "Copied for Notion" : `Copied ${orgs.length} orgs for Notion`,
        "Paste into the hit list. Marked as Pursuing."
      );
    } catch {
      context.popAlert("Copied, but not marked Pursuing", "Please try marking them again", true);
    }
  }

  function exportCsv() {
    const rowsOut = view === "upcoming" ? sortOrgs(inStatus, sortKey, sortDir, assumptions) : list;
    downloadFile(
      `radar-${scope}-${STATUS_META[status].tab.toLowerCase().replace(/\s/g, "-")}-${view}-${latestMonth?.slice(0, 7) ?? "latest"}.csv`,
      toCsv(rowsOut, assumptions)
    );
  }

  function changeSort(key: SortKey) {
    setSortKey(key);
    setSortDir(SORT_OPTIONS.find((o) => o.key === key)!.dir);
  }

  const segmentOptions: { value: SegmentFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...SEGMENTS.map((s) => ({ value: s, label: SEGMENT_META[s].label })),
  ];
  const decideTarget: DecideTarget | null = deciding ? { ...deciding.row, abn: deciding.row.abn! } : null;
  const openScored = openAbn ? byAbn.get(openAbn) : undefined;

  return (
    <div className={`col middle gap-20 ${embedded ? "" : "ml-20 mr-20"}`} style={{ minHeight: "90vh" }}>
      <div className={`col gap-20 ${context.inShrink || embedded ? "w-100" : "w-75"}`}>
        {/* Header */}
        <header className="col gap-10 p-20 outline-secondary r-default" style={{ background: "var(--accent-sm)" }}>
          <div className={`row between start gap-20 ${context.inShrink ? "col" : ""}`}>
            <div className="col gap-5">
              <h1 style={{ fontSize: context.inShrink ? "2.4rem" : "3.2rem" }}>Radar</h1>
              <p className="text-sm">Which charities are worth a coffee this month, and why.</p>
              {!loading && (
                <small className={`badge ${freshness.ok ? "badge-soft" : "badge-warn"} row middle gap-5`}>
                  <Icon name={freshness.ok ? "checkmark-circle-outline" : "alert-circle-outline"} size={14} />
                  {freshness.label}
                </small>
              )}
            </div>
            <div className="col gap-10 w-100" style={{ maxWidth: 420 }}>
              <OrgSearch snapshotMonth={latestMonth} onOpen={setOpenAbn} />
              <PillToggle<Scope>
                ariaLabel="Scope"
                value={scope}
                onChange={setScope}
                options={[
                  { value: "sa", label: "SA" },
                  { value: "national", label: "National" },
                ]}
              />
            </div>
          </div>
        </header>

        {loading ? (
          <p className="center w-100">Loading…</p>
        ) : (
          <>
            <RadarKpis orgs={scored} />

            {/* Triage tabs */}
            <PillToggle<OrgStatus>
              ariaLabel="Status"
              value={status}
              onChange={setStatus}
              options={STATUSES.map((s) => ({
                value: s,
                label: `${STATUS_META[s].tab} (${statusCounts[s] + (s === "client" ? allOffRadarClients.length : 0)})`,
              }))}
            />

            {/* Controls */}
            <div className={`row gap-20 start ${context.inShrink ? "col" : ""}`}>
              <div className="col gap-10 flex-card-2">
                <PillToggle<View>
                  ariaLabel="View"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: "warm", label: `Warm now (${warmCount})` },
                    { value: "all", label: `All (${inStatus.length})` },
                    { value: "upcoming", label: "Upcoming" },
                  ]}
                />
                <PillToggle<SegmentFilter>
                  ariaLabel="Segment"
                  value={segment}
                  onChange={setSegment}
                  options={segmentOptions}
                />
                <div className="row wrap middle between gap-10">
                  <label className="row middle gap-5 text-sm">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={hidePassThrough}
                      onChange={(e) => setHidePassThrough(e.target.checked)}
                    />
                    Hide pass-through orgs
                  </label>
                  <div className="row middle gap-10">
                    <button
                      className="accentButton row middle gap-5 text-sm"
                      disabled={picked.length === 0}
                      onClick={() => copyForNotion(picked.map((a) => byAbn.get(a)!).filter(Boolean))}
                      title="Copy your picks as Markdown for the Notion hit list, and mark them Pursuing"
                    >
                      <Icon name="copy-outline" size={16} color="var(--bkg)" />
                      Copy {picked.length}/{MAX_PICKS} for Notion
                    </button>
                    {picked.length > 0 && (
                      <button className="text-button text-sm accent-text" onClick={() => setPicked([])}>
                        Clear
                      </button>
                    )}
                    <button className="row middle gap-5 outline-secondary text-sm" onClick={exportCsv}>
                      <Icon name="download-outline" size={16} color="var(--accent)" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-card">
                <TipLeakPanel value={assumptions} onChange={setAssumptions} />
              </div>
            </div>

            {status === "not_fit" && <NotFitTally byAbn={decisionMap} />}

            {/* List */}
            {view === "upcoming" ? (
              <UpcomingList orgs={inStatus} onOpen={setOpenAbn} />
            ) : list.length === 0 && offRadarClients.length === 0 ? (
              <div className="col middle center gap-10 outline p-20">
                <Icon name="checkmark-circle" size={48} color="var(--accent)" />
                <h3>Nothing here</h3>
                <p className="text-sm">{EMPTY_TEXT[status]}</p>
              </div>
            ) : (
              <section className="col" aria-label="Orgs">
                <div className="row between middle gap-10 wrap">
                  <div className="row middle gap-10 wrap">
                    <small className="text-sm muted">{list.length.toLocaleString("en-AU")} orgs · Sort by</small>
                    <select
                      className="text-sm"
                      aria-label="Sort by"
                      value={sortKey}
                      onChange={(e) => changeSort(e.target.value as SortKey)}
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="chip row middle gap-5"
                      onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                      aria-label={sortDir === "asc" ? "Ascending" : "Descending"}
                      title={sortDir === "asc" ? "Lowest first" : "Highest first"}
                    >
                      <Icon name={sortDir === "asc" ? "arrow-up-outline" : "arrow-down-outline"} size={14} color="var(--accent)" />
                      {sortKey === "name" ? (sortDir === "asc" ? "A–Z" : "Z–A") : sortDir === "asc" ? "Low first" : "High first"}
                    </button>
                  </div>
                  <FundingMixLegend />
                </div>
                {list.slice(0, limit).map((o) => (
                  <OrgRow
                    key={o.row.abn}
                    org={o}
                    assumptions={assumptions}
                    picked={picked.includes(o.row.abn!)}
                    onTogglePick={() => togglePick(o.row.abn!)}
                    onOpen={() => setOpenAbn(o.row.abn)}
                    onDecide={() => setDeciding(o)}
                  />
                ))}
                {list.length > limit && (
                  <button className="outline-secondary text-sm mt-10" onClick={() => setLimit(limit + PAGE_SIZE)}>
                    Show more ({list.length - limit} left)
                  </button>
                )}
                {offRadarClients.map((d) => {
                  const tag = ownerSegment(ownerMap.get(d.abn));
                  return (
                    <article key={d.abn} className="list-row row between middle gap-10">
                      <div className="row middle gap-10">
                        <button className="text-button" onClick={() => setOpenAbn(d.abn)}>
                          <h3>{d.name ?? d.abn}</h3>
                        </button>
                        {tag && (
                          <small className={`badge ${SEGMENT_META[tag].badge} row middle gap-5`} title="Set by hand">
                            <Icon name="pin-outline" size={12} />
                            {SEGMENT_META[tag].label}
                          </small>
                        )}
                      </div>
                      <small className="text-sm muted">
                        Not in the fit segments · {decisionLabel(d)} since {fmtDate(d.decided_at)}
                      </small>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>

      <OrgDrawer
        abn={openAbn}
        scored={openScored}
        assumptions={assumptions}
        decisions={openAbn ? decisionMap.get(openAbn) ?? [] : []}
        triage={openScored?.triage ?? triage(null, openAbn ? decisionMap.get(openAbn) : undefined)}
        owner={openAbn ? ownerMap.get(openAbn) : undefined}
        month={latestMonth}
        onClose={() => setOpenAbn(null)}
        onCopy={(o) => copyForNotion([o])}
        onDecided={addDecisions}
        onOwnerChange={setOwner}
      />

      <DecideMenu
        target={decideTarget}
        status={deciding?.triage?.status ?? "new"}
        owner={deciding ? ownerMap.get(deciding.row.abn!) : undefined}
        month={latestMonth}
        onClose={() => setDeciding(null)}
        onSaved={addDecisions}
        onOwnerChange={setOwner}
      />
    </div>
  );
}

