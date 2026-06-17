import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";
import type {
  Business,
  BusinessRole,
  ClientIssue,
  Profile,
} from "~/data/CustomTypes";

/*************************
 * Read all issues for a client, each with its full comments list.
 * @param clientId The profile id (uuid) of the client
 */
export async function getClientIssues(
  clientId: string
): Promise<ClientIssue[]> {
  const { data, error } = await supabase
    .from("issues")
    .select("*, issue_comments(*)")
    .eq("client_id", clientId)
    .is("approved_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    await logError(error, ["getClientIssues", "Read"]);
    throw error;
  }

  return (data ?? []) as ClientIssue[];
}

/*************************
 * Read a single profile by its id. Used to show the client's own name.
 * @param userId The profile id (uuid), equal to the auth user id
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    await logError(error, ["getProfile", "Read"]);
    throw error;
  }

  return data;
}

/*************************
 * Read the current user's business membership — the source of truth for whether
 * they're a business admin or a client, and which business they belong to.
 * Prefers an `admin` row if the user happens to have more than one membership.
 * @param userId The auth/profile id (uuid)
 */
export async function getUserMembership(
  userId: string
): Promise<{ business_id: number; role: BusinessRole } | null> {
  const { data, error } = await supabase
    .from("profiles_to_businesses")
    .select("business_id, role")
    .eq("profile_id", userId)
    .not("business_id", "is", null);

  if (error) {
    await logError(error, ["getUserMembership", "Read"]);
    throw error;
  }

  const rows = data ?? [];
  const chosen = rows.find((r) => r.role === "admin") ?? rows[0];
  if (!chosen || chosen.business_id == null) return null;

  return {
    business_id: chosen.business_id,
    role: chosen.role === "admin" ? "admin" : "client",
  };
}

/*************************
 * Read a business by its id, for loading the admin's board.
 * @param businessId The businesses.id
 */
export async function getBusinessById(
  businessId: number
): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    await logError(error, ["getBusinessById", "Read"]);
    throw error;
  }

  return data;
}

/*************************
 * Read every client linked to a business, for the admin "log issue" picker.
 * @param businessId The businesses.id of the admin's business
 */
export async function getBusinessClients(
  businessId: number
): Promise<Pick<Profile, "id" | "first_name" | "last_name">[]> {
  const { data, error } = await supabase
    .from("profiles_to_businesses")
    .select("profiles!inner(id, first_name, last_name)")
    .eq("business_id", businessId)
    .eq("role", "client");

  if (error) {
    await logError(error, ["getBusinessClients", "Read"]);
    throw error;
  }

  return (data ?? [])
    .map((row) => row.profiles)
    .filter(
      (p): p is Pick<Profile, "id" | "first_name" | "last_name"> => !!p,
    );
}

/*************************
 * Read every issue for a business (across all its clients), each with its full
 * comments list, for the admin/business board. The reporting client's name is
 * resolved in JS from `getBusinessClients`.
 * @param businessId The businesses.id of the admin's business
 */
export async function getBusinessIssues(
  businessId: number
): Promise<ClientIssue[]> {
  const { data, error } = await supabase
    .from("issues")
    .select("*, issue_comments(*)")
    .eq("business_id", businessId)
    .is("approved_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    await logError(error, ["getBusinessIssues", "Read"]);
    throw error;
  }

  return (data ?? []) as ClientIssue[];
}
