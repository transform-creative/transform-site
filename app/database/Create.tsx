/*************************************************************************
 * INSERT operations against the Supabase database.
 *
 * Follows the idiom used in Read.tsx: import { supabase } from
 * "./SupabaseClient", import { logError } from "./Auth", and `throw`
 * on error after logging.
 */

import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";
import type { Issue, IssueComment } from "~/data/CustomTypes";
import type { Tables, TablesInsert } from "./supabase";

/*************************
 * Create a new issue (the "Log issue" button). The caller supplies at least
 * `client_id`; `business_id`, `title`, `description` and `severity` are set
 * from the form.
 */
export async function createIssue(
  issue: TablesInsert<"issues">
): Promise<Issue> {
  const { data, error } = await supabase
    .from("issues")
    .insert(issue)
    .select()
    .single();

  if (error) {
    await logError(error, ["createIssue", "Create"]);
    throw error;
  }

  return data;
}

/*************************
 * Add a comment to an issue (the per-card comments composer).
 */
export async function createIssueComment(
  comment: TablesInsert<"issue_comments">
): Promise<IssueComment> {
  const { data, error } = await supabase
    .from("issue_comments")
    .insert(comment)
    .select()
    .single();

  if (error) {
    await logError(error, ["createIssueComment", "Create"]);
    throw error;
  }

  return data;
}

/*************************
 * Store a public form submission. All form fields live in the `metadata` jsonb
 * column; the caller sets `business_id` so the owning business can read it.
 */
export async function createResponse(
  response: TablesInsert<"responses">
): Promise<boolean> {
  const { data, error } = await supabase
    .from("responses")
    .insert(response);

  if (error) {
    await logError(error, ["createResponse", "Create"]);
    throw error;
  }

  return true;
}
