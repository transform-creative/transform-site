import { useSearchParams } from "react-router";
import { PROJECTS } from "~/data/Objects";
import { useRef } from "react";
import { Icon } from "../elements/Icon";
import HeaderText from "../landing/HeaderText";
import { ContactTab } from "../landing/ContactTab";
import { AnimatedDots } from "../elements/AnimatedDots";
import { ScrollMoreButton } from "../elements/ScrollMoreButton";
import { AnimatedPageIcon } from "../elements/AnimatedPageIcon";
import { ProjectCarousel } from "../elements/ProjectCarousel";

export interface PortfolioProps {}

/******************************
 * Portfolio component
 * Listing page — a home-style carousel of projects with type filters.
 */
export function Portfolio({}: PortfolioProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = searchParams.get("type");
  const filterSectionRef = useRef<HTMLDivElement>(null);

  const filteredProjects = PROJECTS.filter((p) =>
    filter ? p.type == filter : true,
  );

  return (
    <div className="w100 col middle" style={{ minHeight: "100vh" }}>
      <AnimatedDots autoPlayDelay={0} />

      <div
        className="col middle center shrinkCol"
        style={{ height: "80vh" }}
      >
        <AnimatedPageIcon size={100} />
        <HeaderText
          text={["Portfolio"]}
          typingSpeed={50}
          className="mb3 mt3"
          pauseDuration={500}
          showCursor={true}
          cursorCharacter="|"
          color="var(--accent)"
          textColors={["var(--accent)"]}
          as="h1"
        />
        <div className="ml-20 mr-20">
          <p className="textCenter  w-100">
            A selection of some of our favourite work.
          </p>
        </div>
        <ScrollMoreButton
          targetRef={filterSectionRef}
          offset={100}
          label="View"
        />
      </div>
      <div className="row center w50 m3" ref={filterSectionRef}>
        <button
          className={`row middle ml2 mr3 ${
            filter == "media" && "boxedAccent"
          }`}
          onClick={() => {
            if (filter == "media") {
              setSearchParams({}, { preventScrollReset: true });
            } else {
              setSearchParams(
                { type: "media" },
                { preventScrollReset: true },
              );
            }
          }}
        >
          <Icon name="film-outline" className="mr1" />
          Media
        </button>
        <button
          className={`row middle ml2 mr3 ${
            filter == "software" && "boxedAccent p-0"
          }`}
          onClick={() => {
            if (filter == "software") {
              setSearchParams({}, { preventScrollReset: true });
            } else {
              setSearchParams(
                { type: "software" },
                { preventScrollReset: true },
              );
            }
          }}
        >
          <Icon name="code-outline" className="mr1" />
          Software
        </button>
      </div>
      <div className="m3 col middle center w-100">
        <ProjectCarousel
          key={filter || "all"}
          projects={filteredProjects}
        />
      </div>
      <div className="horizontal-line mediumFade mt-20" />
      <div
        className="col middle center"
        style={{ minHeight: "80vh" }}
      >
        <ContactTab />
      </div>
      <div className="horizontal-line mediumFade mb-20" />
    </div>
  );
}
