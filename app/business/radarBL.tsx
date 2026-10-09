import type { IoniconName } from "~/data/Ionicons";
import type {
  DecisionReason,
  Org,
  OrgDecision,
  OrgOwner,
  OrgRadarRow,
  OrgSegment,
  OrgStatus,
} from "~/data/CustomTypes";
import type { TablesInsert } from "~/database/supabase";

/*******************************************
 * ACNC radar business logic: formatting, warm signals, scoring, the tip-leak
 * what-if, freshness and export. Change detection (website / name / board /
 * new financials / new in data) comes from the `org_radar` view; everything
 * date-relative is computed here so it's easy to tune.
 */

/** Transform Creative's businesses.id: the only agency allowed on the radar */
export const TRANSFORM_BUSINESS_ID = 129;

// ---------------------------------------------------------------------------
// Tune these
// ---------------------------------------------------------------------------
/** Year-on-year growth (revenue or donations) at or above this is a warm signal */
export const GROWTH_SIGNAL = 0.1;
/** Budget season = financial year ends this many months from now (inclusive) */
export const BUDGET_WINDOW: [number, number] = [2, 4];
/**
 * Financials older than this many months are flagged as stale. ACNC's newest
 * AIS release already lags ~15-21 months (e.g. FY Dec 24 in Sept 2026), so
 * anything under this is simply the latest there is.
 */
export const STALE_FINANCIALS_MONTHS = 24;
/** The monthly load runs on the 2nd; after this day, a missing month is late */
export const LOAD_GRACE_DAY = 3;

/** The tip-leak what-if inputs. Both are assumptions, not data. */
export interface TipLeakAssumptions {
  /** Share of donations raised online (0-1) */
  onlineShare: number;
  /** Donor tip the platform keeps, as a share of the gift (0-1) */
  tipRate: number;
}
export const DEFAULT_TIP_LEAK: TipLeakAssumptions = {
  onlineShare: 0.3,
  tipRate: 0.05,
};

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------
export const SEGMENT_META: Record<
  OrgSegment,
  { label: string; blurb: string; badge: string; order: number }
> = {
  both: {
    label: "Both",
    blurb: "Jenny and Phil. Best leads.",
    badge: "badge-accent",
    order: 0,
  },
  jenny: {
    label: "Jenny",
    blurb: "Software. Donor-funded, $1M-$10M.",
    badge: "badge-soft",
    order: 1,
  },
  phil: {
    label: "Phil",
    blurb: "Video series. Christian org, $1M+.",
    badge: "badge-soft",
    order: 2,
  },
  phil_review: {
    label: "Needs a look",
    blurb: "Religious, no financials on file.",
    badge: "badge-outline",
    order: 3,
  },
};
export const SEGMENTS: OrgSegment[] = ["both", "jenny", "phil", "phil_review"];

export function segmentOf(row: { segment: string | null }): OrgSegment | null {
  return row.segment && row.segment in SEGMENT_META
    ? (row.segment as OrgSegment)
    : null;
}

/** Jenny-type orgs (incl. Both) get the tip-leak hook */
export function isJenny(row: { segment: string | null }): boolean {
  return row.segment === "jenny" || row.segment === "both";
}

/** Does an org's segment show under a segment filter? Jenny and Phil include Both. */
export function matchesSegment(segment: OrgSegment | null, filter: OrgSegment | "all"): boolean {
  if (filter === "all") return true;
  if (segment === filter) return true;
  return segment === "both" && (filter === "jenny" || filter === "phil");
}

// ---------------------------------------------------------------------------
// Manual Jenny / Phil tags (org_owners): override the automatic segment
// ---------------------------------------------------------------------------
export type Owner = "jenny" | "phil";
export const OWNERS: Owner[] = ["jenny", "phil"];

/** The segment a manual tag sets, or null when untagged */
export function ownerSegment(owner: Pick<OrgOwner, "jenny" | "phil"> | null | undefined): OrgSegment | null {
  if (!owner) return null;
  if (owner.jenny && owner.phil) return "both";
  if (owner.jenny) return "jenny";
  if (owner.phil) return "phil";
  return null;
}

/** Who an org belongs to, from its (effective) segment. Needs a look = nobody yet. */
export function ownersOf(segment: OrgSegment | null): Record<Owner, boolean> {
  return {
    jenny: segment === "jenny" || segment === "both",
    phil: segment === "phil" || segment === "both",
  };
}

/** Manual tag wins; otherwise the automatic segment */
export function effectiveSegment(
  row: { segment: string | null },
  owner: OrgOwner | null | undefined
): OrgSegment | null {
  return ownerSegment(owner) ?? segmentOf(row);
}

export function ownersByAbn(owners: OrgOwner[]): Map<string, OrgOwner> {
  return new Map(owners.map((o) => [o.abn, o]));
}

/** Apply manual tags to the scored list (keeps the automatic segment alongside) */
export function withOwners(orgs: ScoredOrg[], byAbn: Map<string, OrgOwner>): ScoredOrg[] {
  return orgs.map((o) => {
    const tag = ownerSegment(byAbn.get(o.row.abn!));
    return tag ? { ...o, segment: tag, tagged: true } : o;
  });
}

/** SA = based in SA, or registered as operating in SA */
export function inSA(row: {
  state: string | null;
  operates_in_sa: boolean | null;
}): boolean {
  return row.state === "SA" || !!row.operates_in_sa;
}

// ---------------------------------------------------------------------------
// Formatting (Australian: $1.2M / $340K)
// ---------------------------------------------------------------------------
export function fmtMoney(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "–";
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e9) return `${sign}$${trim(a / 1e9)}B`;
  if (a >= 1e6) return `${sign}$${trim(a / 1e6)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}

// One decimal under 10 ($1.2M), whole numbers above ($12M)
function trim(v: number): string {
  return v >= 10 ? String(Math.round(v)) : v.toFixed(1).replace(/\.0$/, "");
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "–";
  return `${Math.round(n * 100)}%`;
}

/** Signed growth: +12% / -4% */
export function fmtGrowth(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "–";
  const pct = Math.round(n * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

export function fmtCount(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "–";
  return Math.round(n).toLocaleString("en-AU");
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** 1-12 -> "Jun" */
export function monthName(m: number | null, long = false): string {
  if (!m || m < 1 || m > 12) return "–";
  return (long ? MONTHS_LONG : MONTHS)[m - 1];
}

/** "2026-09-01" -> "September 2026" */
export function fmtSnapshot(month: string | null): string {
  if (!month) return "–";
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** Financial year label from the period end: 2025-06-30 -> "FY25", 2024-12-31 -> "FY Dec 24" */
export function fyLabel(periodEnd: string | null): string {
  if (!periodEnd) return "No financials";
  const [y, m] = periodEnd.split("-").map(Number);
  const yy = String(y).slice(2);
  return m === 6 ? `FY${yy}` : `FY ${MONTHS[m - 1]} ${yy}`;
}

/** Are these numbers older than STALE_FINANCIALS_MONTHS? */
export function isStaleFinancials(
  periodEnd: string | null,
  today = new Date()
): boolean {
  if (!periodEnd) return false;
  const end = new Date(periodEnd);
  const months =
    (today.getFullYear() - end.getFullYear()) * 12 +
    (today.getMonth() - end.getMonth());
  return months > STALE_FINANCIALS_MONTHS;
}

// ---------------------------------------------------------------------------
// Warm signals
// ---------------------------------------------------------------------------
export type SignalKey =
  | "website"
  | "name"
  | "board"
  | "financials"
  | "growth"
  | "anniversary"
  | "budget"
  | "new";

export interface WarmSignal {
  key: SignalKey;
  label: string;
  detail: string;
  /** Higher = more useful, per Isaac's ordering */
  weight: number;
  icon: IoniconName;
}

export const SIGNAL_META: Record<
  SignalKey,
  { label: string; weight: number; icon: IoniconName }
> = {
  website: { label: "Website changed", weight: 8, icon: "globe-outline" },
  name: { label: "Name change", weight: 7, icon: "pricetag-outline" },
  board: { label: "Board change", weight: 6, icon: "people-outline" },
  financials: { label: "New financials", weight: 5, icon: "document-text-outline" },
  growth: { label: "Growing", weight: 4, icon: "trending-up-outline" },
  anniversary: { label: "Anniversary", weight: 3, icon: "ribbon-outline" },
  budget: { label: "Budget season", weight: 2, icon: "calendar-outline" },
  new: { label: "New in data", weight: 1, icon: "sparkles-outline" },
};

function signal(key: SignalKey, detail: string, label?: string): WarmSignal {
  const meta = SIGNAL_META[key];
  return { key, detail, label: label ?? meta.label, weight: meta.weight, icon: meta.icon };
}

/** Months from `today` until the FY-end month (0 = this month) */
export function monthsUntil(month: number | null, today = new Date()): number | null {
  if (!month) return null;
  return (month - (today.getMonth() + 1) + 12) % 12;
}

/*******************************************
 * Every warm signal for one radar row, most useful first.
 */
export function warmSignals(row: OrgRadarRow, today = new Date()): WarmSignal[] {
  const out: WarmSignal[] = [];
  const year = today.getFullYear();

  if (row.website_changed)
    out.push(signal("website", `Was ${row.website_before || "no website"}`));
  if (row.name_changed)
    out.push(signal("name", `Was ${row.name_before}`));
  if (row.board_size_change)
    out.push(
      signal(
        "board",
        `${row.board_size_change > 0 ? "+" : ""}${row.board_size_change} responsible persons`,
        `Board ${row.board_size_change > 0 ? "+" : ""}${row.board_size_change}`
      )
    );
  if (row.new_financials_lodged)
    out.push(signal("financials", `${fyLabel(row.ais_period_end)} statement lodged`));

  const grew: string[] = [];
  if ((row.donations_growth ?? 0) >= GROWTH_SIGNAL)
    grew.push(`donations ${fmtGrowth(row.donations_growth)}`);
  if ((row.revenue_growth ?? 0) >= GROWTH_SIGNAL)
    grew.push(`revenue ${fmtGrowth(row.revenue_growth)}`);
  if (grew.length) out.push(signal("growth", `${capitalise(grew.join(", "))} year on year`));

  if (row.anniversary_year && row.anniversary_year >= year && row.anniversary_year <= year + 1)
    out.push(
      signal(
        "anniversary",
        `${row.anniversary_label} in ${row.anniversary_year} (est. ${row.established_year})`,
        `${row.anniversary_label} ${row.anniversary_year}`
      )
    );

  const until = monthsUntil(row.fy_end_month, today);
  if (until != null && until >= BUDGET_WINDOW[0] && until <= BUDGET_WINDOW[1])
    out.push(
      signal("budget", `FY ends ${monthName(row.fy_end_month, true)}. Setting next year's budget now`)
    );

  if (row.new_in_snapshot) out.push(signal("new", "Newly registered or newly on the register"));
  else if (row.has_prev && !row.segment_before)
    out.push(signal("new", "Newly fits the radar this month", "Newly fit"));
  else if (row.size_changed)
    out.push(signal("new", `Was ${row.size_before || "unknown"}, now ${row.charity_size}`, `Now ${row.charity_size}`));

  return out;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A radar row with its signals worked out once */
export interface ScoredOrg {
  row: OrgRadarRow;
  /** Effective segment: the manual tag if set, else the automatic one */
  segment: OrgSegment;
  /** The automatic classification, whatever the tag says */
  autoSegment: OrgSegment;
  /** True when a manual Jenny / Phil tag set the segment */
  tagged: boolean;
  signals: WarmSignal[];
  warmth: number;
  /** Triage status, once decisions are merged in (see withTriage) */
  triage?: Triage;
}

export function scoreOrgs(rows: OrgRadarRow[], today = new Date()): ScoredOrg[] {
  return rows
    .filter((row) => segmentOf(row))
    .map((row) => {
      const signals = warmSignals(row, today);
      return {
        row,
        segment: segmentOf(row)!,
        autoSegment: segmentOf(row)!,
        tagged: false,
        signals,
        warmth: signals.reduce((sum, s) => sum + s.weight, 0),
      };
    });
}

/** Both first (always), then warmest, then biggest donors */
export function sortRadar(a: ScoredOrg, b: ScoredOrg): number {
  const aBoth = a.segment === "both" ? 0 : 1;
  const bBoth = b.segment === "both" ? 0 : 1;
  if (aBoth !== bBoth) return aBoth - bBoth;
  if (a.warmth !== b.warmth) return b.warmth - a.warmth;
  return (b.row.donations_bequests ?? -1) - (a.row.donations_bequests ?? -1);
}

/** The one-line "why reach out", for the list and Notion */
export function reasonLine(org: ScoredOrg): string {
  const fit = SEGMENT_META[org.segment].label;
  const why = org.signals.slice(0, 3).map((s) => s.label).join(", ");
  return why ? `${fit}: ${why}` : fit;
}

// ---------------------------------------------------------------------------
// Tip leak (what-if, never a fact)
// ---------------------------------------------------------------------------
/** donations x share raised online x donor tip. Null when they don't fundraise online. */
export function tipLeak(
  row: { donations_bequests: number | null; fundraising_online: boolean | null },
  a: TipLeakAssumptions
): number | null {
  if (!row.fundraising_online || row.donations_bequests == null) return null;
  return row.donations_bequests * a.onlineShare * a.tipRate;
}

// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------
export interface Freshness {
  ok: boolean;
  label: string;
}

/** Did this month's load happen? (runs on the 2nd; late after LOAD_GRACE_DAY) */
export function snapshotFreshness(
  latestMonth: string | null,
  loadedAt: string | null,
  today = new Date()
): Freshness {
  if (!latestMonth) return { ok: false, label: "No snapshot loaded yet" };
  const expected = new Date(today.getFullYear(), today.getMonth(), 1);
  if (today.getDate() <= LOAD_GRACE_DAY) expected.setMonth(expected.getMonth() - 1);
  const expectedKey = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, "0")}-01`;
  const loaded = loadedAt
    ? new Date(loadedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })
    : "";
  if (latestMonth >= expectedKey)
    return { ok: true, label: `${fmtSnapshot(latestMonth)} snapshot${loaded ? `, loaded ${loaded}` : ""}` };
  return {
    ok: false,
    label: `${fmtSnapshot(expectedKey)} load missing. Showing ${fmtSnapshot(latestMonth)}`,
  };
}

// ---------------------------------------------------------------------------
// Links + export
// ---------------------------------------------------------------------------
export function acncUrl(abn: string | null): string {
  return `https://www.acnc.gov.au/charity/charities?search=${abn ?? ""}`;
}

/** Websites on the register often lack a scheme */
export function websiteUrl(site: string | null): string | null {
  if (!site) return null;
  return /^https?:\/\//i.test(site) ? site : `https://${site}`;
}

/** Markdown bullets, ready to paste into the Notion hit list */
export function notionSnippet(orgs: ScoredOrg[]): string {
  return orgs
    .map((o) => {
      const site = websiteUrl(o.row.website);
      const bits = [
        `**${o.row.name}**`,
        reasonLine(o),
        o.signals.map((s) => s.detail).join("; "),
        `${fmtMoney(o.row.revenue_total)} revenue, ${fmtMoney(o.row.donations_bequests)} donations (${fyLabel(o.row.ais_period_end)})`,
        site ? `[Website](${site})` : null,
        `[ACNC](${acncUrl(o.row.abn)})`,
      ].filter(Boolean);
      return `- ${bits.join(" · ")}`;
    })
    .join("\n");
}

export function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV of a filtered list. Tip leak is labelled with its assumptions. */
export function toCsv(orgs: ScoredOrg[], a: TipLeakAssumptions): string {
  const leakHeader = `tip_leak_whatif (${Math.round(a.onlineShare * 100)}% online x ${+(a.tipRate * 100).toFixed(1)}% tip)`;
  const header = [
    "name", "abn", "segment", "segment_source", "reason", "signals", "town", "state", "website",
    "revenue", "donations", "donations_share", "gov_share", "revenue_growth",
    "donations_growth", "fte", "volunteers", "fundraising_online", "financials",
    "pass_through", "fy_end_month", "anniversary", leakHeader, "acnc",
    "status", "decision_reason", "decided", "woke",
  ];
  const lines = orgs.map(({ row, signals, segment, triage, ...rest }) =>
    [
      row.name, row.abn, SEGMENT_META[segment].label,
      rest.tagged ? "manual" : "auto",
      reasonLine({ row, signals, segment, ...rest }),
      signals.map((s) => s.detail).join("; "),
      row.town, row.state, row.website,
      row.revenue_total, row.donations_bequests, row.donations_share, row.gov_share,
      row.revenue_growth, row.donations_growth, row.fte, row.volunteers,
      row.fundraising_online, fyLabel(row.ais_period_end), row.pass_through,
      monthName(row.fy_end_month), row.anniversary_label ? `${row.anniversary_label} ${row.anniversary_year}` : "",
      isJenny({ segment }) ? Math.round(tipLeak(row, a) ?? 0) || "" : "",
      acncUrl(row.abn),
      triage ? STATUS_META[triage.status].label : "",
      triage?.current?.reason ? REASON_META[triage.current.reason as DecisionReason] : "",
      triage?.current ? triage.current.decided_at.slice(0, 10) : "",
      triage?.woke ?? "",
    ].map(csvCell).join(",")
  );
  return [header.map(csvCell).join(","), ...lines].join("\n");
}

export function downloadFile(filename: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Org story
// ---------------------------------------------------------------------------
export interface MoneyPoint {
  /** Financial year label, e.g. FY24 */
  label: string;
  /** Sort key (period end, ISO) */
  end: string;
  revenue: number | null;
  donations: number | null;
}

/*******************************************
 * Money over time from every snapshot of an org. Each snapshot carries its
 * latest year and the year before, so there are two points from month one.
 * Later snapshots win when two report the same year.
 */
export function moneyOverTime(history: Org[]): MoneyPoint[] {
  const byEnd = new Map<string, MoneyPoint>();
  for (const h of history) {
    if (!h.ais_period_end) continue;
    const [y, m, d] = h.ais_period_end.split("-");
    const prevEnd = `${Number(y) - 1}-${m}-${d}`;
    if (h.revenue_total_prev != null || h.donations_bequests_prev != null)
      byEnd.set(prevEnd, {
        label: fyLabel(prevEnd),
        end: prevEnd,
        revenue: h.revenue_total_prev,
        donations: h.donations_bequests_prev,
      });
    byEnd.set(h.ais_period_end, {
      label: fyLabel(h.ais_period_end),
      end: h.ais_period_end,
      revenue: h.revenue_total,
      donations: h.donations_bequests,
    });
  }
  return [...byEnd.values()].sort((a, b) => a.end.localeCompare(b.end));
}

/** What the org does, as short tags */
export function purposeTags(org: Org): string[] {
  const tags: [boolean | null, string][] = [
    [org.advancing_religion, "Religion"],
    [org.advancing_education, "Education"],
    [org.advancing_welfare, "Social welfare"],
    [org.advancing_health, "Health"],
    [org.benefits_children, "Children"],
    [org.benefits_youth, "Youth"],
    [org.pbi, "PBI"],
    [org.hpc, "HPC"],
    [org.basic_religious_charity, "Basic religious charity"],
  ];
  return tags.filter(([on]) => on).map(([, t]) => t);
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------
export type SortKey =
  | "recommended"
  | "warmth"
  | "revenue"
  | "donations"
  | "donation_share"
  | "growth"
  | "staff"
  | "volunteers"
  | "online"
  | "financials"
  | "tip_leak"
  | "name";
export type SortDir = "asc" | "desc";

export const SORT_OPTIONS: { key: SortKey; label: string; dir: SortDir }[] = [
  { key: "recommended", label: "Recommended", dir: "desc" },
  { key: "warmth", label: "Warmth", dir: "desc" },
  { key: "revenue", label: "Revenue", dir: "desc" },
  { key: "donations", label: "Donations", dir: "desc" },
  { key: "donation_share", label: "Donation share", dir: "desc" },
  { key: "growth", label: "Growth YoY", dir: "desc" },
  { key: "staff", label: "Staff", dir: "desc" },
  { key: "volunteers", label: "Volunteers", dir: "desc" },
  { key: "online", label: "Online giving", dir: "desc" },
  { key: "financials", label: "Financials", dir: "desc" },
  { key: "tip_leak", label: "Tip leak", dir: "desc" },
  { key: "name", label: "Name", dir: "asc" },
];

function sortValue(o: ScoredOrg, key: SortKey, a: TipLeakAssumptions): number | string | null {
  const r = o.row;
  switch (key) {
    case "warmth": return o.warmth;
    case "revenue": return r.revenue_total;
    case "donations": return r.donations_bequests;
    case "donation_share": return r.donations_share;
    case "growth": return r.donations_growth ?? r.revenue_growth;
    case "staff": return r.fte;
    case "volunteers": return r.volunteers;
    case "online": return r.fundraising_online == null ? null : r.fundraising_online ? 1 : 0;
    case "financials": return r.ais_period_end;
    case "tip_leak": return isJenny(o) ? tipLeak(r, a) : null;
    case "name": return r.name?.toLowerCase() ?? null;
    default: return null;
  }
}

/** Sort by any column. Blanks always go last; ties fall back to the recommended order. */
export function sortOrgs(
  list: ScoredOrg[],
  key: SortKey,
  dir: SortDir,
  a: TipLeakAssumptions
): ScoredOrg[] {
  const flip = dir === "asc" ? -1 : 1;
  if (key === "recommended") return [...list].sort((x, y) => flip * sortRadar(x, y));
  const values = new Map(list.map((o) => [o, sortValue(o, key, a)]));
  return [...list].sort((x, y) => {
    const vx = values.get(x) ?? null;
    const vy = values.get(y) ?? null;
    if (vx == null || vy == null) return vx == null ? (vy == null ? sortRadar(x, y) : 1) : -1;
    if (vx === vy) return sortRadar(x, y);
    return (vx < vy ? 1 : -1) * flip;
  });
}

// ---------------------------------------------------------------------------
// Triage: New / Pursuing / Snoozed / Not a fit / Never / Client
// ---------------------------------------------------------------------------
/** Not a fit comes back when revenue moves at least this much (either way) */
export const NOT_FIT_REVENUE_SHIFT = 0.5;

export const STATUSES: OrgStatus[] = ["new", "pursuing", "snoozed", "not_fit", "never", "client"];

export const STATUS_META: Record<
  OrgStatus,
  { label: string; tab: string; blurb: string; icon: IoniconName; badge: string }
> = {
  new: { label: "New", tab: "Inbox", blurb: "Back to the inbox", icon: "mail-unread-outline", badge: "badge-outline" },
  pursuing: { label: "Pursuing", tab: "Pursuing", blurb: "Worth contacting. Notion owns it from here", icon: "rocket-outline", badge: "badge-accent" },
  snoozed: { label: "Snoozed", tab: "Snoozed", blurb: "Right org, wrong time", icon: "alarm-outline", badge: "badge-soft" },
  not_fit: { label: "Not a fit", tab: "Not a fit", blurb: "Back only if the data shifts a lot", icon: "close-circle-outline", badge: "badge-outline" },
  never: { label: "Never", tab: "Never", blurb: "Silent for good", icon: "ban-outline", badge: "badge-warn" },
  client: { label: "Client", tab: "Clients", blurb: "Working with them. Watch for upsell signals", icon: "briefcase-outline", badge: "badge-accent" },
};

export const REASONS: DecisionReason[] = ["numbers_off", "pass_through", "bad_timing", "in_house", "relationship", "other"];

export const REASON_META: Record<DecisionReason, string> = {
  numbers_off: "Numbers off",
  pass_through: "Pass-through",
  bad_timing: "Bad timing",
  in_house: "In-house team",
  relationship: "Relationship",
  other: "Other",
};

/** Statuses that need a reason (the rest take an optional note) */
export function needsReason(status: OrgStatus): boolean {
  return status === "snoozed" || status === "not_fit" || status === "never";
}

export type SnoozeOption = 3 | 6 | 12 | "budget";
export const SNOOZE_OPTIONS: { value: SnoozeOption; label: string }[] = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
  { value: "budget", label: "Next budget season" },
];

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** First day of the month their budget window next opens (FY end minus BUDGET_WINDOW[1]) */
export function budgetSeasonDate(fyEndMonth: number, today = new Date()): string {
  const m0 = (((fyEndMonth - 1 - BUDGET_WINDOW[1]) % 12) + 12) % 12;
  const d = new Date(today.getFullYear(), m0, 1);
  if (d <= today) d.setFullYear(d.getFullYear() + 1);
  return isoDate(d);
}

export function snoozeUntil(option: SnoozeOption, fyEndMonth: number | null, today = new Date()): string {
  if (option === "budget" && fyEndMonth) return budgetSeasonDate(fyEndMonth, today);
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setMonth(d.getMonth() + (option === "budget" ? 6 : option));
  return isoDate(d);
}

/** 12 Mar 26, or Mar 2027 without the day */
export function fmtDate(iso: string | null, withDay = true): string {
  if (!iso) return "–";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString(
    "en-AU",
    withDay ? { day: "numeric", month: "short", year: "2-digit" } : { month: "short", year: "numeric" }
  );
}

/** "Snoozed · Bad timing · until Mar 2027" */
export function decisionLabel(d: OrgDecision): string {
  const status = STATUS_META[d.status as OrgStatus]?.label ?? d.status;
  return [
    status,
    d.reason ? REASON_META[d.reason as DecisionReason] : null,
    d.status === "snoozed" && d.snooze_until ? `until ${fmtDate(d.snooze_until, false)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Every org's decisions, newest first */
export function decisionsByAbn(decisions: OrgDecision[]): Map<string, OrgDecision[]> {
  const map = new Map<string, OrgDecision[]>();
  for (const d of decisions) {
    const list = map.get(d.abn) ?? [];
    list.push(d);
    map.set(d.abn, list);
  }
  for (const list of map.values())
    list.sort((a, b) => b.decided_at.localeCompare(a.decided_at) || b.id - a.id);
  return map;
}

export interface Triage {
  /** Where it sits now. A woken Snoozed / Not a fit org is back to "new". */
  status: OrgStatus;
  /** The latest decision, if any */
  current: OrgDecision | null;
  /** Why it came back to the inbox, e.g. "Website changed" */
  woke: string | null;
}

/** Signals that mean something actually changed (not just the calendar) */
const CHANGE_SIGNALS: SignalKey[] = ["website", "name", "board", "financials", "new"];

/*******************************************
 * An org's current status from its decision history. Signals beat calendars:
 * a snoozed org wakes on a change signal in a later snapshot, else on its date.
 */
export function triage(
  org: ScoredOrg | null,
  history: OrgDecision[] | undefined,
  today = new Date()
): Triage {
  const current = history?.[0] ?? null;
  if (!current) return { status: "new", current, woke: null };
  const status = current.status as OrgStatus;
  const row = org?.row;
  const decidedMonth = current.decided_month ?? `${current.decided_at.slice(0, 7)}-01`;
  const later = !!row?.snapshot_month && row.snapshot_month > decidedMonth;

  if (status === "snoozed") {
    const fresh = later ? org!.signals.find((s) => CHANGE_SIGNALS.includes(s.key)) : undefined;
    if (fresh) return { status: "new", current, woke: fresh.label };
    if (current.snooze_until && current.snooze_until <= isoDate(today))
      return { status: "new", current, woke: "Snooze ended" };
  }

  if (status === "not_fit" && row) {
    if (later && current.segment_at_decision && row.segment !== current.segment_at_decision) {
      const seg = segmentOf(row);
      return { status: "new", current, woke: seg ? `Now ${SEGMENT_META[seg].label}` : "Segment changed" };
    }
    const base = current.revenue_at_decision;
    if (base && base > 0 && row.revenue_total != null) {
      const shift = row.revenue_total / base - 1;
      if (Math.abs(shift) >= NOT_FIT_REVENUE_SHIFT)
        return { status: "new", current, woke: `Revenue ${fmtGrowth(shift)}` };
    }
  }

  return { status, current, woke: null };
}

/** Merge decisions into the scored list */
export function withTriage(
  orgs: ScoredOrg[],
  byAbn: Map<string, OrgDecision[]>,
  today = new Date()
): ScoredOrg[] {
  return orgs.map((o) => ({ ...o, triage: triage(o, byAbn.get(o.row.abn!), today) }));
}

/** The insert for one decision, with the baseline the wake-up rules need */
export function buildDecision(
  org: { abn: string; name: string | null; segment?: string | null; revenue_total?: number | null },
  status: OrgStatus,
  opts: {
    reason?: DecisionReason | null;
    note?: string | null;
    snooze_until?: string | null;
    month: string | null;
  }
): TablesInsert<"org_decisions"> {
  return {
    abn: org.abn,
    name: org.name,
    status,
    reason: opts.reason ?? null,
    note: opts.note?.trim() || null,
    snooze_until: status === "snoozed" ? opts.snooze_until ?? null : null,
    decided_month: opts.month,
    segment_at_decision: org.segment ?? null,
    revenue_at_decision: org.revenue_total ?? null,
  };
}

/** Current Not-a-fit reasons decided in the last `days`, biggest first */
export function notFitTally(
  byAbn: Map<string, OrgDecision[]>,
  days = 90,
  today = new Date()
): [DecisionReason, number][] {
  const since = new Date(today.getTime() - days * 86400000).toISOString();
  const counts = new Map<DecisionReason, number>();
  for (const [latest] of byAbn.values()) {
    if (latest.status !== "not_fit" || latest.decided_at < since) continue;
    const r = (latest.reason ?? "other") as DecisionReason;
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
