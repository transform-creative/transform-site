/*************************************************************************
 * UPDATE operations against the Supabase database.
 *
 * Follows the idiom used in Read.tsx: import { supabase } from
 * "./SupabaseClient", import { logError } from "./Auth", and `throw`
 * on error after logging.
 */

import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";
import type { Issue, OrgOwner } from "~/data/CustomTypes";
import type { TablesInsert, TablesUpdate } from "./supabase";

/*************************
 * Update an issue with an arbitrary patch and return the saved row. Covers the
 * editable fields (title / description / severity) as well as the workflow
 * timestamp transitions — build those patches with `issueActionPatch` in
 * `~/business/commonBL`.
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

/*************************
 * Set an org's manual Jenny / Phil tag (insert or replace by ABN).
 */
export async function upsertOrgOwner(
  owner: TablesInsert<"org_owners">
): Promise<OrgOwner> {
  const { data, error } = await supabase
    .from("org_owners")
    .upsert({ ...owner, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    await logError(error, ["upsertOrgOwner", "Update"]);
    throw error;
  }

  return data;
}
