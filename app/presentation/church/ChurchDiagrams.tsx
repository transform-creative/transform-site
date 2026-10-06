import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { CHURCH_SERMON_OUTPUTS } from "~/data/Objects";
import { Icon } from "~/presentation/elements/Icon";
import "../../app-v2.css";

/******************************
 * SermonSpokes component
 * The sermon in the middle, with everything we make from it around it.
 */
export function SermonSpokes() {
  const context: SharedContextProps = useOutletContext();
  const outputs = [...CHURCH_SERMON_OUTPUTS];
  // The sermon takes the centre cell of the 3×3 grid.
  const cells = [...outputs.slice(0, 4), null, ...outputs.slice(4)];

  return (
    <div className="grid-3 w-100" aria-label="What we make from your sermon">
      {cells.map((cell) =>
        cell ? (
          <div
            key={cell.label}
            className="col middle center gap-5 boxed p-10 outline-secondary"
          >
            <Icon name={cell.icon} size={16} color="var(--accent)" />
            <p className="text-sm textCenter">{cell.label}</p>
          </div>
        ) : (
          <div
            key="sermon"
            className="col middle center gap-5 accent r-default p-10"
          >
            <Icon name="mic-outline" size={20} color="var(--bkg)" />
            <p className="bold textCenter">Your sermon</p>
          </div>
        ),
      )}
    </div>
  );
}

/******************************
 * HubFlow component
 * Elvanto/PCO ⇄ the sermon hub + plan a visit (on the church's subdomain)
 * ← one menu link from their current site, plus the plan-a-visit form on a
 * phone.
 */
export function HubFlow() {
  const context: SharedContextProps = useOutletContext();

  return (
    <div className="col middle gap-20 w-100">
      <div
        className={`${context.inShrink ? "col" : "row"} middle center gap-10 w-100`}
      >
        <div className="col middle center boxed p-10 outline-secondary">
          <p className="bold textCenter">Elvanto or Planning Center</p>
          <p className="text-sm muted textCenter">Your people + follow-up</p>
        </div>
        <Icon
          name={
            context.inShrink
              ? "swap-vertical-outline"
              : "swap-horizontal-outline"
          }
          size={18}
          color="var(--accent)"
        />
        <div className="col middle center accent r-default p-10">
          <p className="bold textCenter">Sermon hub + plan a visit</p>
          <p className="text-sm textCenter">visit.yourchurch.org.au</p>
        </div>
        <Icon
          name={context.inShrink ? "arrow-up" : "arrow-back"}
          size={18}
          color="var(--accent)"
        />
        <div className="col middle center boxed p-10 outline-secondary">
          <p className="bold textCenter">Your current site</p>
          <p className="text-sm muted textCenter">One menu link</p>
        </div>
      </div>

      <div className="phone-frame col gap-5" aria-label="Plan a visit form">
        <p className="bold textCenter">Plan a visit</p>
        {["Name", "Email or phone", "Which service?", "How many of you?"].map(
          (field) => (
            <p key={field} className="text-sm boxed p-5 muted">
              {field}
            </p>
          ),
        )}
        <p className="text-sm accent r-default p-5 textCenter">
          Plan my visit
        </p>
      </div>
    </div>
  );
}
