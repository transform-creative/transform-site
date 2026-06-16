import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { ClientIssue } from "~/data/CustomTypes";
import {
  aiStatusMeta,
  deriveIssueStatus,
  issueActionPatch,
  severityColor,
  timeAgo,
} from "~/business/commonBL";
import { updateIssue } from "~/database/Update";
import { Icon } from "../elements/Icon";

interface IssueCardProps {
  issue: ClientIssue;
  // When set (admin/business board) the card shows who uploaded the issue.
  clientName?: string | null;
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
  clientName,
  businessMode = false,
  onOpen,
  onChanged,
}: IssueCardProps) {
  const context: SharedContextProps = useOutletContext();
  const status = deriveIssueStatus(issue);
  const commentCount = issue.issue_comments?.length ?? 0;
  const ai = aiStatusMeta(issue.ai_status);

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
  const showClientDecision = !businessMode && status === "awaiting_approval";

  /**
   * Business workflow: start the work, mark it updated for approval, or skip
   * the client's review and approve it outright.
   */
  async function handleBusinessAction(action: "start" | "update" | "skip") {
    try {
      await updateIssue(
        issue.id,
        issueActionPatch(action === "skip" ? "approve" : action)
      );
      context.popAlert(
        action === "start"
          ? "Marked as started"
          : action === "skip"
            ? "Approved"
            : "Marked as updated"
      );
      onChanged();
    } catch {
      context.popAlert("Something went wrong", "Please try again", true);
    }
  }

  /** Client decision: approve the update, or send it back to Transform. */
  async function handleDecision(decision: "approve" | "reject") {
    try {
      await updateIssue(issue.id, issueActionPatch(decision));
      context.popAlert(decision === "approve" ? "Approved" : "Sent back");
      onChanged();
    } catch {
      context.popAlert("Something went wrong", "Please try again", true);
    }
  }

  return (
    <div className="boxed p-10 col gap-10 issue-card outline-accent">
      {/* Created — kept at the very top so it doesn't get lost amongst the
          status metadata further down */}
      <div className="row middle gap-5">
        <Icon name="add-circle-outline" size={14} color="var(--accent)" />
        <p style={{ color: "var(--accent-lg)" }}>
          <b>Created</b> {timeAgo(issue.created_at)}
        </p>
      </div>

      {/* Severity swatch + workflow / decision actions */}
      <div className="between middle">
        <div
          className="severity-swatch"
          style={{ background: severityColor(issue.severity) }}
        />
        {businessAction === "start" && (
          <button
            className="row middle gap-5 outline-accent"
            onClick={() => handleBusinessAction("start")}
          >
            <Icon name="play-circle-outline" size={18} color="var(--accent)" />
            Start
          </button>
        )}
        {businessAction === "update" && (
          <div className="row middle gap-5">
            <button
              className="row middle gap-5 accentButton"
              onClick={() => handleBusinessAction("update")}
            >
              <Icon name="checkmark-circle" size={18} color="var(--bkg)" />
              Submit
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
              onClick={() => handleDecision("reject")}
            />
          </div>
        )}
      </div>

      {clientName && (
        <h3 className="outline-secondary pl-5">{clientName || "NO CLIENT"}</h3>
      )}

      {/* Issue text — opens the issue */}
      <p className="clickable" onClick={() => onOpen(false)}>
        {issue.description || issue.title || "Untitled issue"}
      </p>

      {/* Status metadata */}
      <div className="col gap-5">
        {status === "rejected" && (
          <div className="row middle gap-5">
            <Icon name="close-circle" size={14} color="var(--dangerColor)" />
            <p>Sent back</p>
          </div>
        )}

        {status === "in_progress" && (
          <div className="row middle gap-5">
            <Icon
              name="information-circle-outline"
              size={14}
              color="var(--accent-lg)"
            />
            <p>In progress</p>
          </div>
        )}

        {status === "not_started" && (
          <div className="row middle gap-5">
            <Icon name="ellipse-outline" size={14} color="var(--accent-lg)" />
            <p>{businessMode ? "Awaiting action" : "Not started"}</p>
          </div>
        )}

        {status === "awaiting_approval" && (
          <>
            <div className="row middle gap-5">
              <Icon name="checkmark-circle" size={14} color="var(--accent)" />
              <p>
                <b>Updated</b> {timeAgo(issue.updated_at)}
              </p>
            </div>
            <div className="row middle gap-5">
              <Icon
                name="alert-circle-outline"
                size={14}
                color="var(--warningColor)"
              />
              <p>{businessMode ? "Awaiting client approval" : "Pending your approval"}</p>
            </div>
          </>
        )}

        {status === "approved" && (
          <div className="row middle gap-5">
            <Icon name="checkmark-circle" size={14} color="var(--accent)" />
            <p>Approved</p>
          </div>
        )}

        {/* AI auto-fix status (only once dispatched) */}
        {ai && (
          <div className="row middle gap-5">
            <Icon name={ai.icon} size={14} color={ai.color} />
            <p style={{ color: ai.color }}>{ai.label}</p>
          </div>
        )}
      </div>

      {/* Link to the AI's pull request once it has opened one */}
      {issue.ai_pr_url && (
        <a
          className="row center middle gap-5 outline-accent"
          href={issue.ai_pr_url}
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="git-pull-request-outline" size={18} color="var(--accent)" />
          View pull request
        </a>
      )}

      {/* Comments — opens the issue focused on the comments panel */}
      <button
        className={` w-100 center ${commentCount > 0 ? "accent" : "outline"}`}
        onClick={() => onOpen(true)}
      >
        {commentCount} comments
      </button>
      {businessAction === "update" &&
          <button
              className="row center middle gap-5 outline-secondary"
              onClick={() => handleBusinessAction("skip")}
            >
              <Icon name="flash-outline" size={18} color="var(--txt)" />
              Skip review
            </button>
      }
    </div>
  );
}
