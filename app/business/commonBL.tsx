import { IoniconName } from "~/data/Ionicons";
import type {
  AiStatus,
  Issue,
  IssueSeverity,
  IssueStatus,
  IssueType,
  IssueUpdate,
} from "~/data/CustomTypes";

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
  { value: "bug", label: "Bug", icon: "bug-outline" },
  { value: "issue", label: "Feature", icon: "construct-outline" },
  { value: "question", label: "Question", icon: "help-circle-outline" },
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
