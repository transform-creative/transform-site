import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { AuthClient, ClientIssue } from "~/data/CustomTypes";
import { deriveIssueStatus } from "~/business/commonBL";
import { getAuthClient, getClientIssues } from "~/database/Read";
import { supabaseSignOut } from "~/database/Auth";
import { Icon } from "../elements/Icon";
import { IssueCard } from "./IssueCard";
import { IssueModal } from "./IssueModal";
import '../../app-v2.css'

interface ClientPortalProps {
  clientId: string;
}

/******************************
 * Default client portal dashboard. Shows a welcome header with a summary
 * of issue counts, then the issues grouped into "waiting your approval"
 * and "not yet completed". The "Log issue" button and each card open the
 * shared IssueModal for creating / editing / commenting.
 */
export function ClientPortal({ clientId }: ClientPortalProps) {
  const context: SharedContextProps = useOutletContext();
  const [client, setClient] = useState<AuthClient | null>(null);
  const [issues, setIssues] = useState<ClientIssue[]>([]);
  const [loading, setLoading] = useState(true);
  // The open modal, keyed by issue id (null id = create mode). Keying by id
  // means a reload re-supplies fresh data (e.g. a just-posted comment).
  const [modal, setModal] = useState<{
    issueId: number | null;
    focusComments: boolean;
  } | null>(null);
  const mounted = useRef(true);

  // The business this client belongs to, used when logging a new issue.
  const clientOf = context.session?.user?.app_metadata?.client_of;
  const businessId =
    clientOf != null && Number.isFinite(Number(clientOf))
      ? Number(clientOf)
      : null;

  const reload = useCallback(async () => {
    try {
      const issueData = await getClientIssues(clientId);
      if (mounted.current) setIssues(issueData);
    } catch {
      if (mounted.current)
        context.popAlert("Could not refresh your issues", "Please try again", true);
    }
  }, [clientId]);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        setLoading(true);
        const [clientData, issueData] = await Promise.all([
          getAuthClient(clientId),
          getClientIssues(clientId),
        ]);
        if (!mounted.current) return;
        setClient(clientData);
        setIssues(issueData);
      } catch (error) {
        if (mounted.current)
          context.popAlert("Could not load your issues", "Please try again", true);
      } finally {
        if (mounted.current) setLoading(false);
      }
    }

    load();
    return () => {
      mounted.current = false;
    };
  }, [clientId]);

  const awaiting = issues.filter(
    (i) => deriveIssueStatus(i) === "awaiting_approval"
  );
  const inProgress = issues.filter(
    (i) => deriveIssueStatus(i) === "in_progress"
  );
  const notStarted = issues.filter(
    (i) => deriveIssueStatus(i) === "not_started"
  );
  const rejected = issues.filter((i) => deriveIssueStatus(i) === "rejected");
  const notCompleted = [...inProgress, ...notStarted, ...rejected];

  // The live issue backing the modal, looked up fresh from state by id.
  const modalIssue =
    modal?.issueId != null
      ? issues.find((i) => i.id === modal.issueId) ?? null
      : null;

  function openIssue(issueId: number, focusComments: boolean) {
    setModal({ issueId, focusComments });
  }

  function handleLogIssue() {
    setModal({ issueId: null, focusComments: false });
  }

  async function handleSignOut() {
    const result = await supabaseSignOut();
    if (result !== true) {
      context.popAlert("Could not sign out", "Please try again", true);
      return;
    }
    context.popAlert("Signed out");
    context.navigate("/");
  }

  return (
    <div className="col middle gap-20">
      {/* Header */}
      <div className="row relative ">
        <button
          className="row middle gap5 portal-signout"
          onClick={handleSignOut}
        >
          <Icon name="log-out-outline" color="var(--accent)" />
          Sign out
        </button>
        <div className="w-100 col middle center">
          <p>{client?.name || "Client name"}</p>
          <h1 className="accent">Welcome back.</h1>
          <p>
            <b>{awaiting.length}</b> issues awaiting approval{" · "}
            <b>{inProgress.length}</b> in progress{" · "}
            <b>{notStarted.length}</b> not started
          </p>
        </div>
        <button
          className="accentButton row middle gap5 log-issue"
          onClick={handleLogIssue}
        >
          <Icon name="add-outline" color="var(--bkg)" />
          Log issue
        </button>
      </div>

      {loading ? (
        <p className="center w-100">Loading…</p>
      ) : issues.length === 0 ? (
        <div className="col middle center gap10 mt2">
          <Icon name="checkmark-circle" size={48} color="var(--accent)" />
          <h3>You're all caught up</h3>
          <p>There are no issues to show right now.</p>
        </div>
      ) : (
        <>
          {/* Awaiting approval */}
          {awaiting.length > 0 && (
            <div className="col gap-10 w-100">
              <h3>
                {awaiting.length} <b className="accent-text">Updated</b> issues
                waiting your approval
              </h3>
              <div className="row gap-20 w-100">
                {awaiting.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onOpen={(focusComments) => openIssue(issue.id, !!focusComments)}
                    onChanged={reload}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Not yet completed */}
          {notCompleted.length > 0 && (
            <div className="col gap-20">
              <h4>
                {notCompleted.length} issue
                {notCompleted.length === 1 ? "" : "s"} not yet completed
              </h4>
              <div className="row wrap gap-20">
                {notCompleted.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onOpen={(focusComments) => openIssue(issue.id, !!focusComments)}
                    onChanged={reload}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <IssueModal
        active={modal !== null}
        issue={modalIssue}
        clientId={clientId}
        businessId={businessId}
        focusComments={modal?.focusComments}
        onClose={() => setModal(null)}
        onChanged={reload}
      />
    </div>
  );
}
