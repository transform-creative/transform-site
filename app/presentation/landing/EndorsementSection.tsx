import type { ReactNode } from "react";
import { useOutletContext } from "react-router";
import type { Project, SharedContextProps } from "~/data/CommonTypes";
import { PROJECTS } from "~/data/Objects";
import { Carousel } from "../elements/Carousel";
import { EndorsementCard } from "../elements/EndorsementCard";
import WorkedWith from "./WorkedWith";
import "../../app-v2.css";
import { FiaBadge } from "../elements/FiaBadge";

interface Props {
  /** Headline above the logos. Pass JSX to highlight words with <b>. */
  header?: ReactNode;
  /** Only show endorsements from projects of these types. Omit for all. */
  types?: Project["type"][];
  /** Hide the scrolling client logo strip. */
  showLogos?: boolean;
}

const DEFAULT_HEADER = (
  <>
    We're the{" "}
    <b style={{ fontWeight: 600, color: "var(--accent)" }}>
      creative engine
    </b>{" "}
    empowering Australia’s{" "}
    <b style={{ fontWeight: 600, color: "var(--accent)" }}>
      most innovative non-profits.
    </b>
  </>
);

/******************************
 * EndorsementSection component
 * Boxed "what our clients say" block — headline, client logo strip and a
 * fading carousel of endorsements, optionally narrowed to one or more
 * project types (e.g. ["software"] for websites, ["media"] for video).
 */
export function EndorsementSection({
  header = DEFAULT_HEADER,
  types,
  showLogos = true,
}: Props) {
  const context: SharedContextProps = useOutletContext();

  const endorsed = PROJECTS.filter(
    (p) =>
      p.endorsement && (!types?.length || types.includes(p.type)),
  );

  return (
    <div className="col middle m-20 pt-20">
        <div className="row middle center mb-20">
          <FiaBadge />
        </div>
      <div className="boxed outline-accent w-75">
      

        <div className="center p-20">
          <h4
            style={{ color: "var(--txt)" }}
            className="textCenter w-100"
          >
            {header}
          </h4>
        </div>
        {showLogos && <WorkedWith />}
        {/* What our clients love */}
      </div>
    </div>
  );
}
