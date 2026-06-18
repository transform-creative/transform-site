import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type {
  Business,
  ClientIssue,
  IssueSeverity,
  Profile,
} from "~/data/CustomTypes";
import {
  deriveIssueStatus,
  lastActivityAt,
  severityColor,
  severityMeta,
  SEVERITY_COLUMN_ORDER,
} from "~/business/commonBL";
import {
  getBoardOrgs,
  getBusinessById,
  getBusinessClients,
  getBusinessIssues,
  getClientIssues,
  getOrgIssues,
  getOrgMembers,
  getOrgNamesForBoard,
  getProfile,
} from "~/database/Read";
import { supabaseSignOut } from "~/database/Auth";
import { Icon } from "../elements/Icon";
import TypeInput from "../elements/TypeInput";
import { IssueCard } from "./IssueCard";
import { IssueModal } from "./IssueModal";
import "../../app-v2.css";

interface ClientPortalProps {
  clientId: string;
  // The business the viewer belongs to (resolved from their membership). Backs
  // the board and is attached to any issue they log.
  businessId: number;
  // The viewer's organisation (client mode only). The source of truth for the
  // shared client board: every issue with this `client_business_id` is shown,
  // so colleagues see each other's issues. Null when the client has no org.
  orgBusinessId?: number | null;
  // When present the viewer is a business admin: the board loads every issue
  // for the business (across all clients) and cards show the uploader.
  business?: Business | null;
}

/** The board's three tabs. "being_updated" combines in-progress + sent-back. */
type TabKey = "needs_approval" | "being_updated" | "not_started";

// Tab metadata in display order. The bucket membership lives in `groupIssues`.
const TAB_META: { key: TabKey; label: string }[] = [
  { key: "needs_approval", label: "Needs approval" },
  { key: "being_updated", label: "Being updated" },
  { key: "not_started", label: "Not started" },
];

/** Split the open issues into the three tab buckets by derived status. */
function groupIssues(
  issues: ClientIssue[],
): Record<TabKey, ClientIssue[]> {
  const buckets: Record<TabKey, ClientIssue[]> = {
    needs_approval: [],
    being_updated: [],
    not_started: [],
  };
  for (const issue of issues) {
    const status = deriveIssueStatus(issue);
    if (status === "awaiting_approval")
      buckets.needs_approval.push(issue);
    else if (status === "in_progress" || status === "rejected")
      buckets.being_updated.push(issue);
    else if (status === "not_started")
      buckets.not_started.push(issue);
  }
  return buckets;
}

/** Sort a copy of the list by most recent activity, newest first. */
function byActivity(list: ClientIssue[]): ClientIssue[] {
  return [...list].sort(
    (a, b) => lastActivityAt(b) - lastActivityAt(a),
  );
}

/******************************
 * Default client portal dashboard. Shows a welcome header with a summary
 * of issue counts, then the issues grouped into "waiting your approval"
 * and "not yet completed". The "Log issue" button and each card open the
 * shared IssueModal for creating / editing / commenting.
 */
export function ClientPortal({
  clientId,
  businessId,
  orgBusinessId = null,
  business,
}: ClientPortalProps) {
  const context: SharedContextProps = useOutletContext();
  const isAdmin = !!business;
  const [client, setClient] = useState<Profile | null>(null);
  // The viewer's own org name (client mode), shown beside their first name.
  const [orgName, setOrgName] = useState<string | null>(null);
  // Maps an org's id (issue.client_business_id) to its name, for labelling each
  // card on the agency/admin board (which aggregates many orgs).
  const [orgNameById, setOrgNameById] = useState<Map<number, string>>(
    () => new Map(),
  );
  const [issues, setIssues] = useState<ClientIssue[]>([]);
  // The business's clients, loaded in admin mode for the "log issue" picker and
  // to resolve each card's reporting-client name.
  const [clients, setClients] = useState<
    Pick<Profile, "id" | "first_name" | "last_name">[]
  >([]);
  // The board's organisations, loaded in admin mode for the "log issue" picker
  // (an issue is attributed to an org, not an individual client).
  const [organisations, setOrganisations] = useState<
    Pick<Business, "id" | "name">[]
  >([]);
  const [loading, setLoading] = useState(true);
  // Drives the refresh button's spinner / disabled state when manually refreshed.
  const [refreshing, setRefreshing] = useState(false);
  // Admin-only board filter: limit the board to a single org's issues. Null
  // (the default) shows every org's tickets.
  const [orgFilter, setOrgFilter] = useState<number | null>(null);
  // The active board tab. Clients lead with what needs their approval; the
  // business leads with the work it's actively pushing forward.
  const [selectedTab, setSelectedTab] = useState<TabKey>(
    isAdmin ? "being_updated" : "needs_approval",
  );
  // The open modal, keyed by issue id (null id = create mode). Keying by id
  // means a reload re-supplies fresh data (e.g. a just-posted comment).
  const [modal, setModal] = useState<{
    issueId: number | null;
    focusComments: boolean;
    defaultSeverity?: IssueSeverity;
  } | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const issueData = isAdmin
        ? await getBusinessIssues(business!.id)
        : orgBusinessId != null
          ? await getOrgIssues(orgBusinessId)
          : await getClientIssues(clientId);
      if (mounted.current) setIssues(issueData);
    } catch {
      if (mounted.current)
        context.popAlert(
          "Could not refresh the issues",
          "Please try again",
          true,
        );
    }
  }, [clientId, isAdmin, business?.id, orgBusinessId]);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        setLoading(true);
        if (isAdmin) {
          const [issueData, clientList, orgNames, orgList] =
            await Promise.all([
              getBusinessIssues(business!.id),
              getBusinessClients(business!.id),
              getOrgNamesForBoard(business!.id),
              getBoardOrgs(business!.id),
            ]);
          if (!mounted.current) return;
          setIssues(issueData);
          setClients(clientList);
          setOrgNameById(orgNames);
          setOrganisations(orgList);
        } else {
          const [clientData, issueData, memberList, orgBiz] =
            await Promise.all([
              getProfile(clientId),
              orgBusinessId != null
                ? getOrgIssues(orgBusinessId)
                : getClientIssues(clientId),
              orgBusinessId != null
                ? getOrgMembers(orgBusinessId)
                : Promise.resolve([]),
              orgBusinessId != null
                ? getBusinessById(orgBusinessId)
                : Promise.resolve(null),
            ]);
          if (!mounted.current) return;
          setClient(clientData);
          setIssues(issueData);
          setClients(memberList);
          setOrgName(orgBiz?.name ?? null);
        }
      } catch (error) {
        if (mounted.current)
          context.popAlert(
            "Could not load the issues",
            "Please try again",
            true,
          );
      } finally {
        if (mounted.current) setLoading(false);
      }
    }

    load();
    return () => {
      mounted.current = false;
    };
  }, [clientId, isAdmin, business?.id, orgBusinessId]);

  // Refresh the board whenever the user re-opens the portal (returns to the
  // tab / refocuses the window), so the issues are never left stale.
  useEffect(() => {
    const onReopen = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onReopen);
    window.addEventListener("focus", onReopen);
    return () => {
      document.removeEventListener("visibilitychange", onReopen);
      window.removeEventListener("focus", onReopen);
    };
  }, [reload]);

  // The board, narrowed to the selected org when the admin has filtered it.
  const filteredIssues = useMemo(
    () =>
      orgFilter == null
        ? issues
        : issues.filter((i) => i.client_business_id === orgFilter),
    [issues, orgFilter],
  );
  // The open issues split into the three tab buckets, and the tabs that
  // actually have something to show (empty tabs are hidden).
  const buckets = useMemo(
    () => groupIssues(filteredIssues),
    [filteredIssues],
  );
  const tabs = useMemo(
    () =>
      TAB_META.map((t) => ({
        ...t,
        count: buckets[t.key].length,
      })).filter((t) => t.count > 0),
    [buckets],
  );
  // The active tab falls back to the first visible one when the role default
  // (or a previously-selected tab) has emptied out.
  const activeTab =
    tabs.find((t) => t.key === selectedTab) ?? tabs[0] ?? null;

  // Maps a client's id to their name, for labelling cards on the admin board.
  const clientNameById = useMemo(
    () =>
      new Map(
        clients.map((c) => [
          c.id,
          [c.first_name, c.last_name].filter(Boolean).join(" "),
        ]),
      ),
    [clients],
  );

  // Org options for the admin board filter — "All organisations" (null) first,
  // then one entry per org on the board.
  const orgFilterOptions = useMemo(
    () => [
      { value: null, label: "All organisations" },
      ...organisations.map((o) => ({ value: o.id, label: o.name })),
    ],
    [organisations],
  );

  // The live issue backing the modal, looked up fresh from state by id.
  const modalIssue =
    modal?.issueId != null
      ? (issues.find((i) => i.id === modal.issueId) ?? null)
      : null;

  function openIssue(issueId: number, focusComments: boolean) {
    setModal({ issueId, focusComments });
  }

  function handleLogIssue() {
    setModal({ issueId: null, focusComments: false });
  }

  /** Manual refresh from the header button: spins the icon and confirms. */
  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    await reload();
    if (mounted.current) {
      setRefreshing(false);
      context.popAlert("Issues refreshed");
    }
  }

  function handleLogIssueWithSeverity(severity: IssueSeverity) {
    setModal({
      issueId: null,
      focusComments: false,
      defaultSeverity: severity,
    });
  }

  /** A single issue card, with the role-aware wiring shared by every tab. */
  const renderCard = (issue: ClientIssue) => (
    <IssueCard
      key={issue.id}
      issue={issue}
      label={
        isAdmin
          ? // The agency board aggregates many orgs: label each card with the
            // org the ticket belongs to (falling back to the reporter's name).
            ((issue.client_business_id != null
              ? orgNameById.get(issue.client_business_id)
              : undefined) ??
            clientNameById.get(issue.client_id) ??
            undefined)
          : // In an org, label colleagues' issues (but not your own).
            issue.client_id !== clientId
            ? (clientNameById.get(issue.client_id) ?? undefined)
            : undefined
      }
      businessMode={isAdmin}
      onOpen={(focusComments) => openIssue(issue.id, !!focusComments)}
      onChanged={reload}
    />
  );

  /** Tab body: cards laid out left-to-right with even spacing, newest first. */
  const renderGrid = (list: ClientIssue[]) => (
    <div className="row wrap gap-20 w-100 stretch">
      {byActivity(list).map(renderCard)}
    </div>
  );

  /**
   * Tab body for "not started": one column per severity present (most-severe
   * first), each column's cards sorted newest-activity first.
   */
  const renderSeverityColumns = (list: ClientIssue[]) => (
    <div className="row wrap gap-20 w-100 start">
      {SEVERITY_COLUMN_ORDER.map((severity) => {
        const column = byActivity(
          list.filter((i) => i.severity === severity),
        );
        if (column.length === 0) return null;
        return (
          <div key={severity} className="col gap-10 severity-column">
            <div className="row middle gap-5 between">
              <div className="row middle gap-5">
                <div
                  className="severity-swatch"
                  style={{ background: severityColor(severity) }}
                />
                <h3>
                  {severityMeta(severity).label} ({column.length})
                </h3>
              </div>
              <button
                className="row middle gap-5 outline-accent severity-add-btn"
                onClick={() => handleLogIssueWithSeverity(severity)}
                title={`Add ${severityMeta(severity).label} issue`}
              >
                <Icon
                  name="add-outline"
                  size={16}
                  color="var(--accent)"
                />
              </button>
            </div>
            {column.map(renderCard)}
          </div>
        );
      })}
    </div>
  );

  async function handleSignOut() {
    const result = await supabaseSignOut();
    if (result !== true) {
      context.popAlert(
        "Could not sign out",
        "Please try again",
        true,
      );
      return;
    }
    context.popAlert("Signed out");
    context.navigate("/");
  }

  return (
    <div
      className="col middle gap-20 ml-20 mr-20"
      style={{ minHeight: "90vh" }}
    >
      <div className="col w-75 gap-20">
        {/* Header */}
        <div
          className="row relative p-20 r-10 outline-secondary"
          style={{ background: "var(--accent-sm)" }}
        >
          <div className="w-100 col start center">
            <div className="row middle between gap-10 w-100 shrink-col">
              <div className="row middle gap-10 shrink-col">
                <h3>
                  {isAdmin
                    ? business?.name || "Your business"
                    : `${client?.first_name || "Client name"}${
                        orgName ? ` · ${orgName}` : ""
                      }`}
                </h3>
                <button
                  className="row middle outline-secondary gap-5"
                  onClick={handleSignOut}
                >
                  <Icon
                    name="log-out-outline"
                    color="var(--accent)"
                  />
                  Sign out
                </button>
              </div>
              <div className="row middle gap-10">
                <button
                  className="row middle outline-secondary"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh issues"
                >
                  <Icon
                    name="refresh-outline"
                    color="var(--accent)"
                    className={refreshing ? "spin360" : ""}
                  />
                </button>
                <button
                  className="accentButton row middle gap-5"
                  onClick={handleLogIssue}
                >
                  <Icon name="add-outline" color="var(--bkg)" />
                  Log issue
                </button>
              </div>
            </div>
            <h1 className="accent shrink-col">Welcome back.</h1>
            <p className="">
              <strong>{issues.length}</strong> issues available
            </p>
          </div>
        </div>
        {loading ? (
          <p className="center w-100" style={{ minHeight: "90vh" }}>
            Loading…
          </p>
        ) : issues.length === 0 ? (
          <div
            className="col middle center gap-10 outline"
            style={{ minHeight: "90vh" }}
          >
            <Icon
              name="checkmark-circle"
              size={48}
              color="var(--accent)"
            />
            <h3>You're all caught up</h3>
            <p>There are no issues to show right now.</p>
          </div>
        ) : (
          <div className="col gap-20 w-100 ">
            {/* Tab bar — buttons (one per non-empty bucket) on the left, the
                admin org filter pinned to the far right. */}
            <div className="row wrap gap-10 between middle w-100">
              <div className="row wrap gap-10 middle">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`${activeTab?.key === t.key ? "accentButton" : "outline-secondary"}  row gap-5 middle center`}
                  onClick={() => setSelectedTab(t.key)}
                >
                  {t.label}{" "}
                  <div
                    className="col middle center"
                    style={{
                      height: 30,
                      width: 30,
                      background:
                        activeTab?.key === t.key
                          ? "var(--bkg)"
                          : "var(--accent-md)",
                      borderRadius: 15,
                    }}
                  >
                    <b
                      style={{
                        color:
                          activeTab?.key === t.key
                            ? "var(--accent)"
                            : "var(--txt)",
                      }}
                    >
                      {t.count}
                    </b>
                  </div>
                </button>
              ))}
              </div>
              {isAdmin && (
                <TypeInput
                  options={orgFilterOptions}
                  value={orgFilter}
                  onChange={(val) => setOrgFilter(val ?? null)}
                  onInputChange={() => {}}
                  placeholder="All organisations"
                  className="org-filter"
                />
              )}
            </div>

            {/* Tab body */}
            {activeTab?.key === "not_started"
              ? renderSeverityColumns(buckets.not_started)
              : activeTab && renderGrid(buckets[activeTab.key])}
          </div>
        )}
      </div>

      <IssueModal
        active={modal !== null}
        issue={modalIssue}
        clientId={clientId}
        businessId={businessId}
        clientBusinessId={orgBusinessId}
        organisations={isAdmin ? organisations : undefined}
        businessMode={isAdmin}
        focusComments={modal?.focusComments}
        defaultSeverity={modal?.defaultSeverity}
        onClose={() => setModal(null)}
        onChanged={reload}
      />
    </div>
  );
}
