import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type {
  AuthClient,
  Business,
  BusinessIssue,
  ClientIssue,
} from "~/data/CustomTypes";
import { deriveIssueStatus } from "~/business/commonBL";
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
  // The completed board is collapsed by default for both views.
  const [showCompleted, setShowCompleted] = useState(false);
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

  const awaiting = issues.filter(
    (i) => deriveIssueStatus(i) === "awaiting_approval",
  );
  const inProgress = issues.filter(
    (i) => deriveIssueStatus(i) === "in_progress",
  );
  const notStarted = issues.filter(
    (i) => deriveIssueStatus(i) === "not_started",
  );
  const rejected = issues.filter(
    (i) => deriveIssueStatus(i) === "rejected",
  );
  const completed = issues.filter(
    (i) => deriveIssueStatus(i) === "approved",
  );

  // The board's rows. Same groups for both views; only the order differs by
  // role — the business works top-down (fix sent-back, then start, update,
  // wait), while the client leads with what needs their approval.
  const sectionMap = {
    rejected: { key: "rejected", issues: rejected, label: "sent back" },
    awaiting: { key: "awaiting", issues: awaiting, label: "awaiting approval" },
    in_progress: { key: "in_progress", issues: inProgress, label: "being updated" },
    not_started: { key: "not_started", issues: notStarted, label: "awaiting action" },
  };
  const sections: { key: string; issues: ClientIssue[]; label: string }[] =
    isAdmin
      ? [
          sectionMap.rejected,
          sectionMap.not_started,
          sectionMap.in_progress,
          sectionMap.awaiting,
        ]
      : [
          sectionMap.awaiting,
          sectionMap.in_progress,
          sectionMap.rejected,
          sectionMap.not_started,
        ];

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

  /** A row of issue cards, shared across the board's sections. */
  const renderCards = (list: ClientIssue[]) => (
    <div className="row wrap gap-20 w-100">
      {list.map((issue) => (
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
      ))}
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
    <div className="col middle gap-20 ml-20 mr-20">
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
              <b>{awaiting.length}</b> issues awaiting approval{" · "}
              <b>{inProgress.length}</b> in progress{" · "}
              <b>{notStarted.length}</b> not started
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
          <>
            {sections.map(
              (s) =>
                s.issues.length > 0 && (
                  <div key={s.key} className="col gap-10 w-100">
                    <h3>
                      {s.issues.length} issue
                      {s.issues.length === 1 ? "" : "s"}{" "}
                      <b
                        className={
                          s.key === "rejected" ? "danger-text" : "accent-text"
                        }
                      >
                        {s.label}
                      </b>
                    </h3>
                    {renderCards(s.issues)}
                  </div>
                ),
            )}

            {/* Completed board — collapsed by default for both views */}
            {completed.length > 0 && (
              <div className="col gap-10 w-100">
                <button
                  className="outline-secondary row middle gap-5"
                  onClick={() => setShowCompleted((c) => !c)}
                >
                  <Icon
                    name={showCompleted ? "chevron-down-outline" : "chevron-forward-outline"}
                    color="var(--accent)"
                  />
                  {showCompleted ? "Hide" : "Show"} {completed.length} completed
                </button>
                {showCompleted && renderCards(completed)}
              </div>
            )}
          </>
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
