import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { BOARD_QA } from "~/data/Objects";
import { CHURCH_CTA_SOURCE, type ChurchCtaSource } from "~/data/Analytics";
import { Icon } from "~/presentation/elements/Icon";
import { SlideOutModal } from "~/presentation/elements/SlideOutModal";
import "../../app-v2.css";

interface Props {
  active: boolean;
  onClose: () => void;
  onEmail: (source: ChurchCtaSource) => void;
}

/******************************
 * BoardPopup component
 * "Taking this to your board?" — the questions a treasurer and elders will
 * ask, answered. The same answers are printed in the plan PDF.
 */
export function BoardPopup({ active, onClose, onEmail }: Props) {
  const context: SharedContextProps = useOutletContext();

  return (
    <SlideOutModal
      active={active}
      onClose={onClose}
      context={context}
      width={context.inShrink ? "100vw" : 480}
      title="Taking this to your board?"
    >
      <div
        className="col gap-20 p-10 scroll-y"
        style={{ maxHeight: "calc(100dvh - 80px)" }}
      >
        <p>Here's what your treasurer and elders will probably ask.</p>
        {BOARD_QA.map((qa) => (
          <div key={qa.question} className="col gap-5">
            <h3 className="bold">{qa.question}</h3>
            <p>{qa.answer}</p>
          </div>
        ))}
        <div className="row gap-10 shrink-col">
          <button
            type="button"
            className="accent row middle center gap-5 w-100"
            onClick={() => onEmail(CHURCH_CTA_SOURCE.BOARD_POPUP)}
          >
            <Icon name="mail-outline" size={16} color="var(--bkg)" />
            Email me this plan
          </button>
          <button
            type="button"
            className="outline-secondary w-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </SlideOutModal>
  );
}
