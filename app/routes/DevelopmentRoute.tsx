import { useEffect, useRef, useState } from "react";
import "../app-v2.css";
import FeatureSelector, {
  type FeatureSelectorHandle,
} from "~/presentation/software/FeatureSelector";
import SoftwareProjects from "~/presentation/software/SoftwareProjects";
import { HowItWorks } from "~/presentation/software/HowItWorks";
import { AnimatedDots } from "~/presentation/elements/AnimatedDots";
import { useGSAP } from "@gsap/react";
import { SplitText, ScrollTrigger } from "gsap/all";
import gsap from "gsap";
import { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext, useSearchParams } from "react-router";
import { ContactTab } from "~/presentation/landing/ContactTab";
import { EndorsementSection } from "~/presentation/landing/EndorsementSection";
import { SavingCalculator } from "~/presentation/software/SavingCalculator";
import { CONTACT, FEATURES, PROJECTS } from "~/data/Objects";
import { buildMeta, canonical, SITE_URL } from "~/business/seoBL";
import { SplashCursor } from "~/presentation/elements/SplashCursor";
import { GradualBlur } from "~/presentation/elements/GradualBlur";

import { Icon } from "~/presentation/elements/Icon";
import { Carousel } from "~/presentation/elements/Carousel";
import { EndorsementCard } from "~/presentation/elements/EndorsementCard";
import WorkedWith from "~/presentation/landing/WorkedWith";
import { VideoPlayer } from "~/presentation/elements/VideoPlayer";

const TRANSFORM_STORAGE =
  "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform";

/** Storage object name is misspelled ("fundrasing") — that is the real key. */
const HERO_VIDEO = `${TRANSFORM_STORAGE}/fundrasing_ad_1_subs_720.mp4`;
const HERO_POSTER = `${TRANSFORM_STORAGE}/software-video-poster.jpg`;

const TITLE =
  "Nonprofit Website Development Adelaide | Transform Creative";
const DESCRIPTION =
  "Custom fundraising platforms for Australian charities — a Raisely & Funraisin alternative. Keep what your donors give instead of it going to a platform. Adelaide-based, nonprofit only.";

export function meta() {
  return buildMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: "/development",
    keywords:
      "custom donation platform Australia, custom fundraising website developer, Raisely alternative Australia, Funraisin alternative, reduce fundraising platform fees, nonprofit website development Adelaide, peer-to-peer fundraising platform Australia",
    twitterDescription:
      "Custom fundraising platforms for Australian charities — a Raisely & Funraisin alternative. Adelaide-based, nonprofit only.",
  });
}

/* The poster is applied to the media element client-side (ReactPlayer won't
   forward it), so it is absent from the prerendered HTML. Preloading it here
   puts it in that markup and lets the browser start fetching before hydration. */
export const links = () => [
  canonical("/development"),
  { rel: "preload", as: "image", href: HERO_POSTER },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Custom fundraising platform development",
  serviceType: "Custom fundraising platform development",
  description: DESCRIPTION,
  url: `${SITE_URL}/development`,
  areaServed: ["Australia", "South Australia"],
  audience: {
    "@type": "Audience",
    audienceType: "Nonprofits and charities",
  },
  provider: {
    "@type": "Organization",
    name: "Transform Creative",
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Adelaide",
      addressRegion: "SA",
      addressCountry: "AU",
    },
  },
};

export default function DevelopmentRoute() {
  const featureSectionRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  const savingsRef = useRef<HTMLDivElement>(null);
  const context: SharedContextProps = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  // Page-wide CTA into the feature popout — hidden while it's open so it
  // doesn't sit on top of the popout's own controls.
  const featureSelector = useRef<FeatureSelectorHandle>(null);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [ctaInView, setCtaInView] = useState(false);

  // The CTA rides in once the hero is scrolled past, and steps back out of the
  // way as the page bottoms out so the footer is readable.
  useEffect(() => {
    const onScroll = () => {
      const fromBottom =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      setCtaInView(
        window.scrollY > window.innerHeight * 0.7 &&
          fromBottom >= 100,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("section") !== "savings") return;
    const top =
      (savingsRef.current?.getBoundingClientRect().top ?? 0) +
      window.scrollY -
      100;
    window.scrollTo({ top, behavior: "smooth" });
  }, [searchParams]);

  useGSAP(() => {
    gsap.registerPlugin(SplitText, ScrollTrigger);

    document.fonts.ready.then(() => {
      const titleSplit = SplitText.create("#dev-header", {
        type: "words",
      });
      gsap.from(titleSplit.words, {
        scrollTrigger: {
          scrub: 1,
          start: "70vh",
          end: context.inShrink ? "+800" : "+1000",
          toggleActions: "pause pause reverse pause",
        },
        opacity: 0,
        y: -10,
        stagger: 0.2,
      });
    });

    gsap.fromTo(
      "#dev-more-btn",
      { opacity: 0, y: -10 },
      {
        duration: 0.5,
        opacity: 1,
        y: 0,
      },
    );
  }, []);

  return (
    <div
      style={{ minHeight: "85vh" }}
      className="col middle center gap-20"
    >
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <div className="center col middle w-100">
        {/* shrink-p-10 = the 10px mobile gutter, as padding on the section
            rather than margins on the children that go w-100 below 1200px */}
        <div
          className="col middle center shrink-p-10"
          style={{ minHeight: "90vh" }}
        >
          <div className="col gap-20 middle w-100">
            <AnimatedDots autoPlayDelay={3000} />

            <div className="col middle gap-10 w-100">
              <h1
                className="textCenter w-100"
                style={{ color: "var(--txt)", letterSpacing: -1.5 }}
              >
                Own your{" "}
                <strong style={{ fontWeight: 600 }}>
                  fundraising platform
                </strong>
                ,
              </h1>
              <h1
                className="textCenter w-100"
                style={{ color: "var(--txt)", letterSpacing: -1.5 }}
              >
                Maximise your mission.
              </h1>
              {/* <p
                className="textCenter w-75 mt-10 mb-10"
                style={{ color: "var(--txt)" }}
              >
                <b style={{ fontWeight: 600 }}>
                  Custom fundraising platforms
                </b>{" "}
                for Australian charities that redirect third-party
                fees back{" "}
                <b style={{ fontWeight: 600 }}>to your cause</b>.
              </p> */}
            </div>
            <div className="w-50">
              <div className="row gap-10 shrink-col">
                <button
                  className="accent row center gap-5 middle w-50"
                  onClick={() =>
                    setSearchParams({ section: "savings" })
                  }
                >
                  <Icon name="arrow-down" size={16} />
                  What could my org save?
                </button>

                <a
                  className="outline-secondary row middle gap-5 w-50 center"
                  role="button"
                  style={{
                    color: "var(--accent)",
                    background: "none",
                  }}
                  href={CONTACT.bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="link" size={16} color="var(--accent)" />
                  Book a free discovery call
                </a>
              </div>
            </div>

            <div
              style={{ background: "var(--accent)" }}
              className=" w-75 boxed outline-accent col middle gap-10"
            >
              {/* w-100 + padding (not margins) so the media box has a width
                  of its own — otherwise `col middle` shrink-wraps it to the
                  video's intrinsic size and it has none until one loads. */}
              <div className="w-100 p-10 border-box">
                <VideoPlayer
                  src={HERO_VIDEO}
                  poster={HERO_POSTER}
                  className="r-default"
                  label="explainer video"
                  loop
                />
              </div>
              <p
                className="textCenter mb-10"
                style={{ color: "var(--accent-sm)" }}
              >
                Third-party platforms nudge your donors 'to cover
                costs'. On a platform you own, that generosity{" "}
                <b style={{ fontWeight: 800 }}>furthers your cause</b>
                .
              </p>
            </div>
          </div>
        </div>
        <div
          className="horizontal-line  w-100"
          style={{ margin: "60px 0 20px 0" }}
        />

        <h2
          className="textCenter accent m-10"
          style={{ color: "var(--txt)", letterSpacing: -1.5 }}
        >
          Sites that help Aussie non-profits{" "}
          <strong>decrease overheads</strong>,{" "}
          <strong>increase donations</strong> and{" "}
          <strong>deliver great experiences</strong>.
        </h2>

        <div
          className="horizontal-line  w-100"
          style={{ margin: "20px 0 20px 0" }}
        />
        <div className="ml-20 mr-20  col middle">
          <div
            className="w-100 mb-20 pb-20 mt-20 pt-20 gap-10 col middle center"
            ref={savingsRef}
          >
            <SavingCalculator />
          </div>
        </div>
      </div>
      <div
        className="horizontal-line mediumFade "
        style={{ top: -50, marginTop: 50, marginBottom: -20 }}
      />
      {/* w-100 (not margins) so this column has a definite width — otherwise it
          shrink-wraps the grid and the whole panel resizes per category */}
      <div className="m-20">
        <div className="w-100 col middle">
          <div
            className="w-75 center boxed accent"
            ref={featureSectionRef}
          >
            <div className="m-20">
              <FeatureSelector
                features={FEATURES}
                ref={featureSelector}
                onOpenChange={setFeaturesOpen}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="horizontal-line mediumFade "
        style={{ marginTop: 50, marginBottom: 0 }}
      />
      <div
        className="col middle w-100"
        ref={examplesRef}
        style={{ overflow: "clip" }}
      >
        <h2
          className="textCenter w-75"
          style={{ margin: "50px 0 40px 0", color: "var(--txt)" }}
        >
          We've created with some of Australia's most innovative{" "}
          <b style={{ fontWeight: 600, color: "var(--accent)" }}>
            non-profits
          </b>{" "}
        </h2>

        <SoftwareProjects />
        <div className="col middle center m-20">
          <Carousel
            interval={8}
            showDots="end"
            autoplay
            mode="fade"
            loop
          >
            {PROJECTS.filter(
              (e) => e.type === "software" && e.endorsement,
            ).map((p) => (
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
        <div className="col middle center m-10 ">
          <WorkedWith />
        </div>
      </div>

      <div
        className="horizontal-line mediumFade mt-20 mb-20 ot02"
        style={{ top: 0 }}
      />

      <div className="w-100 col middle m-20">
        <HowItWorks />
      </div>

      <div
        className="horizontal-line mediumFade mt-20 mb-20 ot02"
        style={{ top: 0 }}
      />

      <div className="w-100 col middle">
        <ContactTab headerText="Still got questions?" />
      </div>

      <button
        className={`accent row middle center gap-5 floating-cta s-10 outline ${
          featuresOpen || !ctaInView ? "faded-out" : ""
        }`}
        onClick={() => featureSelector.current?.openFirst()}
      >
        <Icon name="sparkles" size={16} color="var(--bkg)" />
        Features we offer
      </button>
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
