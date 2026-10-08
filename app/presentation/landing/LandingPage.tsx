import { type SharedContextProps } from "~/data/CommonTypes";
import { Link, useOutletContext } from "react-router";
import { Icon } from "../elements/Icon";
import { DesignTab } from "./DesignTab";
import { MediaTab } from "./MediaTab";
import { SoftwareTab } from "./SoftwareTab";
import { ContactTab } from "./ContactTab";
import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { CHURCH_HERO_POSTER, PROJECTS } from "~/data/Objects";
import type { IoniconName } from "~/data/Ionicons";
import { useGSAP } from "@gsap/react";
import { SplitText, ScrollTrigger } from "gsap/all";
import gsap from "gsap";
import HeaderText from "./HeaderText";
import { ProjectCarousel } from "../elements/ProjectCarousel";
import { AnimatedDots } from "../elements/AnimatedDots";
import { EndorsementSection } from "./EndorsementSection";
import { GradualBlur } from "../elements/GradualBlur";
import { SplashCursor } from "../elements/SplashCursor";
import { DEFAULT_POSTER } from "../elements/VideoPlayer";
import "../../app-v2.css";

export interface LandingPageProps {}

interface FeatureCardProps {
  id: string;
  icon: IoniconName;
  title: string;
  subtitle: string;
  videoSrc: string;
  cta:string;
  to: string;
}

/******************************
 * FeatureCard component
 * Teaser card for a service (video, one-line pitch, CTA). The video only
 * plays while the card is on screen. The whole card is a real link so
 * crawlers can follow it.
 */
function FeatureCard({
  id,
  icon,
  title,
  subtitle,
  videoSrc,
  cta="Find out more",
  to,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      id={id}
      to={to}
      className="boxed accent col flex-card outline-accent p-5 clickable no-underline"
    >
      {/* Placeholder painted behind the video, so the card isn't an empty
          box before the first frame arrives */}
      <div
        ref={cardRef}
        className="media-16-9 bg-cover"
        style={{
          borderRadius: 3,
          backgroundImage: `url(${DEFAULT_POSTER})`,
        }}
      >
        <ReactPlayer
          src={videoSrc}
          muted
          loop
          playing={playing}
          style={{
            minWidth: "100%",
            minHeight: "100%",
            objectFit: "cover",
          }}
        />
      </div>
      <div className="pl-20 pr-20 pb-20">
        <h2 className=" row middle gap-10 mt-20">
          <Icon name={icon} size={35} color="var(--accent)" />
          {title}
        </h2>
        <p className="mt-10 mb-20" style={{color: 'var(--accent-sm)'}}>{subtitle}</p>
        {/* Styled as a button, but not one: interactive content can't
            sit inside the card's link */}
        <div
          className="btn-look outline-bkg boxed row middle center gap-10 w-100"
          style={{color: 'var(--accent)'}}
        >
         {cta}
          <Icon
            name="arrow-forward-circle"
            size={20}
            color="var(--bkg)"
          />
        </div>
      </div>
    </Link>
  );
}

/******************************
 * LandingPage component
 * @todo Create description
 */
export function LandingPage({}: LandingPageProps) {
  const context: SharedContextProps = useOutletContext();

  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  gsap.registerPlugin(SplitText, ScrollTrigger);

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
      {/* Pointer-trailing fluid sim. Click-through, and skipped entirely
          below the 1200px breakpoint — it repaints every frame. */}
      <SplashCursor
        DENSITY_DISSIPATION={1}
        VELOCITY_DISSIPATION={3}
        CURL={1}
        SPLAT_FORCE={2500}
        RAINBOW_MODE={false}
        COLOR="#2d3625"
      />

      {/* No padding here — the carousel below runs edge to edge, so the
          padding lives on the hero block instead */}
      <div
        className="mt-20"
        style={{ position: "relative", top: -20, minHeight: "30vh" }}
      >
        <div className="col middle center p-20" style={{margin: "5vh 0 5vh 0"}}>
          <div
            className="col w-100 middle center"
            style={{
              position: "relative",
              overflow: "hidden",
            }}
          >
            <AnimatedDots autoPlayDelay={3000} />

            <HeaderText
              text={["Digital content for positive change."]}
              typingSpeed={50}
              className="m3 text-hero"
              pauseDuration={500}
              showCursor={true}
              cursorCharacter="|"
              color="green"
              textColors={["var(--accent)"]}
              as="h1"
            />
          </div>
        </div>
        <div className="col middle center">
          <div
            className=" w100 mt-20 col middle center lateFade"
            style={{ opacity: 0 }}
          >
            <ProjectCarousel projects={PROJECTS} />
          </div>
        </div>
      </div>

      {/* <div className="center mt-20 mb-20">
        {" "}
        <h2
          className="textCenter m-20 w-50"
          style={{ fontSize: 30, textAlign: "center" }}
        >
          On a mission to help a thousand Aussie organisations{" "}
          <strong>achieve meaningful change</strong> by crafting
          compelling online resources.
        </h2>
      </div> */}
      <div className="middle col m-20">
        <h4
          style={{ color: "var(--txt)" }}
          className="textCenter w-75"
        >
          We partner with{" "}
          <b style={{ fontWeight: 600, color: "var(--accent)" }}>
            non-profit organisations across South Australia
          </b>{" "}
          to help you build trust, raise donations and
          further your cause.
        </h4>
      </div>
      <div className="row center m-20 pt-20  ">
        <div
          className="row wrap gap-20 w-75 stretch lateFade"
          style={{ opacity: 0 }}
        >
          <FeatureCard
            id="landing-software-button"
            cta="Develop with us"
            icon="code-outline"
            title="Website"
            subtitle="We build custom giving platforms that redirect third party fees back to your mission."
            videoSrc="https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/software_video.mp4"
            to="/development"
          />
          <FeatureCard
            id="landing-media-button"
                        cta="Film with us"
            icon="film-outline"
            title="Video"
            subtitle="Helping charities and Christian organisations raise money and awareness."
            videoSrc="https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/2026%20reel-LQ.mp4"
            to="/media"
          />

          {/* Church comms: spans both cards, blurred church photo under an accent wash */}
          <Link
            to="/church"
            className={`boxed accent outline-accent relative clip col center w-100 border-box p-5 clickable no-underline ${
              context.inShrink ? "" : "min-h-260"
            }`}
          >
            <img
              src={CHURCH_HERO_POSTER ?? DEFAULT_POSTER}
              alt=""
              loading="lazy"
              className="layer-fill media-cover blur-8"
            />
            <div className="layer-fill wash-accent-80" />
            <div
              // Explicit alignment: the link's a.center rule would otherwise centre the text
              className={`relative row shrink-col middle between gap-20 p-20 border-box w-100 ${
                context.inShrink ? "textCenter" : "textLeft"
              }`}
            >
              <div className="col gap-10">
                <h2 className="row middle gap-10 shrink-col ">
                  <Icon name="people-outline" size={35} color="var(--bkg)" />
                  Church comms
                </h2>
                <p className="w-75">
                  We shoot your Sundays, then keep your website, socials,
                  slides and emails up to date every week.
                </p>
              </div>
              <div
                style={{color: 'var(--accent)'}}
                className="btn-look bkg row middle center gap-10 no-shrink"
              >
                See church plans
                <Icon name="arrow-forward-circle" size={20} />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <EndorsementSection />

        <div className="p-20">
            <ContactTab
              showHeader={false}
              buttonText="Get in touch"
            />
          </div>

      {/* Edge blurs. Both sit under the header, footer and popups
          (zIndex 10), so only page content is softened.
          Each layer is its own backdrop-filter pass, so the counts are
          kept low and both are dropped on mobile, where stacked
          backdrop-filters on fixed elements cost the most. */}
      <GradualBlur
        target="page"
        position="top"
        height="8rem"
        strength={1}
        divCount={3}
        curve="bezier"
        animated
        duration="1.5s"
        disableOnShrink
      />
      <GradualBlur
        target="page"
        position="bottom"
        height="7rem"
        strength={1.5}
        divCount={5}
        curve="bezier"
        exponential
        animated
        duration="1.5s"
        disableOnShrink
      />
    </div>
  );
}
