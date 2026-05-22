import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router";
import ReactPlayer from "react-player";
import type { Project, SharedContextProps } from "~/data/CommonTypes";
import { projectToIcon } from "~/business/commonBL";
import { Carousel } from "./Carousel";
import { Icon } from "./Icon";
import { ProjectInfoPopup } from "../landing/ProjectInfoPopup";

export interface ProjectCarouselProps {
  projects: Project[];
}

/******************************
 * ProjectCarousel component
 * Home-style draggable, autoplaying carousel of portfolio projects.
 * Projects with a video play it inline on hover; clicking any card opens
 * the info popup and deep-links it via the ?project=<id> query param.
 */
export function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const context: SharedContextProps = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoveredImage, setHoveredImage] = useState<number>();
  const [playingId, setPlayingId] = useState<number>();
  const [selectedProject, setSelectedProject] = useState<Project>();
  const [viewProjectActive, setViewProjectActive] = useState(false);

  /******************************
   * Deep link — open the popup if the URL carries ?project=<id>
   */
  useEffect(() => {
    const id = searchParams.get("project");
    if (!id) return;
    const match = projects.find((p) => p.id == parseInt(id));
    if (match) {
      setSelectedProject(match);
      setViewProjectActive(true);
    }
  }, []);

  /******************************
   * Open a project's info popup and reflect it in the URL
   */
  function openProject(project: Project) {
    setSelectedProject(project);
    setViewProjectActive(true);
    const next = new URLSearchParams(searchParams);
    next.set("project", String(project.id));
    setSearchParams(next, { preventScrollReset: true });
  }

  /******************************
   * Close the popup and drop ?project= (keeping any other params)
   */
  function closeProject() {
    setViewProjectActive(false);
    setTimeout(() => setSelectedProject(undefined), 300);
    const next = new URLSearchParams(searchParams);
    next.delete("project");
    setSearchParams(next, { preventScrollReset: true });
  }

  return (
    <>
      <Carousel
        interval={3}
        showArrows
        autoplay
        snapOffset={20}
        width={100}
        centerFocused
        resistance={projects.length * 10000}
      >
        {projects.map((project, idx) => {
          const hovered = hoveredImage == project.id;
          return (
            <div
              key={`${project.id} - ${idx}`}
              className="gap-20"
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredImage(project.id)}
              onMouseLeave={() => {
                setHoveredImage(undefined);
                setPlayingId(undefined);
              }}
              onClick={() => openProject(project)}
            >
              {project.video ? (
                <>
                  {/* Video card — cover image shows until the video plays */}
                  <div
                    style={{
                      position: "relative",
                      height: context.inShrink ? 200 : 500,
                      aspectRatio: "16 / 9",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={project.images[0]}
                      alt={`image of ${project.name} - a piece of digital content created by transform creative australia`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {hovered && (
                      <ReactPlayer
                        src={project.video}
                        muted
                        loop
                        playing
                        onPlay={() => setPlayingId(project.id)}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: playingId === project.id ? 1 : 0,
                          transition: "opacity 0.3s ease",
                        }}
                      />
                    )}
                  </div>
                  {hovered && (
                    <div
                      className="row middle mediumFade"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        gap: 8,
                        padding: "8px 14px",
                        background: "var(--accent)",
                        zIndex: 20,
                      }}
                    >
                      <Icon
                        name={projectToIcon(project.type)}
                        color="#eeeeee"
                      />
                      <h3 style={{ margin: 0, color: "#eeeeee" }}>
                        {project.organisation} | {project.name}
                      </h3>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Image-only card — HomeRoute hover overlay */}
                  {hovered && (
                    <div>
                      <h3
                        style={{ zIndex: 20, color: "#eeeeee" }}
                        className="overlayDiv mediumFade"
                      >
                        <Icon
                          name={projectToIcon(project.type)}
                          color="#eeeeee"
                          className="mr2"
                        />
                        {project.name}
                      </h3>
                      <div
                        className="overlayDiv"
                        style={{
                          opacity: 0.6,
                          zIndex: 10,
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                  )}
                  <img
                    className="gallery-image"
                    style={{
                      filter: hovered ? "contrast(0.8)" : "none",
                    }}
                    src={project.images[0]}
                    alt={`image of ${project.name} - a piece of digital content created by transform creative australia`}
                  />
                </>
              )}
            </div>
          );
        })}
      </Carousel>
      <ProjectInfoPopup
        active={viewProjectActive}
        project={selectedProject}
        onClose={closeProject}
      />
    </>
  );
}
