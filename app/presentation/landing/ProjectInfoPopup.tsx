import type {
  ActivatableElement,
  Project,
  SharedContextProps,
} from "~/data/CommonTypes";

import "./landing.css";
import BasicMenu from "../elements/BasicMenu";
import { Icon } from "../elements/Icon";
import { useNavigate, useOutletContext } from "react-router";
import { MouseEvent, useRef, useState } from "react";
import ReactPlayer from "react-player";
import "../../app-v2.css";
import { EndorsementCard } from "../elements/EndorsementCard";
import { PROJECTS } from "~/data/Objects";

export interface ProjectInfoPopupProps extends ActivatableElement {
  project: Project | undefined;
}

/******************************
 * ProjectInfoPopup component
 * @todo Create description
 */
export function ProjectInfoPopup({
  active,
  project,
  onClose,
}: ProjectInfoPopupProps) {
  const context: SharedContextProps = useOutletContext();
  const navigate = useNavigate();
  const [playerMuted, setPlayerMuted] = useState(true);
  const [playerPlay, setPlayerPlay] = useState(false);
  const reactPlayer = useRef<HTMLVideoElement>(null);
  const [videoClicked, setVideoClicked] = useState(false);

  async function videoMouseOver(e: MouseEvent<HTMLVideoElement>) {
    setTimeout(() => {
      setPlayerPlay(true);
    }, 500);
  }

  async function videoMouseOff(e: MouseEvent<HTMLVideoElement>) {
    setTimeout(() => setPlayerPlay(false), 500);
  }

  async function onVideoClick(e: MouseEvent<HTMLVideoElement>) {
    e.stopPropagation();
    setPlayerMuted(false);
    if (!context.inShrink) setVideoClicked(!videoClicked);
  }

  return (
    <BasicMenu
      width={context.inShrink ? "100%" : "100vw"}
      active={active}
      onClose={() => {
        !playerMuted ? setPlayerMuted(true) : onClose();
      }}
      zIndex={100}
    >
      <div className="col middle" style={{ gap: 20 }}>
        {project?.link && (
          <div className="row middle center">
            <a
              style={{ textDecoration: "none" }}
              className="p2 accentButton row center middle"
              target="_blank"
              rel="noreferrer"
              href={project.link}
            >
              <Icon name="open-outline" className="mr2" />
              View live project
            </a>
          </div>
        )}
        <div className="col center middle mt-20 gap-10">
          <Icon
            name={
              project?.type == "media"
                ? "film-outline"
                : project?.type == "design"
                  ? "color-filter-outline"
                  : "code-outline"
            }
            className=""
            size={50}
            color="var(--accent)"
          />
          {/* Title + link */}
          <div className="col center middle ">
            <h4
              className="row middle center textCenter"
              style={{ textTransform: "capitalize" }}
            >
              {project?.name}
            </h4>
            <h3>{project?.organisation || ""}</h3>
          </div>
        </div>
        <div className="horizontal-line fade-md" />

        {project?.video && (
          <button
            className="row gap-10 middle bkg fade-md"
            style={{
              position: playerMuted ? "sticky" : "relative",
              top: 0,
              zIndex: 25,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPlayerMuted(!playerMuted);
            }}
          >
            <Icon
              name={playerMuted ? "volume-high" : "volume-mute"}
              className=""
            />
            {playerMuted ? "Unmute" : "Mute"}
          </button>
        )}
        {/* Hero video */}
        {project?.video && (
          <div
            className="w-100  col middle h-100"
            style={{
              position: !playerMuted ? "sticky" : "relative",
              top: 0,
              zIndex: 20,
            }}
          >
            <div
              style={{
                position: "absolute",
                height: !playerMuted ? "100vh" : "100%",
                zIndex: 10,
                top: 0,
                background: "#11111100",
                backdropFilter: "blur(10px)",
              }}
              className="w-100 h-100"
            />
            <div
              className="boxed"
              style={{
                boxShadow: playerMuted
                  ? undefined
                  : "0 0 0px 2px var(--accent)",
                maxWidth: context.inShrink ? 800 : "60%",
                width: "100%",
                overflow: "hidden",
                zIndex: 20,

                aspectRatio: "16 / 9",
              }}
            >
              <ReactPlayer
                ref={reactPlayer}
                src={project.video}
                onMouseOver={(e) => videoMouseOver(e)}
                onMouseOut={(e) => videoMouseOff(e)}
                onClick={(e) => onVideoClick(e)}
                muted={playerMuted}
                loop
                style={
                  videoClicked
                    ? {
                        width: "80vw",
                        height: "80vh",
                        objectFit: "cover",
                        cursor: "pointer",
                        position: "fixed",
                        top: "10vh",
                        left: "10vw",
                        zIndex: 100,
                        borderRadius: "var(--borderRadius)",
                      }
                    : {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        cursor: "pointer",
                      }
                }
                playing={true}
              />
            </div>
          </div>
        )}
        {context.inShrink && (
          <div className="horizontal-line fade-md" />
        )}
        {/* Description prose */}
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
        <div className="horizontal-line fade-md" />
        {/* Image gallery */}
        {project?.images && project.images.length > 0 && (
          <div
            className=""
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
                />
              </div>
            ))}
          </div>
        )}
        <div className="horizontal-line fade-md" />

        {/* Endorsement */}
        <div>
          <div className="col middle center">
            {(() => {
              const org = project?.organisation || project?.name;
              const endorsement = PROJECTS.find(
                (p) =>
                  (p.organisation || p.name) === org &&
                  p.type === project?.type &&
                  p.endorsement,
              )?.endorsement;
              return endorsement && org ? (
                <EndorsementCard
                  width={context.inShrink ? "90%" : "70%"}
                  text={endorsement.text}
                  name={endorsement.name}
                  organisation={org}
                />
              ) : null;
            })()}
          </div>
        </div>

        {/* More CTA */}
        <div className="row center w100" style={{ overflow: "clip" }}>
          <a
            role="button"
            href={
              project?.type === "software"
                ? "/development"
                : `/Portfolio?type=${project?.type}`
            }
            className="accentButton row center middle"
            style={{ maxWidth: 400, width: "100%" }}
          >
            <Icon name="link" className="mr2" />
            More {project?.type}
          </a>
        </div>
      </div>
    </BasicMenu>
  );
}
