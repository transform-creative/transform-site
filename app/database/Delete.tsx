/*************************************************************************
 * DELETE operations against the Supabase database.
 *
 * Future client-portal functions belong here, e.g:
 *   - deleteIssue(issueId)
 *   - deleteIssueComment(commentId)
 *
 * Follow the idiom used in Read.tsx: import { supabase } from
 * "./SupabaseClient", import { logError } from "./Auth", and `throw`
 * on error after logging.
 */

import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";

/*************************
 * Clear an org's manual Jenny / Phil tag, putting it back on the automatic segment.
 */
export async function deleteOrgOwner(abn: string): Promise<void> {
  const { error } = await supabase.from("org_owners").delete().eq("abn", abn);

  if (error) {
    await logError(error, ["deleteOrgOwner", "Delete"]);
    throw error;
  }
}
