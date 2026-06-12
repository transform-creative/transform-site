import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { ClientIssue, IssueSeverity } from "~/data/CustomTypes";
import {
  deriveIssueStatus,
  severityColor,
  severityMeta,
  SEVERITY_OPTIONS,
  timeAgo,
} from "~/business/commonBL";
import { createIssue, createIssueComment } from "~/database/Create";
import { approveIssue, rejectIssue, updateIssue } from "~/database/Update";
import { Icon } from "../elements/Icon";
import { LabelInput } from "../elements/LabelInput/LabelInput";
import BasicMenu from "../elements/BasicMenu";
import "../../app-v2.css";
import "../elements/LabelInput/LabelInput.css";

interface IssueModalProps {
  active: boolean;
  issue: ClientIssue | null; // null = create mode, present = edit mode
  clientId: string;
  businessId: number | null;
  focusComments?: boolean; // edit opened via the comments button
  onClose: () => void;
  onChanged: () => void; // tell the portal to refetch
}

/******************************
 * Create / edit an issue. The same component renders both modes: when `issue`
 * is null it's the simple "log issue" form; when an issue is supplied it also
 * shows the metadata, approve/reject actions and the comments panel.
 */
export function IssueModal({
  active,
  issue,
  clientId,
  businessId,
  focusComments = false,
  onClose,
  onChanged,
}: IssueModalProps) {
  const context: SharedContextProps = useOutletContext();
  const isEdit = !!issue;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IssueSeverity>("low");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Seed the form whenever a different issue is opened (or reset for create).
  useEffect(() => {
    setTitle(issue?.title ?? "");
    setDescription(issue?.description ?? "");
    setSeverity((issue?.severity as IssueSeverity) ?? "low");
    setPickerOpen(false);
    setCommentBody("");
  }, [issue?.id, active]);

  const status = issue ? deriveIssueStatus(issue) : "not_started";
  const meta = severityMeta(severity);

  /** Create or save the issue from the form. */
  async function handleSubmit() {
    if (!description.trim()) {
      context.popAlert("Add a description", "Tell us what the problem is", true);
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit && issue) {
        await updateIssue(issue.id, { title, description, severity });
        context.popAlert("Issue updated");
        onChanged();
      } else {
        await createIssue({
          client_id: clientId,
          business_id: businessId,
          title,
          description,
          severity,
        });
        context.popAlert("Issue logged", "We'll take a look shortly");
        onChanged();
        onClose();
      }
    } catch {
      context.popAlert("Could not save your issue", "Please try again", true);
    } finally {
      setSubmitting(false);
    }
  }

  /** Approve / reject the pending update (edit mode header). */
  async function handleDecision(decision: "approve" | "reject") {
    if (!issue) return;
    try {
      decision === "approve"
        ? await approveIssue(issue.id)
        : await rejectIssue(issue.id);
      context.popAlert(decision === "approve" ? "Approved" : "Sent back");
      onChanged();
      onClose();
    } catch {
      context.popAlert("Something went wrong", "Please try again", true);
    }
  }

  /** Post a new comment against the open issue. */
  async function handleAddComment() {
    if (!issue || !commentBody.trim()) return;
    try {
      setCommentSubmitting(true);
      await createIssueComment({
        issue_id: issue.id,
        body: commentBody.trim(),
        author_user_id: clientId,
      });
      setCommentBody("");
      onChanged();
    } catch {
      context.popAlert("Could not post your comment", "Please try again", true);
    } finally {
      setCommentSubmitting(false);
    }
  }

  return (
    <BasicMenu
      active={active}
      onClose={onClose}
      width={context.inShrink ? "95%" : isEdit ? 820 : 420}
      disableClickOff
    >
      <div className="row gap20 wrap issue-modal">
        {/* Left panel — the form */}
        <div className="col gap10 issue-modal-form">
          <div className="between middle">
            <h3 className="accent">New feature or issue request</h3>
            {isEdit && status === "awaiting_approval" && (
              <div className="row middle gap5">
                <Icon
                  name="checkmark-circle"
                  size={26}
                  color="var(--accent)"
                  onClick={() => handleDecision("approve")}
                />
                <Icon
                  name="close-circle"
                  size={26}
                  color="var(--dangerColor)"
                  onClick={() => handleDecision("reject")}
                />
              </div>
            )}
          </div>

          {/* Edit-only metadata */}
          {isEdit && issue && (
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
          )}

          <LabelInput
            name="Title"
            placeholder="Give it a short name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <LabelInput
            name="Describe the problem"
            placeholder="Describe the problem"
            value={description}
            isTextArea
            style={{ minHeight: 110 }}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Severity picker */}
          <div className="col gap5 relative">
            <button
              type="button"
              className="row middle gap10 severity-picker"
              onClick={() => setPickerOpen((o) => !o)}
            >
              <div
                className="severity-swatch"
                style={{ background: severityColor(severity) }}
              />
              <p>
                <b>{meta.label}</b> . {meta.description}
              </p>
            </button>
            {pickerOpen && (
              <div className="col boxed severity-list">
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="row middle gap10 severity-option"
                    onClick={() => {
                      setSeverity(opt.value);
                      setPickerOpen(false);
                    }}
                  >
                    <div
                      className="severity-swatch"
                      style={{ background: severityColor(opt.value) }}
                    />
                    <p>
                      <b>{opt.label}</b> . {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="accentButton w-100 center middle gap5"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Icon name="checkmark-circle" color="var(--bkg)" />
            {submitting ? "Saving…" : "Submit"}
          </button>
        </div>

        {/* Right panel — comments (edit only) */}
        {isEdit && issue && (
          <div className="col gap10 issue-comments">
            {issue.issue_comments.length === 0 ? (
              <p className="accent-text">No comments yet</p>
            ) : (
              issue.issue_comments.map((comment) => (
                <div key={comment.id} className="col comment-card">
                  <p>
                    <b>
                      {comment.author_user_id === clientId
                        ? "You"
                        : "Transform"}
                    </b>{" "}
                    {timeAgo(comment.created_at)}
                  </p>
                  <p>{comment.body}</p>
                </div>
              ))
            )}

            <LabelInput
              name=""
              inlineLabel
              placeholder="Your comment here"
              value={commentBody}
              isTextArea
              autoFocus={focusComments}
              style={{ minHeight: 70 }}
              onChange={(e) => setCommentBody(e.target.value)}
            />
            <button
              className="outline-secondary w-100 center middle gap5"
              onClick={handleAddComment}
              disabled={commentSubmitting || !commentBody.trim()}
            >
              <Icon name="add-outline" color="var(--accent)" />
              {commentSubmitting ? "Posting…" : "Comment"}
            </button>
          </div>
        )}
      </div>
    </BasicMenu>
  );
}
