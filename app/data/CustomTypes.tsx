/*************************************************************************
 * Project-specific types derived from the generated Supabase schema.
 * The generated source of truth lives in `~/database/supabase`.
 */

import type { Database } from "~/database/supabase";

/** Row types straight from the database schema */
export type Issue = Database["public"]["Tables"]["issues"]["Row"];
export type IssueComment = Database["public"]["Tables"]["issue_comments"]["Row"];
export type AuthClient = Database["public"]["Tables"]["auth_clients"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type ClientToBusiness =
  Database["public"]["Tables"]["clients_to_businesses"]["Row"];

/** The severity levels an issue can have (drives the card's colour swatch) */
export type IssueSeverity =
  | "low"
  | "moderate"
  | "severe"
  | "critical"
  | "future";

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

/** An issue joined with its full comments list, as rendered on the portal */
export type ClientIssue = Issue & { issue_comments: IssueComment[] };
