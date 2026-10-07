import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { BOARD_QA, BOARD_TIME_BACK } from "~/data/Objects";
import {
  CHURCH_PLAN,
  perPersonWeekly,
} from "~/business/churchPlanBL";
import {
  CHURCH_CTA_SOURCE,
  type ChurchCtaSource,
} from "~/data/Analytics";
import { Icon } from "~/presentation/elements/Icon";
import { SlideOutModal } from "~/presentation/elements/SlideOutModal";
import "../../app-v2.css";

interface Props {
  active: boolean;
  onClose: () => void;
  onEmail: (source: ChurchCtaSource) => void;
  /** The plan's annual total, ex GST */
  annual: number;
}

/******************************
 * BoardPopup component
 * "Taking this to your board?" — the questions a treasurer and elders will
 * ask, answered. The same answers are printed in the plan PDF.
 */
export function BoardPopup({
  active,
  onClose,
  onEmail,
  annual,
}: Props) {
  const context: SharedContextProps = useOutletContext();

  return (
    <SlideOutModal
      active={active}
      onClose={onClose}
      context={context}
      width={context.inShrink ? "min(350px, 100vw)" : 480}
    >
      <div
        className="col gap-20 p-10 scroll-y"
        style={{ maxHeight: "calc(100dvh - 80px)" }}
      >
        <div>
          <h2 className="mb-5">Taking this to your board?</h2>
          <p style={{ color: "var(--accent-lg)" }}>
            Here's what your treasurer and elders might ask.
          </p>
        </div>
        
        {BOARD_QA.map((qa) => (
          <div key={qa.question} className="col gap-5">
            <h3 className="bold">{qa.question}</h3>
            <p>{qa.answer}</p>
          </div>
        ))}
        <div className="col gap-5">
          <p>
            <strong style={{ fontWeight: 600 }}>
              If your team spends 3–4 hours a week on slides, notices
              and socials, that's four or five weeks of their year.
              This gives that time back for people and preaching.
            </strong>
            <strong style={{ fontWeight: 600 }}>
              {" "}For a church with {CHURCH_PLAN.givingMembers} giving
              members, that's {perPersonWeekly(annual)} per person,
              per week.
            </strong>
          </p>
        </div>
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
