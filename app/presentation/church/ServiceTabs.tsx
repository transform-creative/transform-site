import { useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type {
  ChurchService,
  SharedContextProps,
} from "~/data/CommonTypes";
import { boldPhrases } from "~/business/commonBL";
import { Icon } from "~/presentation/elements/Icon";
import "../../app-v2.css";

interface Props {
  services: ChurchService[];
  /** Opens a plan builder group from a tab's "Price this" link */
  onPrice: (group: NonNullable<ChurchService["group"]>) => void;
}

/******************************
 * ServiceTabs component
 * The /church "We help churches by..." section: a vertical list of tabs on
 * the left, with the selected one's photo and description in a card beside it.
 */
export function ServiceTabs({ services, onPrice }: Props) {
  const context: SharedContextProps = useOutletContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const panel = useRef<HTMLDivElement>(null);

  const service = services[activeIndex];

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-tab-content]",
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power3" },
      );
    },
    { scope: panel, dependencies: [activeIndex] },
  );

  return (
    <section className="col middle  gap-20 w-75 shrink-p-10 border-box mt-20 mb-20 pt-20 pb-20">
      <h2 className="textCenter mb-20" style={{ letterSpacing: -1.5 }}>
        We help churches like yours by...
      </h2>

      <div className="row shrink-col middle gap-40 w-100">
        <div
          role="tablist"
          aria-orientation="vertical"
          className="col gap-20 w-50"
        >
          {services.map((tab, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`service-tab-${tab.id}`}
                aria-selected={active}
                aria-controls="service-panel"
                className={`text-button text-xl ${
                  context.inShrink ? "textCenter" : "textRight"
                } ${active ? "accent-text bold" : "muted"}`}
                style={{ fontWeight: 300 }}
                onClick={() => setActiveIndex(i)}
              >
                <strong style={{fontWeight: 600}}>{tab.verb}</strong>{" "}
                {tab.rest}
              </button>
            );
          })}
        </div>

        <div
          ref={panel}
          role="tabpanel"
          id="service-panel"
          aria-labelledby={`service-tab-${service.id}`}
          className="col gap-10 accent boxed p-10 w-50 border-box"
        >
          <div data-tab-content>
            {service.image ? (
              <img
                src={service.image}
                alt=""
                className="media-16-9 media-cover r-default w-100"
              />
            ) : (
              // TODO: real Sunday photos (set image). No stock photos.
              <div
                className="placeholder-box media-16-9 col middle center gap-5 border-box w-100"
                style={{ borderColor: "var(--bkg)" }}
              >
                <Icon name="images-outline" size={20} color="var(--bkg)" />
                <p className="text-sm textCenter">Photo placeholder</p>
              </div>
            )}
          </div>
          <div
            data-tab-content
            className={`col gap-10 r-default p-5 border-box ${
              context.inShrink ? "middle textCenter" : ""
            }`}
          >
            <p>{boldPhrases(service.body, service.highlights)}</p>
            {service.group && (
              <button
                type="button"
                className="boxed p-10 p0 row middle gap-5 w-fit"
                onClick={() => onPrice(service.group!)}
              >
                Add to your plan
                <Icon name="arrow-forward" size={14} color="var(--bkg)" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
