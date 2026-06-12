import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";
import type { AuthClient, ClientIssue } from "~/data/CustomTypes";

/*************************
 * Read all issues for a client, each with its full comments list.
 * @param clientId The auth_clients.user_id (uuid) of the client
 */
export async function getClientIssues(
  clientId: string
): Promise<ClientIssue[]> {
  const { data, error } = await supabase
    .from("issues")
    .select("*, issue_comments(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    await logError(error, ["getClientIssues", "Read"]);
    throw error;
  }

  return (data ?? []) as ClientIssue[];
}

/*************************
 * Read a single client (auth_clients) record by their user id.
 * @param userId The auth_clients.user_id (uuid)
 */
export async function getAuthClient(
  userId: string
): Promise<AuthClient | null> {
  const { data, error } = await supabase
    .from("auth_clients")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    await logError(error, ["getAuthClient", "Read"]);
    throw error;
  }

  return data;
}
