import { useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import BasicMenu from "./BasicMenu";
import { LabelInput } from "./LabelInput/LabelInput";
import { Icon } from "./Icon";
import "../../app-v2.css";

interface CommentPopupProps {
  active: boolean;
  onClose: () => void;
  // Receives the trimmed comment body. May be empty when `required` is false —
  // the caller decides whether to skip posting an empty comment.
  onSubmit: (body: string) => void;
  submitting: boolean;
  // When true the comment is mandatory: submit stays disabled until something is
  // typed and the popup can't be dismissed by clicking off (used for rejections).
  required?: boolean;
  title?: string;
  prompt?: string;
  confirmLabel?: string;
}

/******************************
 * CommentPopup — a small BasicMenu dialog that prompts for a comment before a
 * status change (admin "Finish" → explain the fix; client "Reject" → explain
 * what's still wrong). Reuses the same textarea + comment pattern as IssueModal.
 */
export default function CommentPopup({
  active,
  onClose,
  onSubmit,
  submitting,
  required = false,
  title = "Add a comment",
  prompt,
  confirmLabel = "Submit",
}: CommentPopupProps) {
  const context: SharedContextProps = useOutletContext();
  const [body, setBody] = useState("");

  function handleClose() {
    setBody("");
    onClose();
  }

  function handleSubmit() {
    onSubmit(body.trim());
    setBody("");
  }

  const blocked = submitting || (required && !body.trim());

  return (
    <BasicMenu
      active={active}
      onClose={handleClose}
      width={context.inShrink ? "95%" : 420}
      disableClickOff={true}
      icon={{ name: "chatbox-ellipses-outline", color: "var(--accent)", size: 60 }}
    >
      <div className="col gap-10">
        <h2 className="center">{title}</h2>
        {prompt && <p className="center mb-10">{prompt}</p>}
        <LabelInput
          name=""
          inlineLabel
          placeholder="Your comment here"
          value={body}
          isTextArea
          autoFocus
          style={{ minHeight: 90 }}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          className={`w-100 row center middle gap-5 ${blocked ? "lightButton" : "accent"}`}
          onClick={handleSubmit}
          disabled={blocked}
        >
          <Icon name="checkmark-circle" color="var(--bkg)" />
          {submitting ? "Submitting…" : confirmLabel}
        </button>
      </div>
    </BasicMenu>
  );
}
