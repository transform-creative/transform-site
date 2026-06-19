import { useOutletContext } from "react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SharedContextProps } from "~/data/CommonTypes";
import type { IoniconName } from "~/data/Ionicons";
import { Icon } from "~/presentation/elements/Icon";
import BasicMenu from "~/presentation/elements/BasicMenu";
import type { Feature } from "./FeatureSelector";
import "../../app-v2.css";
import { CONTACT } from "~/data/Objects";

interface Props {
  active: boolean;
  feature: Feature | null;
  index: number | null;
  total: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

// Solid (non-outline) variant of an icon name, for the accent tile.
const solid = (name: IoniconName) =>
  name.split("-outline")[0] as IoniconName;

export default function FeatureInfo({
  active,
  feature,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: Props) {
  const context: SharedContextProps = useOutletContext();

  // Retain the last feature (and its position) shown so the menu doesn't
  // collapse / blank out mid-close animation when the parent clears its
  // selection.
  const [shown, setShown] = useState<Feature | null>(feature);
  const [position, setPosition] = useState({ index: index ?? 0, total });
  useEffect(() => {
    if (feature) {
      setShown(feature);
      setPosition({ index: index ?? 0, total });
    }
  }, [feature, index, total]);

  // Animate the modal height as the content (varying text length) changes by
  // tracking the inner content's natural height and transitioning to it.
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => setHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <BasicMenu
      active={active}
      onClose={onClose}
      disableClickOff={false}
      width={context.inShrink ? "95%" : 560}
      zIndex={120}
    >
      <div
        style={{
          height,
          overflow: "hidden",
          transition: "height 0.3s ease",
        }}
      >
        <div ref={innerRef}>
          {shown && (
            <div className="col middle center gap-20 fade-sm">
             
              <div className="center middle">
                <Icon
                  name={solid(shown.icon.name)}
                  size={50}
                  color="var(--accent) !important"
                />
              </div>

              <h4
                style={{ color: "var(--txt)" }}
                className="center m0 accent pl-20 pr-20"
              >
                {shown.text}
              </h4>
              <div style={{ maxWidth: 460, width: "100%" }}>
                {shown.description.map((para, i) => (
                  <p
                    style={{ color: "var(--accent-lg)" }}
                    key={i}
                    className="center mb-10"
                  >
                    {para}
                  </p>
                ))}
              </div>

              {shown.component || null}
            <p
                className="m0"
                style={{ color: "var(--accent-lg)", letterSpacing: "0.05em" }}
              >
                <b style={{fontWeight: 600}}>{position.index + 1} / {position.total}</b> 
              </p>
              <div className="mb-20 pb-20 " />
            </div>
          )}
          {(onPrev || onNext) && (
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                zIndex: 100,
              }}
              className="w-100"
            >
              <div className="row middle center gap-10  p-10 pl-20 pr-20 mb-10">
                <button
                  className="outline-secondary p-10 row middle gap-5 center"
                  style={{
                    background: "none",
                    color: "var(--txt)",
                  }}
                  disabled={!hasPrev}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev?.();
                  }}
                >
                  <Icon
                    name="arrow-back"
                    size={14}
                    color="var(--accent)"
                  />
                  
                </button>
                   <div className="row gap-10">
                <a
                  className="accent p-10"
                  role="button"
                  href={`https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2neXINmRa2l8cPxCMY8-FrrTt30-Tpwfj7-zqktFODuuJO9Z_wsSfv2wcNkiFvipiOl58trJuc`}
                target="_blank"
                >
                  Book a call
                </a>
                <a
                  className="outline-accent p-10"
                  style={{
                    background: "var(--bkg)",
                    color: "var(--accent)",
                  }}
                  role="button"
                  href={`mailto:${CONTACT.email}`}
                >
                  Email us
                </a>
              </div>
                <button
                  className="outline-secondary p-10 row gap-5 center"
                  style={{
                    background: "none",
                    color: "var(--txt)",
                  }}
                  disabled={!hasNext}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext?.();
                  }}
                >
                  
                  <Icon
                    name="arrow-forward"
                    size={14}
                    color="var(--accent)"
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="pb-20"/>
    </BasicMenu>
  );
}
