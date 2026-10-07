import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { CONTACT } from "~/data/Objects";
import {
  CHURCH_ACTION,
  logChurchActivity,
  type ChurchCtaSource,
} from "~/data/Analytics";
import { Icon } from "~/presentation/elements/Icon";
import "../../app-v2.css";

interface Props {
  /** Which button on the page this is, for the book_chat.click event */
  source: ChurchCtaSource;
  /** Light text + outline, for use on an accent background */
  onAccent?: boolean;
  /** Solid white fill with accent text */
  white?: boolean;
  className?: string;
}

/******************************
 * BookChatButton component
 * The secondary "Book a chat" call to action on /church. Opens the booking
 * calendar and logs which button was used.
 */
export function BookChatButton({
  source,
  onAccent,
  white,
  className = "",
}: Props) {
  const context: SharedContextProps = useOutletContext();
  const color = onAccent && !white ? "var(--bkg)" : "var(--accent)";
  const variant = white
    ? "fill-white"
    : onAccent
      ? "outline-bkg"
      : "outline-secondary";

  return (
    <a
      role="button"
      className={`${variant} row middle center gap-5 ${className}`}
      style={white ? undefined : { color, background: "none" }}
      href={CONTACT.bookingUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() =>
        logChurchActivity(CHURCH_ACTION.BOOK_CHAT_CLICK, { source })
      }
    >
      <Icon name="calendar-outline" size={16} color={color} />
      Book a chat
    </a>
  );
}
