import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";
import type {
  AuthClient,
  Business,
  BusinessIssue,
  ClientIssue,
} from "~/data/CustomTypes";

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

/*************************
 * Read the business owned by a given auth user, if any. Used to detect an
 * admin/business owner (they own a `businesses` row) and get its id.
 * @param userId The auth user id (businesses.user_id)
 */
export async function getBusinessForUser(
  userId: string
): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    await logError(error, ["getBusinessForUser", "Read"]);
    throw error;
  }

  return data;
}

/*************************
 * Read every client linked to a business, for the admin "log issue" picker.
 * @param businessId The businesses.id of the owned business
 */
export async function getBusinessClients(
  businessId: number
): Promise<Pick<AuthClient, "user_id" | "name">[]> {
  const { data, error } = await supabase
    .from("clients_to_businesses")
    .select(
      "auth_clients!clients_to_businesses_auth_client_id_fkey(user_id, name)"
    )
    .eq("business_id", businessId);

  if (error) {
    await logError(error, ["getBusinessClients", "Read"]);
    throw error;
  }

  return (data ?? [])
    .map((row) => row.auth_clients)
    .filter((c): c is Pick<AuthClient, "user_id" | "name"> => !!c);
}

/*************************
 * Read every issue for a business (across all its clients), each with its full
 * comments list and the uploading client, for the admin/business board.
 * @param businessId The businesses.id of the owned business
 */
export async function getBusinessIssues(
  businessId: number
): Promise<BusinessIssue[]> {
  const { data, error } = await supabase
    .from("issues")
    .select("*, issue_comments(*), auth_clients!issues_client_id_fkey(user_id, name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    await logError(error, ["getBusinessIssues", "Read"]);
    throw error;
  }

  return (data ?? []) as BusinessIssue[];
}
