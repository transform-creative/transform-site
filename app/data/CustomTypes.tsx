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
