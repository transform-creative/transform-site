import { IoniconName } from "~/data/Ionicons";
import type { Issue, IssueSeverity, IssueStatus } from "~/data/CustomTypes";

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
