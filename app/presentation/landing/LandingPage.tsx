import { Project, type SharedContextProps } from "~/data/CommonTypes";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router";
import { Icon } from "../elements/Icon";
import { DesignTab } from "./DesignTab";
import { MediaTab } from "./MediaTab";
import { SoftwareTab } from "./SoftwareTab";
import { ContactTab } from "./ContactTab";
import { ProjectInfoPopup } from "./ProjectInfoPopup";
import { useEffect, useRef, useState } from "react";
import { PROJECTS } from "~/data/Objects";
import { useGSAP } from "@gsap/react";
import { SplitText, ScrollTrigger } from "gsap/all";
import gsap from "gsap";
import HeaderText from "./HeaderText";
import WorkedWith from "./WorkedWith";
import { Carousel } from "../elements/Carousel";
import { projectToIcon } from "~/business/commonBL";
import { AnimatedDots } from "../elements/AnimatedDots";
import { EndorsementCard } from "../elements/EndorsementCard";

export interface LandingPageProps {}

/******************************
 * LandingPage component
 * @todo Create description
 */
export function LandingPage({}: LandingPageProps) {
  const context: SharedContextProps = useOutletContext();
  const [selectedProject, setSelectedProject] = useState<Project>();
  const [viewProjectActive, setViewProjectActive] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoveredImage, setHoveredImage] = useState<number>();

  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  gsap.registerPlugin(SplitText, ScrollTrigger);

  useEffect(() => {
    if (searchParams.get("project")) {
      setSelectedProject(
        PROJECTS.find(
          (p) => p.id == parseInt(searchParams.get("project") || ""),
        ),
      );
      setViewProjectActive(true);
    }
  }, []);

  /*******************************************************
   * GSAP
   */
  useGSAP(() => {
    let tl = gsap.timeline();
    const videoEl = videoRef.current;
    const hero = heroRef.current;
    document.fonts.ready.then(() => {
      const titleSplit = SplitText.create("#title", {
        type: "words",
      });

      tl.to("#title", { opacity: 1 }, 1.5).fromTo(
        titleSplit.words,
        {
          opacity: 0,
          y: -10,
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
        },
        "-=2",
      );
    });

    tl.to(
      ".lateFade",
      { opacity: 1, duration: 3, ease: "power3" },
      0.5,
    ).fromTo(
      ".endorsementSection",
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      3,
    );

    if (!videoEl || !hero) return;

    // Browsers ignore currentTime writes while a seek is in flight, so
    // coalesce: always seek to the latest scroll position, but only once
    // the previous seek has finished. Avoids a backlog of stale seeks.
    let targetTime = 0;
    let isSeeking = false;

    const seek = () => {
      if (isSeeking) return;
      if (Math.abs(videoEl.currentTime - targetTime) < 0.001) return;
      isSeeking = true;
      videoEl.currentTime = targetTime;
    };

    videoEl.addEventListener("seeked", () => {
      isSeeking = false;
      seek(); // catch up to wherever the scroll is now
    });

    const setupScrub = () => {
      videoEl.pause();
      ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: "+=800",
        scrub: true,
        onUpdate: (self) => {
          targetTime = self.progress * videoEl.duration;
          seek();
        },
      });
    };

    if (videoEl.readyState >= 1) {
      setupScrub();
    } else {
      videoEl.addEventListener("loadedmetadata", setupScrub, {
        once: true,
      });
    }
  }, []);

  return (
    <div>
      <div
        className="horizontal-line mediumFade"
        style={{ top: -30 }}
      />
      <div
        ref={heroRef}
        className="col middle center ml-20 mr-20"
        style={{ position: "relative", top: -20, minHeight: "30vh" }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            filter: "blur(5px)",
          }}
        >
          <video
            ref={videoRef}
            src="https://api.freeflex.com.au/storage/v1/object/public/transform/GREEN_DAPPLED_WALL_COMPRESSED.mp4"
            muted
            playsInline
            preload="auto"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "var(--borderRadius)",
            }}
          />
        </div>
        <div className="w50 col middle center">
          <div
            className="col  middle center"
            style={{
              minHeight: "80vh",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <AnimatedDots autoPlayDelay={3000} />

            <HeaderText
              text={["Digital content for positive change."]}
              typingSpeed={50}
              className="m3"
              pauseDuration={500}
              showCursor={true}
              cursorCharacter="|"
              color="white"
              textColors={["var(--bkg)"]}
              as="h1"
            />
            <p
              style={{ color: "var(--bkg)", fontSize: 22 }}
              className="textCenter m-20 fade-md"
            >
              We partner with{" "}
              <strong>
                not-for-profit organisations across South Australia
              </strong>{" "}
              and Australia to create websites, videos and software
              that build trust, attract donors, and tell your story.
            </p>
            <div className="row center w50 m3" style={{ zIndex: 10 }}>
              <button
                id="landing-software-button"
                className="boxed accent row middle ml3 mr3 lateFade"
                style={{ opacity: 0, color: "var(--bkg)" }}
                onClick={() => navigate("#software")}
              >
                <Icon
                  name="code-outline"
                  className="mr1"
                  color="var(--bkg)"
                />
                Software
              </button>
              <button
                id="landing-media-button"
                className="boxed accent row middle ml2 mr3 lateFade"
                style={{ opacity: 0, color: "var(--bkg)" }}
                onClick={() => navigate("#media")}
              >
                <Icon
                  name="film-outline"
                  className="mr1"
                  color="var(--bkg)"
                />
                Video
              </button>

              {/* <button
              id="landing-design-button"
              className="row middle ml3 mr3 lateFade"
              style={{ opacity: 0 }}
              onClick={() => navigate("#design")}
            >
              <Icon name="color-filter-outline" className="mr1" />
              Design
            </button> */}
            </div>
          </div>
        </div>
      </div>
      <div className="center mt-20 mb-20">
        {" "}
        <h2
          className="textCenter m-20 w-50"
          style={{ fontSize: 30, textAlign: "center" }}
        >
          On a mission to help a thousand Aussie organisations{" "}
          <strong>achieve meaningful change</strong> by crafting
          compelling online resources.
        </h2>
      </div>
      <div className="col middle center">
        <div
          className="mt3 w100 col middle center lateFade"
          style={{ opacity: 0 }}
        >
          <Carousel
            interval={3}
            showArrows
            autoplay
            snapOffset={20}
            width={100}
            centerFocused
            onClick={() => {}}
            resistance={PROJECTS.length * 1000}
          >
            {PROJECTS.map((img, idx) => (
              <div
                key={`${img.id} - ${idx}`}
                className="gap-20"
                style={{ position: "relative" }}
                onMouseOver={() => {
                  setHoveredImage(img.id);
                }}
                onMouseOut={() => setHoveredImage(undefined)}
                onClick={() => {
                  setViewProjectActive(true);
                  setSelectedProject(
                    PROJECTS.find((p) => p.id == img.id),
                  );
                  setSearchParams(
                    { project: img.id?.toString() },
                    { preventScrollReset: true },
                  );
                }}
              >
                {hoveredImage == img.id && (
                  <div className="">
                    <h3
                      style={{ zIndex: 20, color: "#eeeeee" }}
                      className="overlayDiv mediumFade"
                    >
                      <Icon
                        name={projectToIcon(img.type)}
                        color="#eeeeee"
                        className="mr2"
                      />
                      {img.name}
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
                    filter: `${
                      hoveredImage == img.id
                        ? "contrast(0.8)"
                        : "none"
                    }`,
                  }}
                  src={`${img.images[0]}`}
                  alt={`image of ${img.name} - a piece of digital content created by transform creative australia`}
                />
              </div>
            ))}
          </Carousel>
        </div>
      </div>
          <h2
          style={{fontSize:30}}
            className="textCenter mt-20 mb-20 pt-20 pb-20"
          >
            Trusted by nonprofits and community organisations <strong>
              across
              South Australia
            </strong>.
          </h2>
                <WorkedWith />
                 <div className="p-20">
        <ContactTab
          showHeader={false}
          buttonText="Get in touch with us"
        />
      </div>

      {/* What our clients love */}
      {PROJECTS.filter((p) => p.endorsement).length > 0 && (
        <div
          className="accent boxed col middle center p3 mt3 endorsementSection"
          style={{ opacity: 0 }}
        >

          <div
            className="row gap-10 shrink-wrap pt-20 mt-20 mb-20 "
            style={{ minHeight: 500 }}
          >
            <Carousel
              interval={8}
              showDots="start"
              autoplay
              mode="fade"
              loop
            >
              {PROJECTS.filter((p) => p.endorsement).map((p) => (
                <EndorsementCard
                  key={p.id}
                  text={p.endorsement!.text}
                  name={p.endorsement!.name}
                  width={context.inShrink ? "100vw" : "50vw"}
                  organisation={p.organisation || p.name}
                />
              ))}
            </Carousel>
          </div>
        </div>
      )}
      <div
        className="horizontal-line mediumFade"
        style={{ top: -30 }}
      />

     

      <div
        className="horizontal-line mediumFade"
        style={{ top: -50 }}
      />
      <div className="col middle p3 mb3">
        <MediaTab />
        <SoftwareTab />
        {/* <DesignTab /> */}
        <div style={{ minHeight: 150, width: 100 }} />
        <div
          className="horizontal-line mediumFade"
          style={{ top: -30 }}
        />

        <ContactTab buttonText="Get in touch" />
        <div
          className="horizontal-line mediumFade"
          style={{ top: -30 }}
        />
      </div>

      <ProjectInfoPopup
        active={viewProjectActive}
        project={selectedProject}
        onClose={() => {
          setViewProjectActive(false);
          setTimeout(() => setSelectedProject(undefined), 300);
          searchParams.delete("project");
          setSearchParams(searchParams, { preventScrollReset: true });
        }}
      />
    </div>
  );
}
