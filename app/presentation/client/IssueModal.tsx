import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { AuthClient, ClientIssue, IssueSeverity } from "~/data/CustomTypes";
import {
  deriveIssueStatus,
  severityColor,
  severityMeta,
  SEVERITY_OPTIONS,
  timeAgo,
} from "~/business/commonBL";
import { createIssue, createIssueComment } from "~/database/Create";
import {
  approveIssue,
  markIssueUpdated,
  rejectIssue,
  startIssue,
  updateIssue,
} from "~/database/Update";
import { Icon } from "../elements/Icon";
import { LabelInput } from "../elements/LabelInput/LabelInput";
import BasicMenu from "../elements/BasicMenu";
import "../../app-v2.css";
import "../elements/LabelInput/LabelInput.css";
import MoveableMenu from "../elements/MoveableMenu";
import { ContextModal } from "../elements/ContextModal";

interface IssueModalProps {
  active: boolean;
  issue: ClientIssue | null; // null = create mode, present = edit mode
  clientId: string;
  businessId: number | null;
  // When present (admin/business board) the create form shows a client picker
  // so the issue is attributed to a real client rather than the admin.
  clients?: Pick<AuthClient, "user_id" | "name">[];
  // Business board: drives the start → mark-updated workflow rather than the
  // client's approve / reject decision.
  businessMode?: boolean;
  focusComments?: boolean; // edit opened via the comments button
  onClose: () => void;
  onChanged: () => void; // tell the portal to refetch
}

// Remembers the admin's last "log issue for" client across sessions.
const LAST_CLIENT_KEY = "transform.lastIssueClientId";

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
  clients,
  businessMode = false,
  focusComments = false,
  onClose,
  onChanged,
}: IssueModalProps) {
  const context: SharedContextProps = useOutletContext();
  const isEdit = !!issue;
  // Admins logging a new issue choose which client it's for.
  const showClientPicker = !isEdit && !!clients;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IssueSeverity>("low");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // The client a new issue is logged for (admin only), defaulting to the last
  // selection cached in localStorage.
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Seed the form whenever a different issue is opened (or reset for create).
  useEffect(() => {
    setTitle(issue?.title ?? "");
    setDescription(issue?.description ?? "");
    setSeverity((issue?.severity as IssueSeverity) ?? "low");
    setPickerOpen(false);
    setClientPickerOpen(false);
    setCommentBody("");

    // Default the create-mode client picker to the last-used client (if it's
    // still one of this business's clients), otherwise the first client.
    if (showClientPicker && clients) {
      const remembered =
        typeof window !== "undefined"
          ? window.localStorage.getItem(LAST_CLIENT_KEY)
          : null;
      const fallback = clients[0]?.user_id ?? "";
      setSelectedClientId(
        clients.some((c) => c.user_id === remembered) ? remembered! : fallback
      );
    }
  }, [issue?.id, active]);

  const status = issue ? deriveIssueStatus(issue) : "not_started";
  const meta = severityMeta(severity);
  const selectedClientName = clients?.find(
    (c) => c.user_id === selectedClientId
  )?.name;

  /** Create or save the issue from the form. */
  async function handleSubmit() {
    if (!description.trim()) {
      context.popAlert("Add a description", "Tell us what the problem is", true);
      return;
    }

    // Admins attribute the issue to the chosen client; clients log it as themselves.
    const createClientId = showClientPicker ? selectedClientId : clientId;
    if (showClientPicker && !createClientId) {
      context.popAlert("Pick a client", "Choose who this issue is for", true);
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
          client_id: createClientId,
          business_id: businessId,
          title,
          description,
          severity,
        });
        if (showClientPicker && typeof window !== "undefined") {
          window.localStorage.setItem(LAST_CLIENT_KEY, createClientId);
        }
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

  // The business pushes an issue forward; mirrors the card's workflow actions.
  const businessAction: "start" | "update" | null = !businessMode
    ? null
    : status === "not_started"
      ? "start"
      : status === "in_progress" || status === "rejected"
        ? "update"
        : null;

  /** Business workflow (edit mode header): start the work or mark it updated. */
  async function handleBusinessAction(action: "start" | "update") {
    if (!issue) return;
    try {
      action === "start"
        ? await startIssue(issue.id)
        : await markIssueUpdated(issue.id);
      context.popAlert(action === "start" ? "Marked as started" : "Marked as updated");
      onChanged();
      onClose();
    } catch {
      context.popAlert("Something went wrong", "Please try again", true);
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
      <div className="row gap-20 wrap issue-modal">
        {/* Left panel — the form */}
        <div className="col gap-10 issue-modal-form">
          <div className="between middle">
            <h3 className="accent">New feature or issue request</h3>
            {isEdit && businessAction === "start" && (
              <button
                className="row middle gap-5 outline-accent"
                onClick={() => handleBusinessAction("start")}
              >
                <Icon name="play-circle-outline" size={20} color="var(--accent)" />
                Start
              </button>
            )}
            {isEdit && businessAction === "update" && (
              <button
                className="row middle gap-5 accentButton"
                onClick={() => handleBusinessAction("update")}
              >
                <Icon name="checkmark-circle" size={20} color="var(--bkg)" />
                Mark updated
              </button>
            )}
            {isEdit && !businessMode && status === "awaiting_approval" && (
              <div className="row middle gap-5">
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
            <div className="col gap-5">
              <div className="row middle gap-5">
                <Icon name="add-circle-outline" size={14} color="var(--accent)" />
                <p>
                  <b>Created</b> {timeAgo(issue.created_at)}
                </p>
              </div>
              {status === "awaiting_approval" && (
                <div className="row middle gap-5">
                  <Icon name="checkmark-circle" size={14} color="var(--accent)" />
                  <p>
                    <b>Updated</b> {timeAgo(issue.updated_at)}
                  </p>
                </div>
              )}
              {status === "rejected" && (
                <div className="row middle gap-5">
                  <Icon name="close-circle" size={14} color="var(--dangerColor)" />
                  <p>Sent back</p>
                </div>
              )}
              {!issue.approved_at && (
                <div className="row middle gap-5">
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

          {/* Client picker — admin "log issue for" (create mode only) */}
          {showClientPicker && (
            <div className="col gap-5 relative">
              <button
                type="button"
                className="row middle gap-10 severity-picker"
                onClick={() => setClientPickerOpen((o) => !o)}
              >
                <Icon
                  name="person-circle-outline"
                  size={18}
                  color="var(--accent)"
                />
                <p>
                  <b>
                    {selectedClientId
                      ? selectedClientName || "Unnamed client"
                      : "Select a client"}
                  </b>
                </p>
              </button>
              {clientPickerOpen && (
                <div className="col boxed severity-list">
                  {clients!.map((c) => (
                    <button
                      key={c.user_id}
                      type="button"
                      className="row middle gap-10 severity-option"
                      onClick={() => {
                        setSelectedClientId(c.user_id);
                        setClientPickerOpen(false);
                      }}
                    >
                      <Icon
                        name="person-circle-outline"
                        size={18}
                        color="var(--accent)"
                      />
                      <p>
                        <b>{c.name || "Unnamed client"}</b>
                      </p>
                    </button>
                  ))}
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
          <div className="col gap-5 relative">
            <button
              type="button"
              className="row middle gap-10 severity-picker"
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
                <ContextModal x={100} y={100} onClose={() => setPickerOpen(false)}>
                  <div>
                    {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className="row middle gap-10 severity-option"
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
                </ContextModal>
                
              </div>
            )}
          </div>

          <button
            className="accentButton w-100 center middle gap-5"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Icon name="checkmark-circle" color="var(--bkg)" />
            {submitting ? "Saving…" : "Submit"}
          </button>
        </div>

        {/* Right panel — comments (edit only) */}
        {isEdit && issue && (
          <div className="col gap-10 issue-comments">
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
              className="outline-secondary w-100 center middle gap-5"
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
