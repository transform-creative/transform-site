import { type SharedContextProps } from "~/data/CommonTypes";
import { useNavigate, useOutletContext } from "react-router";
import { Icon } from "../elements/Icon";
import { DesignTab } from "./DesignTab";
import { MediaTab } from "./MediaTab";
import { SoftwareTab } from "./SoftwareTab";
import { ContactTab } from "./ContactTab";
import { useEffect, useRef } from "react";
import { PROJECTS } from "~/data/Objects";
import { useGSAP } from "@gsap/react";
import { SplitText, ScrollTrigger } from "gsap/all";
import gsap from "gsap";
import HeaderText from "./HeaderText";
import WorkedWith from "./WorkedWith";
import { Carousel } from "../elements/Carousel";
import { ProjectCarousel } from "../elements/ProjectCarousel";
import { AnimatedDots } from "../elements/AnimatedDots";
import { EndorsementCard } from "../elements/EndorsementCard";

export interface LandingPageProps {}

/******************************
 * LandingPage component
 * @todo Create description
 */
export function LandingPage({}: LandingPageProps) {
  const context: SharedContextProps = useOutletContext();

  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  gsap.registerPlugin(SplitText, ScrollTrigger);

  useEffect(() => {
    console.log("Hello from the Transform Creative home page!");
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
            src="https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/GREEN_DAPPLED_WALL_SCRUB.mp4"
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
                className="boxed  row middle ml3 mr3 lateFade"
                style={{ opacity: 0, color: "var(--accent)" }}
                onClick={() => navigate("/development")}
              >
                <Icon
                  name="code-outline"
                  className="mr1"
                  color="var(--accent)"
                />
                Software
              </button>
              <button
                id="landing-media-button"
                className="boxed  row middle ml2 mr3 lateFade"
                style={{ opacity: 0, color: "var(--accent)" }}
                onClick={() => navigate("#media")}
              >
                <Icon
                  name="film-outline"
                  className="mr1"
                  color="var(--accent)"
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
          <ProjectCarousel projects={PROJECTS} />
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

    </div>
  );
}
