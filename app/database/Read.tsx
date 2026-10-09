import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";
import type {
  Business,
  BusinessRole,
  ClientIssue,
  FormResponse,
  Org,
  OrgRadarRow,
  OrgDecision,
  OrgOwner,
  Profile,
} from "~/data/CustomTypes";

/*************************
 * Read every form / survey response submitted to a business, newest first.
 * RLS limits this to admins of that business.
 */
export async function getBusinessResponses(
  businessId: number
): Promise<FormResponse[]> {
  const { data, error } = await supabase
    .from("responses")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    await logError(error, ["getBusinessResponses", "Read"]);
    throw error;
  }

  return data ?? [];
}

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
 * Resolve each issue's org (issues.client_business_id) to its business name for
 * an agency board, returned as an id→name map for labelling cards. Agency admins
 * can't read client-org `businesses` rows under RLS, so this goes through the
 * `agency_board_org_names` security-definer function (gated to admins of the
 * board).
 * @param boardId The agency board's businesses.id (e.g. 129)
 */
export async function getOrgNamesForBoard(
  boardId: number
): Promise<Map<number, string>> {
  const { data, error } = await supabase.rpc("agency_board_org_names", {
    p_board_id: boardId,
  });

  if (error) {
    await logError(error, ["getOrgNamesForBoard", "Read"]);
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.id, row.name]));
}

/*************************
 * Read every organisation belonging to an agency board, for the admin "log
 * issue" picker. Unlike getOrgNamesForBoard (which only surfaces orgs that
 * already have an issue) this returns all of the board's orgs via the
 * `agency_board_orgs` security-definer function (gated to admins of the board),
 * so an admin can lodge the first issue for one.
 * @param boardId The agency board's businesses.id (e.g. 129)
 */
export async function getBoardOrgs(
  boardId: number
): Promise<Pick<Business, "id" | "name">[]> {
  const { data, error } = await supabase.rpc("agency_board_orgs", {
    p_board_id: boardId,
  });

  if (error) {
    await logError(error, ["getBoardOrgs", "Read"]);
    throw error;
  }

  return (data ?? []) as Pick<Business, "id" | "name">[];
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

/*************************
 * Read the ACNC radar: every fit org (jenny / phil / both / phil_review) in the
 * latest monthly snapshot, with what changed since the previous snapshot.
 * Pages through PostgREST's 1,000-row cap (~3K rows, flat as history grows).
 * RLS limits this to Transform Creative admins.
 */
export async function getRadarOrgs(): Promise<OrgRadarRow[]> {
  const PAGE = 1000;
  const rows: OrgRadarRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("org_radar")
      .select("*")
      .order("abn")
      .range(from, from + PAGE - 1);

    if (error) {
      await logError(error, ["getRadarOrgs", "Read"]);
      throw error;
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/*************************
 * Every radar triage decision, oldest first. Small (a handful a week), so the
 * page loads it all and works out each org's current status client-side.
 */
export async function getOrgDecisions(): Promise<OrgDecision[]> {
  const PAGE = 1000;
  const rows: OrgDecision[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("org_decisions")
      .select("*")
      .order("decided_at")
      .range(from, from + PAGE - 1);

    if (error) {
      await logError(error, ["getOrgDecisions", "Read"]);
      throw error;
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/*************************
 * Every manual Jenny / Phil tag (one row per tagged ABN). Small, so it all loads.
 */
export async function getOrgOwners(): Promise<OrgOwner[]> {
  const { data, error } = await supabase.from("org_owners").select("*");

  if (error) {
    await logError(error, ["getOrgOwners", "Read"]);
    throw error;
  }

  return data ?? [];
}

/*************************
 * Search any charity (fit or not) in one snapshot by name, other name or ABN.
 * @param query Free text, or an ABN (spaces allowed)
 * @param snapshotMonth The snapshot to search (YYYY-MM-01), normally the latest
 */
export async function searchOrgs(
  query: string,
  snapshotMonth: string
): Promise<Org[]> {
  const digits = query.replace(/\s/g, "");
  let request = supabase
    .from("orgs")
    .select("*")
    .eq("snapshot_month", snapshotMonth)
    .limit(25);

  if (/^\d{9,11}$/.test(digits)) {
    request = request.eq("abn", digits.padStart(11, "0"));
  } else {
    // Strip characters that would break the PostgREST or() filter syntax
    const term = query.replace(/[,()*%\\]/g, " ").trim();
    if (!term) return [];
    request = request
      .or(`name.ilike.*${term}*,other_names.ilike.*${term}*`)
      .order("revenue_total", { ascending: false, nullsFirst: false });
  }

  const { data, error } = await request;
  if (error) {
    await logError(error, ["searchOrgs", "Read"]);
    throw error;
  }
  return data ?? [];
}

/*************************
 * Read every monthly snapshot of one charity, oldest first (its story over time).
 * @param abn The charity's 11-digit ABN
 */
export async function getOrgHistory(abn: string): Promise<Org[]> {
  const { data, error } = await supabase
    .from("orgs")
    .select("*")
    .eq("abn", abn)
    .order("snapshot_month", { ascending: true });

  if (error) {
    await logError(error, ["getOrgHistory", "Read"]);
    throw error;
  }
  return data ?? [];
}
