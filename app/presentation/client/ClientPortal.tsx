import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type {
  AuthClient,
  Business,
  BusinessIssue,
  ClientIssue,
} from "~/data/CustomTypes";
import {
  deriveIssueStatus,
  lastActivityAt,
  severityColor,
  severityMeta,
  SEVERITY_COLUMN_ORDER,
} from "~/business/commonBL";
import {
  getAuthClient,
  getBusinessClients,
  getBusinessIssues,
  getClientIssues,
} from "~/database/Read";
import { supabaseSignOut } from "~/database/Auth";
import { Icon } from "../elements/Icon";
import { IssueCard } from "./IssueCard";
import { IssueModal } from "./IssueModal";
import "../../app-v2.css";

interface ClientPortalProps {
  clientId: string;
  // When present the viewer is a business owner/admin: the board loads every
  // issue for the business (across all clients) and cards show the uploader.
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
function groupIssues(issues: ClientIssue[]): Record<TabKey, ClientIssue[]> {
  const buckets: Record<TabKey, ClientIssue[]> = {
    needs_approval: [],
    being_updated: [],
    not_started: [],
  };
  for (const issue of issues) {
    const status = deriveIssueStatus(issue);
    if (status === "awaiting_approval") buckets.needs_approval.push(issue);
    else if (status === "in_progress" || status === "rejected")
      buckets.being_updated.push(issue);
    else if (status === "not_started") buckets.not_started.push(issue);
  }
  return buckets;
}

/** Sort a copy of the list by most recent activity, newest first. */
function byActivity(list: ClientIssue[]): ClientIssue[] {
  return [...list].sort((a, b) => lastActivityAt(b) - lastActivityAt(a));
}

/******************************
 * Default client portal dashboard. Shows a welcome header with a summary
 * of issue counts, then the issues grouped into "waiting your approval"
 * and "not yet completed". The "Log issue" button and each card open the
 * shared IssueModal for creating / editing / commenting.
 */
export function ClientPortal({
  clientId,
  business,
}: ClientPortalProps) {
  const context: SharedContextProps = useOutletContext();
  const isAdmin = !!business;
  const [client, setClient] = useState<AuthClient | null>(null);
  const [issues, setIssues] = useState<ClientIssue[]>([]);
  // The business's clients, loaded in admin mode for the "log issue" picker.
  const [clients, setClients] = useState<
    Pick<AuthClient, "user_id" | "name">[]
  >([]);
  const [loading, setLoading] = useState(true);
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
  } | null>(null);
  const mounted = useRef(true);

  // The business id backing the board. For an admin it's the business they own;
  // for a client it's the `client_of` they belong to (used when logging issues).
  const clientOf = context.session?.user?.app_metadata?.client_of;
  const businessId = isAdmin
    ? business!.id
    : clientOf != null && Number.isFinite(Number(clientOf))
      ? Number(clientOf)
      : null;

  const reload = useCallback(async () => {
    try {
      const issueData = isAdmin
        ? await getBusinessIssues(business!.id)
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
  }, [clientId, isAdmin, business?.id]);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        setLoading(true);
        if (isAdmin) {
          const [issueData, clientList] = await Promise.all([
            getBusinessIssues(business!.id),
            getBusinessClients(business!.id),
          ]);
          if (!mounted.current) return;
          setIssues(issueData);
          setClients(clientList);
        } else {
          const [clientData, issueData] = await Promise.all([
            getAuthClient(clientId),
            getClientIssues(clientId),
          ]);
          if (!mounted.current) return;
          setClient(clientData);
          setIssues(issueData);
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
  }, [clientId, isAdmin, business?.id]);

  // The open issues split into the three tab buckets, and the tabs that
  // actually have something to show (empty tabs are hidden).
  const buckets = useMemo(() => groupIssues(issues), [issues]);
  const tabs = useMemo(
    () =>
      TAB_META.map((t) => ({ ...t, count: buckets[t.key].length })).filter(
        (t) => t.count > 0,
      ),
    [buckets],
  );
  // The active tab falls back to the first visible one when the role default
  // (or a previously-selected tab) has emptied out.
  const activeTab = tabs.find((t) => t.key === selectedTab) ?? tabs[0] ?? null;

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

  /** A single issue card, with the role-aware wiring shared by every tab. */
  const renderCard = (issue: ClientIssue) => (
    <IssueCard
      key={issue.id}
      issue={issue}
      clientName={
        isAdmin ? (issue as BusinessIssue).auth_clients?.name : undefined
      }
      businessMode={isAdmin}
      onOpen={(focusComments) => openIssue(issue.id, !!focusComments)}
      onChanged={reload}
    />
  );

  /** Tab body: cards laid out left-to-right with even spacing, newest first. */
  const renderGrid = (list: ClientIssue[]) => (
    <div className="row wrap gap-20 w-100 start">
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
            <div className="row middle gap-5">
              <div
                className="severity-swatch"
                style={{ background: severityColor(severity) }}
              />
              <h4>
                {severityMeta(severity).label} ({column.length})
              </h4>
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
    <div className="col middle gap-20 ml-20 mr-20" style={{minHeight: "90vh"}}>
      <div className="col w-75 gap-20">
        {/* Header */}
        <div className="row relative ">
          <div className="w-100 col start center">
            <div className="row middle between gap-10 w-100">
              <div className="row middle gap-10">
                <h3>
                  {isAdmin
                    ? business?.name || "Your business"
                    : client?.name || "Client name"}
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
              <button
                className="accentButton row middle gap-5"
                onClick={handleLogIssue}
              >
                <Icon name="add-outline" color="var(--bkg)" />
                Log issue
              </button>
            </div>
            <h1 className="accent">Welcome back.</h1>
            <p className="">
             <strong>{issues.length}</strong> issues available
            </p>
          </div>
        </div>
        {loading ? (
          <p className="center w-100">Loading…</p>
        ) : issues.length === 0 ? (
          <div className="col middle center gap-10 mt2">
            <Icon
              name="checkmark-circle"
              size={48}
              color="var(--accent)"
            />
            <h3>You're all caught up</h3>
            <p>There are no issues to show right now.</p>
          </div>
        ) : (
          <div className="col gap-20 w-100">
            {/* Tab bar — left-aligned buttons, one per non-empty bucket */}
            <div className="row wrap gap-10">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={
                    activeTab?.key === t.key ? "accentButton" : "outline-secondary"
                  }
                  onClick={() => setSelectedTab(t.key)}
                >
                  {t.label} ({t.count})
                </button>
              ))}
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
        clients={isAdmin ? clients : undefined}
        businessMode={isAdmin}
        focusComments={modal?.focusComments}
        onClose={() => setModal(null)}
        onChanged={reload}
      />
    </div>
  );
}
