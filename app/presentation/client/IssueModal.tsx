import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type {
  Business,
  ClientIssue,
  IssueSeverity,
  IssueType,
} from "~/data/CustomTypes";
import {
  deriveIssueStatus,
  issueActionPatch,
  ISSUE_TYPE_OPTIONS,
  severityColor,
  severityMeta,
  SEVERITY_OPTIONS,
  timeAgo,
} from "~/business/commonBL";
import { createIssue, createIssueComment } from "~/database/Create";
import { updateIssue } from "~/database/Update";
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
  // The viewer's org id, stamped onto issues they log themselves so the issue
  // shows on their org's shared board. Admins resolve the chosen client's org
  // instead (see handleSubmit). Null when the viewer has no org.
  clientBusinessId?: number | null;
  // When present (admin/business board) the create form shows an organisation
  // picker so the issue is attributed to one of the board's orgs (its
  // client_business_id) rather than an individual client.
  organisations?: Pick<Business, "id" | "name">[];
  // Business board: drives the start → mark-updated workflow rather than the
  // client's approve / reject decision.
  businessMode?: boolean;
  focusComments?: boolean; // edit opened via the comments button
  // Pre-select a severity level when opening the modal in create mode.
  defaultSeverity?: IssueSeverity;
  onClose: () => void;
  onChanged: () => void; // tell the portal to refetch
}

// Remembers the admin's last "log issue for" organisation across sessions.
const LAST_ORG_KEY = "transform.lastIssueOrgId";

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
  clientBusinessId = null,
  organisations,
  businessMode = false,
  focusComments = false,
  defaultSeverity,
  onClose,
  onChanged,
}: IssueModalProps) {
  const context: SharedContextProps = useOutletContext();

  // Freeze the last non-null issue so the right panel (comments) stays visible
  // during the exit animation. The parent clears `issue` at the same time as
  // `active` → false, which would otherwise instantly collapse the panel.
  const frozenIssueRef = useRef<ClientIssue | null>(null);
  if (active && issue !== null) {
    frozenIssueRef.current = issue;
  } else if (active && issue === null) {
    // Entering create mode — reset so a prior edit session doesn't leak through.
    frozenIssueRef.current = null;
  }
  const displayIssue =
    issue ?? (!active ? frozenIssueRef.current : null);
  const isEdit = !!displayIssue;
  // Admins choose which organisation an issue is for — both when logging a new
  // one and when correcting a misattributed existing one.
  const showOrgPicker = !!organisations;

  const [issueType, setIssueType] = useState<IssueType>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moreInfo, setMoreInfo] = useState("");
  const [severity, setSeverity] = useState<IssueSeverity>("low");
  // Admin-only: skip the AI auto-fix for this issue. Defaults on for admins —
  // the work is handled by a human unless they opt the AI in. (Hidden + ignored
  // for clients; the `ai_*` columns are admin/service-role writable only.)
  const [skipAi, setSkipAi] = useState(businessMode);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Viewport coords the severity pop-over anchors to (set from the trigger).
  const [pickerCoords, setPickerCoords] = useState({ x: 0, y: 0 });
  const [submitting, setSubmitting] = useState(false);

  // The organisation a new issue is logged for (admin only), defaulting to the
  // last selection cached in localStorage.
  const [selectedOrgId, setSelectedOrgId] = useState<number | "">("");
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Seed the form whenever a different issue is opened (or reset for create).
  useEffect(() => {
    setIssueType((issue?.issue_type as IssueType) ?? "bug");
    setTitle(issue?.title ?? "");
    setDescription(issue?.description ?? "");
    setMoreInfo(issue?.more_info ?? "");
    setSeverity(
      (issue?.severity as IssueSeverity) ?? defaultSeverity ?? "low",
    );
    // Edit mode reflects the stored state; create mode defaults on for admins.
    setSkipAi(issue ? issue.ai_status === "skipped" : businessMode);
    setPickerOpen(false);
    setOrgPickerOpen(false);
    setCommentBody("");

    // Seed the org picker: edit mode reflects the issue's current org; create
    // mode defaults to the last-used org (if it's still one of this board's
    // orgs), otherwise the first org.
    if (showOrgPicker && organisations) {
      if (issue) {
        setSelectedOrgId(
          issue.client_business_id ?? organisations[0]?.id ?? "",
        );
      } else {
        const remembered =
          typeof window !== "undefined"
            ? Number(window.localStorage.getItem(LAST_ORG_KEY))
            : NaN;
        const fallback = organisations[0]?.id ?? "";
        setSelectedOrgId(
          organisations.some((o) => o.id === remembered)
            ? remembered
            : fallback,
        );
      }
    }
  }, [issue?.id, active]);

  // In edit mode, only allow saving once a field actually differs.
  const isDirty =
    !isEdit ||
    issueType !== ((issue?.issue_type as IssueType) ?? "bug") ||
    title !== (issue?.title ?? "") ||
    description !== (issue?.description ?? "") ||
    moreInfo !== (issue?.more_info ?? "") ||
    severity !== ((issue?.severity as IssueSeverity) ?? "low") ||
    (showOrgPicker && selectedOrgId !== (issue?.client_business_id ?? "")) ||
    (businessMode && skipAi !== (issue?.ai_status === "skipped"));

  const status = displayIssue
    ? deriveIssueStatus(displayIssue)
    : "not_started";
  const meta = severityMeta(severity);
  const selectedOrg = organisations?.find(
    (o) => o.id === selectedOrgId,
  );
  const selectedOrgName = selectedOrg?.name ?? undefined;

  /** Create or save the issue from the form. */
  async function handleSubmit() {
    if (!description.trim()) {
      context.popAlert(
        "Add a description",
        "Tell us what the problem is",
        true,
      );
      return;
    }

    // Admins must pick the organisation the issue belongs to.
    if (showOrgPicker && !selectedOrgId) {
      context.popAlert(
        "Pick an organisation",
        "Choose which organisation this issue is for",
        true,
      );
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit && issue) {
        // Admins can toggle the AI skip; only patch `ai_status` when it actually
        // changes so we never clobber an in-flight run (queued / processing /
        // pr_open) by re-saving an unrelated field edit.
        const aiPatch =
          businessMode && skipAi !== (issue.ai_status === "skipped")
            ? {
                ai_status: skipAi ? "skipped" : null,
                ai_error: skipAi ? "Skipped by admin" : null,
              }
            : {};
        await updateIssue(issue.id, {
          issue_type: issueType,
          title,
          description,
          more_info: moreInfo,
          severity,
          // Admins can re-attribute the issue to the correct org.
          ...(showOrgPicker
            ? { client_business_id: selectedOrgId as number }
            : {}),
          ...aiPatch,
        });
        context.popAlert("Issue updated");
        onChanged();
        onClose();
      } else {
        // The org the issue belongs to (drives the shared client board). Admins
        // pick it directly; clients log it against their own org. The reporter
        // (client_id) is always the posting viewer.
        const resolvedClientBusinessId = showOrgPicker
          ? (selectedOrgId as number)
          : clientBusinessId;
        await createIssue({
          client_id: clientId,
          business_id: businessId,
          client_business_id: resolvedClientBusinessId,
          issue_type: issueType,
          title,
          description,
          more_info: moreInfo,
          severity,
          // Pre-skip the pipeline when an admin opts out (the dispatch-issue
          // edge function honours an inserted `ai_status = 'skipped'`).
          ...(businessMode && skipAi
            ? { ai_status: "skipped", ai_error: "Skipped by admin" }
            : {}),
        });
        if (showOrgPicker && typeof window !== "undefined") {
          window.localStorage.setItem(
            LAST_ORG_KEY,
            String(selectedOrgId),
          );
        }
        context.popAlert("Issue logged", "We'll take a look shortly");
        onChanged();
        onClose();
      }
    } catch {
      context.popAlert(
        "Could not save your issue",
        "Please try again",
        true,
      );
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

  // The business can approve on the client's behalf once the work is awaiting
  // approval and the client hasn't actioned it.
  const showAdminApprove =
    businessMode && status === "awaiting_approval";

  /**
   * Business workflow (edit mode header): start the work, mark it updated, or
   * approve a pending update on the client's behalf.
   */
  async function handleBusinessAction(
    action: "start" | "update" | "approve",
  ) {
    if (!issue) return;
    try {
      await updateIssue(issue.id, issueActionPatch(action));
      context.popAlert(
        action === "start"
          ? "Marked as started"
          : action === "update"
            ? "Marked as updated"
            : "Approved",
      );
      onChanged();
      onClose();
    } catch {
      context.popAlert(
        "Something went wrong",
        "Please try again",
        true,
      );
    }
  }

  /** Approve / reject the pending update (edit mode header). */
  async function handleDecision(decision: "approve" | "reject") {
    if (!issue) return;
    try {
      await updateIssue(issue.id, issueActionPatch(decision));
      context.popAlert(
        decision === "approve" ? "Approved" : "Sent back",
      );
      onChanged();
      onClose();
    } catch {
      context.popAlert(
        "Something went wrong",
        "Please try again",
        true,
      );
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
      context.popAlert(
        "Could not post your comment",
        "Please try again",
        true,
      );
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
            {!!displayIssue || (
              <h2 className="accent">New request</h2>
            )}
            {isEdit && businessAction === "start" && (
              <button
                className="row middle gap-5 outline-accent"
                onClick={() => handleBusinessAction("start")}
              >
                <Icon
                  name="play-circle-outline"
                  size={20}
                  color="var(--accent)"
                />
                Start
              </button>
            )}
            {isEdit && businessAction === "update" && (
              <button
                className="row middle gap-5 outline-accent"
                onClick={() => handleBusinessAction("update")}
              >
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color="var(--accent)"
                />
                Finish
              </button>
            )}
              <div className="row middle gap-5">
              {displayIssue && (
                <p style={{ color: "var(--accent-lg)" }}>
                  {timeAgo(displayIssue?.created_at || new Date())}
                </p>
              )}
            </div>
            {isEdit &&
              !businessMode &&
              status === "awaiting_approval" && (
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
          
            {isEdit && showAdminApprove && (
              <button
                className="row middle gap-5 outline-accent"
                onClick={() => handleBusinessAction("approve")}
                title="Approve on the client's behalf"
              >
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color="var(--accent)"
                />
                Approve now
              </button>
            )}
          </div>

          {/* Issue type — bug / issue / question. `question` is triage-only
              and never reaches the AI auto-fix pipeline. */}
          <div className="row gap-5">
            {ISSUE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`row middle center gap-5 w-100 ${
                  issueType === opt.value
                    ? "accentButton"
                    : "outline-accent"
                }`}
                onClick={() => setIssueType(opt.value)}
              >
                <Icon
                  name={opt.icon}
                  size={16}
                  color={
                    issueType === opt.value
                      ? "var(--bkg)"
                      : "var(--accent)"
                  }
                />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Edit-only metadata */}
          {isEdit && displayIssue && (
            <div className="col gap-5">
              {status === "awaiting_approval" && (
                <div className="row middle gap-5">
                  <Icon
                    name="checkmark-circle"
                    size={14}
                    color="var(--accent)"
                  />
                  <p>
                    <b>Updated</b> {timeAgo(displayIssue.updated_at)}
                  </p>
                </div>
              )}
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
              {status === "awaiting_approval" && (
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

          {/* Organisation picker — admins set / correct the issue's org */}
          {showOrgPicker && (
            <div className="col gap-5 relative">
              <button
                type="button"
                className="row middle gap-10 severity-picker"
                onClick={() => setOrgPickerOpen((o) => !o)}
              >
                <Icon
                  name="business-outline"
                  size={18}
                  color="var(--accent)"
                />
                <p>
                  <b>
                    {selectedOrgId
                      ? selectedOrgName || "Unnamed organisation"
                      : "Select an organisation"}
                  </b>
                </p>
              </button>
              {orgPickerOpen && (
                <div className="col boxed severity-list">
                  {organisations!.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="row middle gap-10 severity-option"
                      onClick={() => {
                        setSelectedOrgId(o.id);
                        setOrgPickerOpen(false);
                      }}
                    >
                      <Icon
                        name="business-outline"
                        size={18}
                        color="var(--accent)"
                      />
                      <p>
                        <b>{o.name || "Unnamed organisation"}</b>
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
            placeholder="Reason"
            value={description}
            isTextArea
            style={{ minHeight: 110 }}
            onChange={(e) => setDescription(e.target.value)}
          />
          <LabelInput
            name="More info"
            placeholder="Error messages, links, or anything else that helps"
            value={moreInfo}
            isTextArea
            style={{ minHeight: 70 }}
            onChange={(e) => setMoreInfo(e.target.value)}
          />

          {/* Severity picker */}
          <div className="col gap-5">
            <button
              type="button"
              className="row middle gap-10 severity-picker"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPickerCoords({ x: rect.left, y: rect.bottom });
                setPickerOpen((o) => !o);
              }}
            >
              <div
                className="severity-swatch"
                style={{ background: severityColor(severity) }}
              />
              <p>
                <b>{meta.label}</b> . {meta.description}
              </p>
            </button>
            <ContextModal
              active={pickerOpen}
              x={pickerCoords.x}
              y={pickerCoords.y}
              width={320}
              onClose={() => setPickerOpen(false)}
            >
              <div className="col">
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="row middle gap-10 severity-option m-5"
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

          {/* Admin-only: skip the AI auto-fix for this issue */}
          {businessMode && (
            <label className="row middle gap-10 clickable">
              <input
                type="checkbox"
                style={{width: 20, height: 20}}
                checked={skipAi}
                onChange={(e) => setSkipAi(e.target.checked)}
              />
              <p>Skip AI completion</p>
            </label>
          )}

          <button
            className="accentButton w-100 center middle gap-5"
            onClick={handleSubmit}
            disabled={submitting || !isDirty}
          >
            <Icon name="checkmark-circle" color="var(--bkg)" />
            {submitting ? "Saving…" : isEdit ? "Update" : "Submit"}
          </button>
        </div>

        {/* Right panel — comments (edit only) */}
        {isEdit && displayIssue && (
          <div className="col gap-10 issue-comments">
            {displayIssue.issue_comments.length === 0 ? (
              <p className="accent-text">No comments yet</p>
            ) : (
              displayIssue.issue_comments.map((comment) => (
                <div key={comment.id} className="col comment-card">
                  <p style={{ color: "var(--accent-lg)" }}>
                    <b
                      style={
                        comment.author_user_id === clientId
                          ? { color: "var(--accent)" }
                          : { color: "var(--txt)" }
                      }
                    >
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
