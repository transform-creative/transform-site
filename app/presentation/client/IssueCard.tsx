import { useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { ClientIssue } from "~/data/CustomTypes";
import {
  aiStatusMeta,
  deriveIssueStatus,
  issueActionPatch,
  issueTypeMeta,
  severityColor,
  timeAgo,
} from "~/business/commonBL";
import { updateIssue } from "~/database/Update";
import { createIssueComment } from "~/database/Create";
import { Icon } from "../elements/Icon";
import CommentPopup from "../elements/CommentPopup";

interface IssueCardProps {
  issue: ClientIssue;
  // A label shown above the issue text: the org the ticket belongs to on the
  // agency/admin board, or the colleague who posted it on a shared client board.
  label?: string | null;
  // Business board: shows the "Start" / "Mark updated" workflow actions rather
  // than the client's approve / reject decision.
  businessMode?: boolean;
  onOpen: (focusComments?: boolean) => void;
  onChanged: () => void;
}

/******************************
 * A single issue card on the portal. Shows the severity swatch, the workflow
 * action(s), the issue text, status metadata and a comments button. The
 * business drives an issue forward (start → mark updated); the client decides
 * on a pending update (approve / reject).
 */
export function IssueCard({
  issue,
  label,
  businessMode = false,
  onOpen,
  onChanged,
}: IssueCardProps) {
  const context: SharedContextProps = useOutletContext();
  const status = deriveIssueStatus(issue);
  // Which status change is waiting on a comment: "finish" (admin marks updated,
  // comment optional) or "reject" (client sends back, comment required).
  const [popup, setPopup] = useState<"finish" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const commentCount = issue.issue_comments?.length ?? 0;
  const ai = aiStatusMeta(issue.ai_status);
  const typeMeta = issueTypeMeta(issue.issue_type);

  // The business pushes an issue forward: start it, then mark it updated (also
  // used to re-submit something the client sent back).
  const businessAction: "start" | "update" | null = !businessMode
    ? null
    : status === "not_started"
      ? "start"
      : status === "in_progress" || status === "rejected"
        ? "update"
        : null;
  // The client only acts on a pending update.
  const showClientDecision =
    !businessMode && status === "awaiting_approval";
  // The business can approve on the client's behalf when an update has sat in
  // "awaiting client approval" too long and the client hasn't actioned it.
  const showAdminApprove =
    businessMode && status === "awaiting_approval";

  /**
   * Business workflow: start the work, mark it updated for approval, skip the
   * client's review, or approve a pending update on the client's behalf. "skip"
   * and "approve" both finalise the issue; they differ only in the label shown.
   */
  async function handleBusinessAction(
    action: "start" | "update" | "skip" | "approve",
  ) {
    try {
      const patchAction =
        action === "skip" || action === "approve"
          ? "approve"
          : action;
      await updateIssue(issue.id, issueActionPatch(patchAction));
      context.popAlert(
        action === "start"
          ? "Marked as started"
          : action === "update"
            ? "Marked as updated"
            : "Approved",
      );
      onChanged();
    } catch {
      context.popAlert(
        "Something went wrong",
        "Please try again",
        true,
      );
    }
  }

  /** Client decision: approve the update, or send it back to Transform. */
  async function handleDecision(decision: "approve" | "reject") {
    try {
      await updateIssue(issue.id, issueActionPatch(decision));
      context.popAlert(
        decision === "approve" ? "Approved" : "Sent back",
      );
      onChanged();
    } catch {
      context.popAlert(
        "Something went wrong",
        "Please try again",
        true,
      );
    }
  }

  /**
   * Finish/reject flow with a comment. Posts the comment first (so the email
   * trigger that fires on the status change finds it as the latest comment),
   * then applies the timestamp patch. Finish's comment is optional; reject's is
   * enforced by the popup, so an empty body only ever reaches here for finish.
   */
  async function handleCommentSubmit(body: string) {
    if (!popup) return;
    const action = popup === "finish" ? "update" : "reject";
    try {
      setSubmitting(true);
      if (body) {
        await createIssueComment({
          issue_id: issue.id,
          body,
          author_user_id: context.session?.user?.id,
        });
      }
      await updateIssue(issue.id, issueActionPatch(action));
      context.popAlert(action === "update" ? "Marked as updated" : "Sent back");
      setPopup(null);
      onChanged();
    } catch {
      context.popAlert("Something went wrong", "Please try again", true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="boxed p-10 col gap-5 outline-accent"
      style={{
        width: 280,
        borderColor: severityColor(issue.severity),
      }}
    >
      {/* Severity swatch + workflow / decision actions */}
      {status === "awaiting_approval" ? (
        <div
          className="row middle gap-5 pl-5 boxed"
          style={{ background: "var(--warningColor)" }}
        >
          <Icon name="alert-circle" size={14} />
          <p>Needs approval</p>
        </div>
      ) : businessMode && ai && (
          <div
            className={`row middle gap-5 boxed pl-5 ${ai.label === "AI working" ? "aiGradient" : ""}`}
            style={ai.label === "AI working" ? undefined : { background: ai.color }}
          >
            <Icon
              name={ai.icon}
              size={14}
              color={'var(--bkg)'}
              className={ai.label === "AI working" ? "spinPause" : ""}
            />
            <p style={{ color: 'var(--bkg)' }}>{ai.label}</p>
          </div>
        )}
      {status === "in_progress" && (
        <div className="row middle gap-5 boxed accent pl-5">
          <Icon name="code-working" size={14} />
          <p>{businessMode ? timeAgo(issue.started_at) : "Working on it"}</p>
        </div>
      )}
      
      <div className="between middle mt-5">
        <div>
          {" "}
          <Icon
            name={typeMeta.icon}
            size={28}
            color={severityColor(issue.severity)}
          />
        </div>
        {businessAction === "start" && (
          <button
            className="row middle gap-5 outline-accent"
            onClick={() => handleBusinessAction("start")}
          >
            <Icon
              name="play-circle-outline"
              size={18}
              color="var(--accent)"
            />
            Start
          </button>
        )}
        {businessAction === "update" && (
          <div className="row middle gap-5">
            <button
              className="row middle gap-5 outline-accent"
              onClick={() => setPopup("finish")}
            >
              <Icon
                name="checkmark-circle"
                size={18}
                color="var(--accent)"
              />
              Finish
            </button>
          </div>
        )}
        {showClientDecision && (
          <div className="row middle gap-5">
            <Icon
              name="checkmark-circle"
              size={20}
              color="var(--accent)"
              onClick={() => handleDecision("approve")}
            />
            <Icon
              name="close-circle"
              size={20}
              color="var(--dangerColor)"
              onClick={() => setPopup("reject")}
            />
          </div>
        )}
        {showAdminApprove && (
          <button
            className="row middle gap-5 outline"
            onClick={() => handleBusinessAction("approve")}
            title="Approve on the client's behalf"
          >
            <Icon
              name="checkmark-circle"
              size={18}
              color="var(--txt)"
            />
            Close
          </button>
        )}
      </div>
      
      <div className="pb-5" style={{borderBottom: '1px solid var(--accent-lg)'}}>
        {label && <h3 className="" style={{color: severityColor(issue.severity)}}>{label}</h3>}
        {/* Issue text — opens the issue */}
        <p className="clickable" onClick={() => onOpen(false)}>
          {issue.title || issue.description || "Untitled issue"}
        </p>
      </div>
<div className="row middle gap-5">
        <p style={{ color: "var(--accent-lg)" }}>
          <strong>Lodged</strong> {timeAgo(issue.created_at)}
        </p>
      </div>
      {/* Status metadata */}
      <div className="col gap-5">
        {status === "rejected" && (
          <div className="row middle gap-5">
            <Icon
              name="close-circle"
              size={14}
              color="var(--dangerColor)"
            />
            <p>Sent back</p>
          </div>
        )}

        {status === "not_started" && (
          <div className="row middle gap-5">
            <Icon
              name="ellipse-outline"
              size={14}
              color="var(--accent-lg)"
            />
            <p>{businessMode ? "Awaiting action" : "Not started"}</p>
          </div>
        )}

        {status === "awaiting_approval" && (
          <>
            <div className="row middle gap-5">
              <Icon
                name="checkmark-circle"
                size={14}
                color="var(--accent)"
              />
              <p style={{ color: "var(--accent-lg)" }}>
                {timeAgo(issue.updated_at)}
              </p>
            </div>
          </>
        )}

        {status === "approved" && (
          <div className="row middle gap-5">
            <Icon
              name="checkmark-circle"
              size={14}
              color="var(--accent)"
            />
            <p>Approved</p>
          </div>
        )}

        {/* AI auto-fix status (only once dispatched) — business admins only */}
       
      </div>

      {/* Link to the AI's pull request once it has opened one — business admins only */}
      {businessMode && issue.ai_pr_url && (
        <a
          role="button"
          className="row center middle gap-5 outline-accent"
          href={issue.ai_pr_url}
          target="_blank"
          rel="noreferrer"
        >
          <Icon
            name="git-pull-request-outline"
            size={18}
            color="var(--accent)"
          />
          View pull request
        </a>
      )}

      {/* Comments — pinned to the card's bottom edge */}
      <button
        className={`mt-auto w-100 center ${commentCount > 0 ? "accent" : "outline"}`}
        onClick={() => onOpen(true)}
      >
        {commentCount} comments
      </button>
      {businessAction === "update" && (
        <button
          className="row center middle gap-5 outline-secondary"
          onClick={() => handleBusinessAction("skip")}
        >
          <Icon name="flash-outline" size={18} color="var(--txt)" />
          Skip review
        </button>
      )}

      <CommentPopup
        active={popup !== null}
        onClose={() => setPopup(null)}
        onSubmit={handleCommentSubmit}
        submitting={submitting}
        required={popup === "reject"}
        title={popup === "reject" ? "Send this back" : "Mark as finished"}
        prompt={
          popup === "reject"
            ? "Tell us what's still wrong so we can fix it."
            : "Add a note about what you changed (optional)."
        }
        confirmLabel={popup === "reject" ? "Send back" : "Finish"}
      />
    </div>
  );
}
