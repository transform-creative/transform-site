import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { ClientIssue } from "~/data/CustomTypes";
import { deriveIssueStatus, severityColor, timeAgo } from "~/business/commonBL";
import { approveIssue, rejectIssue } from "~/database/Update";
import { Icon } from "../elements/Icon";

interface IssueCardProps {
  issue: ClientIssue;
  onOpen: (focusComments?: boolean) => void;
  onChanged: () => void;
}

/******************************
 * A single issue card on the client portal. Shows the severity swatch,
 * approve / reject actions, the issue text, status metadata and a
 * comments button. Clicking the body opens the issue, the comments button
 * opens it focused on the comments panel.
 */
export function IssueCard({ issue, onOpen, onChanged }: IssueCardProps) {
  const context: SharedContextProps = useOutletContext();
  const status = deriveIssueStatus(issue);
  const commentCount = issue.issue_comments?.length ?? 0;

  /** Approve / reject the pending update straight from the card. */
  async function handleDecision(decision: "approve" | "reject") {
    try {
      decision === "approve"
        ? await approveIssue(issue.id)
        : await rejectIssue(issue.id);
      context.popAlert(decision === "approve" ? "Approved" : "Sent back");
      onChanged();
    } catch {
      context.popAlert("Something went wrong", "Please try again", true);
    }
  }

  return (
    <div className="boxed p-10 col gap10 issue-card">
      {/* Severity swatch + approve/reject actions */}
      <div className="between middle">
        <div
          className="severity-swatch"
          style={{ background: severityColor(issue.severity) }}
        />
        {status === "awaiting_approval" && (
          <div className="row middle gap5">
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

      {/* Issue text — opens the issue */}
      <p className="clickable" onClick={() => onOpen(false)}>
        {issue.description || issue.title || "Untitled issue"}
      </p>

      {/* Status metadata */}
      <div className="col gap5">
        <div className="row middle gap5">
          <Icon name="add-circle-outline" size={14} color="var(--accent)" />
          <p>
            <b>Created</b> {timeAgo(issue.created_at)}
          </p>
        </div>

        {status === "awaiting_approval" && (
          <div className="row middle gap5">
            <Icon name="checkmark-circle" size={14} color="var(--accent)" />
            <p>
              <b>Updated</b> {timeAgo(issue.updated_at)}
            </p>
          </div>
        )}

        {status === "in_progress" && (
          <div className="row middle gap5">
            <Icon
              name="information-circle-outline"
              size={14}
              color="var(--accent-lg)"
            />
            <p>Working on it</p>
          </div>
        )}

        {status === "not_started" && (
          <div className="row middle gap5">
            <Icon name="ellipse-outline" size={14} color="var(--accent-lg)" />
            <p>Not started</p>
          </div>
        )}

        {status === "rejected" && (
          <div className="row middle gap5">
            <Icon name="close-circle" size={14} color="var(--dangerColor)" />
            <p>Sent back</p>
          </div>
        )}

        {!issue.approved_at && (
          <div className="row middle gap5">
            <Icon
              name="alert-circle-outline"
              size={14}
              color="var(--warningColor)"
            />
            <p>Pending approval</p>
          </div>
        )}
      </div>

      {/* Comments — opens the issue focused on the comments panel */}
      <button
        className="outline-secondary w-100 center"
        onClick={() => onOpen(true)}
      >
        {commentCount} comments
      </button>
    </div>
  );
}
