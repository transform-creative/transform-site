import { useEffect, useRef, useState } from "react";
import { IoniconName } from "~/data/Ionicons";
import type { Project } from "~/data/CommonTypes";
import type {
  AiStatus,
  Issue,
  IssueSeverity,
  IssueStatus,
  IssueType,
  IssueUpdate,
} from "~/data/CustomTypes";

/*******************************************
 * Descriptive alt text for a project image. Names the org and what the
 * piece actually is, so the portfolio images carry real meaning for
 * screen readers and image search.
 */
export function projectImageAlt(project: Project): string {
  const what =
    project.type == "software"
      ? "nonprofit website built by Transform Creative"
      : project.type == "media"
      ? "video production by Transform Creative"
      : "graphic design by Transform Creative";

  const org = project.organisation ? `${project.organisation} ` : "";
  return `${org}${project.name} — ${what}`;
}

/*******************************************
 * URL slug for a project's indexable page (/portfolio/:slug), from its name.
 * Projects sharing a name (e.g. The Middle Sister Project's video and design
 * entries) are told apart by type — the first in PROJECTS keeps the bare slug.
 * Renaming a project changes its URL.
 */
export function projectSlug(project: Project, projects: Project[]): string {
  const base = project.name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const first = projects.find((p) => p.name === project.name);
  return first && first.id !== project.id
    ? `${base}-${project.type}`
    : base;
}

/*******************************************
 * Find the project behind a /portfolio/:slug URL
 */
export function projectFromSlug(
  slug: string | undefined,
  projects: Project[],
): Project | undefined {
  return projects.find((p) => projectSlug(p, projects) === slug);
}

/*******************************************
 * Searchable name for the service behind a project type — used in
 * case-study page titles and headings.
 */
export function projectTypeLabel(type: Project["type"]): string {
  return type == "software"
    ? "Nonprofit website"
    : type == "media"
    ? "Nonprofit video production"
    : "Graphic design";
}

/*******************************************
 * Get the icon name for the type of project this is

 */
export function projectToIcon(type: string): IoniconName {
  return type == "media"
    ? "film-outline"
    : type == "design"
    ? "color-filter-outline"
    : "code-outline";
}

/*******************************************
 * Map an issue severity level to the colour shown on its card swatch.
 * Levels: low, moderate, severe, critical, future.
 */
export function severityColor(severity: string | null): string {
  switch (severity) {
    case "critical":
      return "#a83232";
    case "severe":
      return "var(--dangerColor)";
    case "moderate":
      return "var(--warningColor)";
    case "low":
      return "var(--accent)";
    case "future":
      return "var(--accent-lg)";
    default:
      return "var(--accent-lg)";
  }
}

/*******************************************
 * Map a severity level to a short label and a one-line description. Drives the
 * severity picker in the issue modal (and mirrors the swatch colour above).
 */
export const SEVERITY_OPTIONS: {
  value: IssueSeverity;
  label: string;
  description: string;
}[] = [
  { value: "low", label: "Low", description: "A minor formatting or 'nice-to-have' feature" },
  { value: "moderate", label: "Moderate", description: "Noticeable, but there's a workaround" },
  { value: "severe", label: "Severe", description: "A key feature is broken or unusable" },
  { value: "critical", label: "Critical", description: "The site is down or unusable" },
  { value: "future", label: "Future", description: "An idea to consider down the track" },
];

/*******************************************
 * Look up the label/description metadata for a severity level. Falls back to
 * the "low" entry when the stored value is null or unrecognised.
 */
export function severityMeta(severity: string | null) {
  return (
    SEVERITY_OPTIONS.find((o) => o.value === severity) ?? SEVERITY_OPTIONS[0]
  );
}

/*******************************************
 * The kinds of request an issue can be. Shown as the row of buttons at the top
 * of the issue modal. `question` is triage-only and skips the AI auto-fix
 * pipeline (mirrored by the gate in the dispatch-issue edge function).
 */
export const ISSUE_TYPE_OPTIONS: {
  value: IssueType;
  label: string;
  icon: IoniconName;
}[] = [
  { value: "bug", label: "Bug", icon: "bug" },
  { value: "issue", label: "Feature", icon: "construct" },
  { value: "question", label: "Question", icon: "help-circle" },
];

/*******************************************
 * The label + icon for an issue's type, used to badge the issue card. Falls
 * back to the "issue" (feature) option for an unknown/null type.
 */
export function issueTypeMeta(type: string | null) {
  return (
    ISSUE_TYPE_OPTIONS.find((o) => o.value === type) ??
    ISSUE_TYPE_OPTIONS[1]
  );
}

/*******************************************
 * Map an AI auto-fix status to a short label, swatch colour and icon for the
 * chip shown on the issue card. `null` (never dispatched) returns null so the
 * card simply shows nothing.
 */
export function aiStatusMeta(
  status: string | null
): { label: string; color: string; icon: IoniconName } | null {
  switch (status) {
    case "queued":
      return { label: "AI queued", color: "var(--accent-lg)", icon: "time-outline" };
    case "processing":
      return { label: "AI working", color: "var(--accent)", icon: "sync-outline" };
    case "pr_open":
      return { label: "PR ready", color: "var(--accent)", icon: "git-pull-request-outline" };
    case "needs_info":
      return { label: "Needs info", color: "var(--warningColor)", icon: "help-circle-outline" };
    case "failed":
      return { label: "AI failed", color: "var(--dangerColor)", icon: "alert-circle-outline" };
    case "skipped":
      return { label: "AI skipped", color: "var(--accent-lg)", icon: "remove-circle-outline" };
    default:
      return null;
  }
}

/*******************************************
 * Derive an issue's status from its timestamps. There is no status column
 * on the issues table, so we infer it (checked in priority order):
 *  - approved        -> approved_at is set
 *  - awaiting_approval -> work has been updated but not yet approved
 *  - rejected        -> the client sent the latest update back
 *  - in_progress     -> work has started but not been updated/approved
 *  - not_started     -> nothing has happened yet
 */
export function deriveIssueStatus(issue: Issue): IssueStatus {
  if (issue.approved_at) return "approved";
  if (issue.updated_at) return "awaiting_approval";
  if (issue.rejected_at) return "rejected";
  if (issue.started_at) return "in_progress";
  return "not_started";
}

/*******************************************
 * A workflow action a card/modal can take on an issue. The inverse of
 * `deriveIssueStatus`: maps the action to the timestamp patch that moves the
 * issue into the corresponding status, for feeding to `updateIssue`.
 */
export type IssueAction = "start" | "update" | "approve" | "reject";

export function issueActionPatch(action: IssueAction): IssueUpdate {
  const now = new Date().toISOString();
  switch (action) {
    case "start":
      return { started_at: now };
    case "update":
      return { updated_at: now, rejected_at: null };
    case "approve":
      return { approved_at: now, rejected_at: null };
    case "reject":
      return { rejected_at: now, updated_at: null, approved_at: null };
  }
}

/*******************************************
 * The severity levels in display order for the "not started" board columns,
 * most-severe first. Mirrors the swatch colours in `severityColor`.
 */
export const SEVERITY_COLUMN_ORDER: IssueSeverity[] = [
  "critical",
  "severe",
  "moderate",
  "low",
  "future",
];

/*******************************************
 * The timestamp of an issue's most recent activity, as a millisecond epoch.
 * Used to sort boards newest-first. Falls back through the workflow timestamps
 * (update → sent back → started → created) to whatever is most recent.
 */
export function lastActivityAt(issue: Issue): number {
  const times = [
    issue.updated_at,
    issue.rejected_at,
    issue.started_at,
    issue.created_at,
  ]
    .map((t) => (t ? new Date(t).getTime() : 0))
    .filter((t) => !isNaN(t));
  return times.length ? Math.max(...times) : 0;
}

/*******************************************
 * Format a date as a relative "x ago" string (e.g. "5 days ago").
 * Kept dependency-free as the project has no date library.
 */
export function timeAgo(date: string | Date | null): string {
  if (!date) return "";

  const then = new Date(date).getTime();
  if (isNaN(then)) return "";

  const seconds = Math.floor((Date.now() - then) / 1000);

  const units: [string, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  if (seconds < 60) return "just now";

  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) {
      return `${value} ${name}${value === 1 ? "" : "s"} ago`;
    }
  }

  return "just now";
}

/*******************************
 * Smooth-scroll to an element by id, leaving room for the sticky header.
 */
export function scrollToId(id: string, headerOffset = 100) {
  const el = document.getElementById(id);
  if (!el) return;
  const top =
    el.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top, behavior: "smooth" });
}

/*******************************
 * Step a tab set to its next index every `ms`, wrapping round. Spread
 * `hoverProps` on the tabs + content so cycling pauses while hovered; call
 * `hold()` to pause until the pointer next leaves (e.g. after opening a tab
 * from elsewhere on the page). Pausing freezes the time left rather than
 * resetting it; a new index starts a fresh `ms`. A progress bar keyed on
 * `activeIndex`, run for `ms` and paused with `paused` stays in step.
 */
export function useAutoCycle(
  count: number,
  activeIndex: number,
  setActiveIndex: (index: number) => void,
  ms = 3000,
) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(ms);
  const lastIndex = useRef(activeIndex);

  useEffect(() => {
    if (lastIndex.current !== activeIndex) {
      lastIndex.current = activeIndex;
      remaining.current = ms;
    }
    if (paused || count < 2) return;
    const startedAt = Date.now();
    const timer = setTimeout(
      () => setActiveIndex((activeIndex + 1) % count),
      remaining.current,
    );
    return () => {
      clearTimeout(timer);
      // Bank the time left so a pause picks up where it stopped
      remaining.current = Math.max(
        0,
        remaining.current - (Date.now() - startedAt),
      );
    };
  }, [paused, activeIndex, count, ms]);

  return {
    /** True when there's no cycle running (hovered, held or a single tab) */
    paused: paused || count < 2,
    ms,
    hold: () => setPaused(true),
    hoverProps: {
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
    },
  };
}

/*******************************
 * Render `text` with each of `phrases` bolded wherever it appears.
 */
export function boldPhrases(text: string, phrases: string[] = []) {
  if (phrases.length === 0) return text;
  const escaped = phrases.map((p) =>
    p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  return text
    .split(new RegExp(`(${escaped.join("|")})`))
    .map((part, i) =>
      phrases.includes(part) ? (
        <b key={i} style={{ fontWeight: 600 }}>
          {part}
        </b>
      ) : (
        part
      ),
    );
}
