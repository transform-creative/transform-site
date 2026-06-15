/*************************************************************************
 * UPDATE operations against the Supabase database.
 *
 * Follows the idiom used in Read.tsx: import { supabase } from
 * "./SupabaseClient", import { logError } from "./Auth", and `throw`
 * on error after logging.
 */

import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";
import type { Issue } from "~/data/CustomTypes";
import type { TablesUpdate } from "./supabase";

/*************************
 * Approve an issue's pending update (the card's green tick). Clears any prior
 * rejection so the issue reads cleanly as approved.
 */
export async function approveIssue(issueId: number): Promise<void> {
  const { error } = await supabase
    .from("issues")
    .update({ approved_at: new Date().toISOString(), rejected_at: null })
    .eq("id", issueId);

  if (error) {
    await logError(error, ["approveIssue", "Update"]);
    throw error;
  }
}

/*************************
 * Reject an issue's pending update (the card's red cross). Records the
 * rejection and clears both `updated_at` and `approved_at` so the status
 * derives back to "rejected" (work sent back to Transform).
 */
export async function rejectIssue(issueId: number): Promise<void> {
  const { error } = await supabase
    .from("issues")
    .update({
      rejected_at: new Date().toISOString(),
      updated_at: null,
      approved_at: null,
    })
    .eq("id", issueId);

  if (error) {
    await logError(error, ["rejectIssue", "Update"]);
    throw error;
  }
}

/*************************
 * Mark an issue as started (the business board's "Start" button). Sets
 * `started_at` so the status derives to "in_progress".
 */
export async function startIssue(issueId: number): Promise<void> {
  const { error } = await supabase
    .from("issues")
    .update({ started_at: new Date().toISOString() })
    .eq("id", issueId);

  if (error) {
    await logError(error, ["startIssue", "Update"]);
    throw error;
  }
}

/*************************
 * Mark an issue as updated (the business board's green tick) — the work is done
 * and ready for the client to approve. Sets `updated_at` and clears any prior
 * rejection so the status derives to "awaiting_approval".
 */
export async function markIssueUpdated(issueId: number): Promise<void> {
  const { error } = await supabase
    .from("issues")
    .update({ updated_at: new Date().toISOString(), rejected_at: null })
    .eq("id", issueId);

  if (error) {
    await logError(error, ["markIssueUpdated", "Update"]);
    throw error;
  }
}

/*************************
 * Update an issue's editable fields (title / description / severity) from the
 * edit-mode form.
 */
export async function updateIssue(
  issueId: number,
  patch: TablesUpdate<"issues">
): Promise<Issue> {
  const { data, error } = await supabase
    .from("issues")
    .update(patch)
    .eq("id", issueId)
    .select()
    .single();

  if (error) {
    await logError(error, ["updateIssue", "Update"]);
    throw error;
  }

  return data;
}
