import { Link, useOutletContext } from "react-router";
import type { Project, SharedContextProps } from "~/data/CommonTypes";
import { PROJECTS } from "~/data/Objects";
import { projectImageAlt } from "~/business/commonBL";
import { Icon } from "../elements/Icon";
import { EndorsementCard } from "../elements/EndorsementCard";
import "../../app-v2.css";

/*
 * The body of a project, shared by the ProjectInfoPopup and its indexable
 * twin at /portfolio/:slug so the two never drift apart.
 */

interface ProjectProps {
  project: Project | undefined;
}

/******************************
 * Description prose
 */
export function ProjectDescription({ project }: ProjectProps) {
  return (
    <div style={{ maxWidth: 1200, width: "100%" }}>
      {project?.description.map((d, i) => (
        <p
          key={i}
          style={{ fontSize: "14pt", lineHeight: 1.7 }}
          className="mb2 textCenter"
        >
          {d}
        </p>
      ))}
    </div>
  );
}

/******************************
 * Image gallery
 */
export function ProjectGallery({ project }: ProjectProps) {
  const context: SharedContextProps = useOutletContext();
  if (!project?.images.length) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: context.inShrink
          ? "repeat(auto-fill, minmax(200px, 1fr))"
          : "repeat(4, 1fr)",
        gap: 12,
      }}
    >
      {project.images.map((img, idx) => (
        <div key={idx}>
          <img
            style={{ width: "100%", aspectRatio: "16 / 9" }}
            src={img}
            alt={projectImageAlt(project)}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

/******************************
 * Endorsement from the project's organisation, if one exists for this type
 */
export function ProjectEndorsement({ project }: ProjectProps) {
  const context: SharedContextProps = useOutletContext();
  const org = project?.organisation || project?.name;
  const endorsement = PROJECTS.find(
    (p) =>
      (p.organisation || p.name) === org &&
      p.type === project?.type &&
      p.endorsement,
  )?.endorsement;

  if (!endorsement || !org) return null;
  return (
    <div className="col middle center">
      <EndorsementCard
        width={context.inShrink ? "90%" : "70%"}
        text={endorsement.text}
        name={endorsement.name}
        organisation={org}
      />
    </div>
  );
}

/******************************
 * "More <type>" link through to the matching service page / portfolio filter
 */
export function ProjectMoreLink({ project }: ProjectProps) {
  return (
    <div className="row center w100" style={{ overflow: "clip" }}>
      <Link
        role="button"
        to={
          project?.type === "software"
            ? "/development"
            : `/portfolio?type=${project?.type}`
        }
        className="accentButton row center middle"
        style={{ maxWidth: 400, width: "100%" }}
      >
        <Icon name="link" className="mr2" />
        More {project?.type}
      </Link>
    </div>
  );
}
