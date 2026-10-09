/*************************************************************************
 * Project-specific types derived from the generated Supabase schema.
 * The generated source of truth lives in `~/database/supabase`.
 */

import type { Database } from "~/database/supabase";

/** Row types straight from the database schema */
export type Issue = Database["public"]["Tables"]["issues"]["Row"];
/** The patch shape accepted when updating an issue */
export type IssueUpdate = Database["public"]["Tables"]["issues"]["Update"];
export type IssueComment = Database["public"]["Tables"]["issue_comments"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
/** A person (the source of truth for clients and business admins) */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
/** Links a profile to a business with a role (drives all permission checks) */
export type ProfileToBusiness =
  Database["public"]["Tables"]["profiles_to_businesses"]["Row"];
/** The role a profile plays within a business */
export type BusinessRole = "admin" | "client";

/** The severity levels an issue can have (drives the card's colour swatch) */
export type IssueSeverity =
  | "low"
  | "moderate"
  | "severe"
  | "critical"
  | "future";

/**
 * What kind of request an issue is. Picked at the top of the issue modal.
 * `question` is triage-only and is never sent to the AI auto-fix pipeline.
 */
export type IssueType = "bug" | "issue" | "question";

/**
 * State of the AI auto-fix pipeline for an issue (the `ai_status` column).
 * `null` means it was never dispatched (e.g. severity `future`, type
 * `question`, or the business has auto-fix disabled). See `aiStatusMeta` in
 * `~/business/commonBL`. Written only by the edge function / GitHub workflow.
 */
export type AiStatus =
  | "queued"
  | "processing"
  | "pr_open"
  | "needs_info"
  | "failed"
  | "skipped";

/**
 * Derived issue status. There is no `status` column on the issues table —
 * this is computed from the `started_at` / `updated_at` / `approved_at` /
 * `rejected_at` timestamps (see `deriveIssueStatus` in `~/business/commonBL`).
 */
export type IssueStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_approval"
  | "rejected"
  | "approved";

/**
 * An issue joined with its full comments list, as rendered on the portal.
 * Used by both the client and the business/admin board; the admin board
 * resolves each issue's reporting client name in JS from its client list.
 */
export type ClientIssue = Issue & { issue_comments: IssueComment[] };

/** One charity in one monthly ACNC snapshot (the `orgs` table, loaded by the ACNC radar job) */
export type Org = Database["public"]["Tables"]["orgs"]["Row"];
/** Latest-month fit org + what changed since last month (the `org_radar` view) */
export type OrgRadarRow = Database["public"]["Views"]["org_radar"]["Row"];
/**
 * Radar segment. `jenny` = software buyer, `phil` = video-series buyer,
 * `both` = both (best leads), `phil_review` = religious charity with no financials.
 */
export type OrgSegment = "jenny" | "phil" | "both" | "phil_review";
/** One radar triage decision (append-only; latest per ABN is current) */
export type OrgDecision = Database["public"]["Tables"]["org_decisions"]["Row"];
/** One public form / survey submission; the answers live in `metadata` */
export type FormResponse = Database["public"]["Tables"]["responses"]["Row"];
export type OrgStatus = "new" | "pursuing" | "snoozed" | "not_fit" | "never" | "client";
/** Manual Jenny / Phil tag for an org; overrides the automatic segment when present */
export type OrgOwner = Database["public"]["Tables"]["org_owners"]["Row"];
export type DecisionReason =
  | "numbers_off"
  | "pass_through"
  | "bad_timing"
  | "in_house"
  | "relationship"
  | "other";
