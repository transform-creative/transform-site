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
 * Read every open issue for an organisation (across all its client members),
 * each with its full comments list. This is the source of truth for the shared
 * client board: a client sees every issue logged against their org, not just
 * their own.
 * @param orgBusinessId The org's businesses.id (the client_business_id key)
 */
export async function getOrgIssues(
  orgBusinessId: number
): Promise<ClientIssue[]> {
  const { data, error } = await supabase
    .from("issues")
    .select("*, issue_comments(*)")
    .eq("client_business_id", orgBusinessId)
    .is("approved_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    await logError(error, ["getOrgIssues", "Read"]);
    throw error;
  }

  return (data ?? []) as ClientIssue[];
}

/*************************
 * Read every member of an organisation, for resolving who posted each issue on
 * the shared client board. Org members are the business's `admin` rows.
 * @param orgBusinessId The org's businesses.id
 */
export async function getOrgMembers(
  orgBusinessId: number
): Promise<Pick<Profile, "id" | "first_name" | "last_name">[]> {
  const { data, error } = await supabase
    .from("profiles_to_businesses")
    .select("profiles!inner(id, first_name, last_name)")
    .eq("business_id", orgBusinessId)
    .eq("role", "admin");

  if (error) {
    await logError(error, ["getOrgMembers", "Read"]);
    throw error;
  }

  return (data ?? [])
    .map((row) => row.profiles)
    .filter(
      (p): p is Pick<Profile, "id" | "first_name" | "last_name"> => !!p,
    );
}

/*************************
 * Resolve a client's org business id (their `client_business_id`) via the
 * `client_org_business_id` security-definer function. Used when an admin logs an
 * issue for a client, where the client's org is otherwise invisible under RLS.
 * @param clientId The reporting client's profile id (uuid)
 */
export async function getClientOrgBusinessId(
  clientId: string
): Promise<number | null> {
  const { data, error } = await supabase.rpc("client_org_business_id", {
    p_client_id: clientId,
  });

  if (error) {
    await logError(error, ["getClientOrgBusinessId", "Read"]);
    throw error;
  }

  return (data as number | null) ?? null;
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
 * they're an *agency* admin or a client, and which business they belong to.
 *
 * Membership lives in `profiles_to_businesses`. A user has two distinct kinds of
 * `admin` row now: agency staff are admins of an agency board (a business that
 * also has `client` members), while a client is an admin of *their own org*
 * (a business with no client members). We must only treat the former as the
 * admin board — otherwise a client would wrongly land in admin mode.
 *
 * For a client we also return `orgBusinessId`: the org they belong to, used as
 * the source of truth for fetching the shared issue board.
 * @param userId The auth/profile id (uuid)
 */
export async function getUserMembership(
  userId: string
): Promise<{
  business_id: number;
  role: BusinessRole;
  orgBusinessId: number | null;
} | null> {
  const { data, error } = await supabase
    .from("profiles_to_businesses")
    .select("business_id, role")
    .eq("profile_id", userId)
    .not("business_id", "is", null);

  if (error) {
    await logError(error, ["getUserMembership", "Read"]);
    throw error;
  }

  const rows = (data ?? []).filter((r) => r.business_id != null);
  const adminRows = rows.filter((r) => r.role === "admin");
  const clientRows = rows.filter((r) => r.role === "client");

  // Agency admin: an admin of a board that has client members.
  for (const a of adminRows) {
    const { data: clients, error: cErr } = await supabase
      .from("profiles_to_businesses")
      .select("id")
      .eq("business_id", a.business_id!)
      .eq("role", "client")
      .limit(1);
    if (cErr) {
      await logError(cErr, ["getUserMembership", "Read"]);
      throw cErr;
    }
    if (clients && clients.length > 0) {
      return { business_id: a.business_id!, role: "admin", orgBusinessId: null };
    }
  }

  // Otherwise a client: the agency board they're a client of, plus their own org.
  const agencyId = clientRows[0]?.business_id ?? adminRows[0]?.business_id;
  if (agencyId == null) return null;

  return {
    business_id: agencyId,
    role: "client",
    orgBusinessId: adminRows[0]?.business_id ?? null,
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
