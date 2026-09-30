import { useRef } from "react";
import "../app-v2.css";
import { Link, useOutletContext } from "react-router";
import { useGSAP } from "@gsap/react";
import { SplitText, ScrollTrigger } from "gsap/all";
import gsap from "gsap";
import { SharedContextProps } from "~/data/CommonTypes";
import { CONTACT, MEDIA_HOW_WE_WORK, PROJECTS } from "~/data/Objects";
import { buildMeta, canonical, SITE_URL } from "~/business/seoBL";
import { AnimatedDots } from "~/presentation/elements/AnimatedDots";
import { SplashCursor } from "~/presentation/elements/SplashCursor";
import { GradualBlur } from "~/presentation/elements/GradualBlur";
import { Icon } from "~/presentation/elements/Icon";
import { VideoPlayer } from "~/presentation/elements/VideoPlayer";
import { ProjectCarousel } from "~/presentation/elements/ProjectCarousel";
import WorkedWith from "~/presentation/landing/WorkedWith";
import { ContactTab } from "~/presentation/landing/ContactTab";

const TRANSFORM_STORAGE =
  "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform";

const HERO_VIDEO = `${TRANSFORM_STORAGE}/2026%20reel-LQ.mp4`;

/** {{TODO: Isaac to supply a headshot — set this once it's uploaded}} */
const PORTRAIT_SRC: string | null = null;

const TITLE = "Nonprofit Video Production, Adelaide | Transform Creative";
const DESCRIPTION =
  "Transform Creative is an Adelaide creative agency making videos for charities and Christian organisations, from appeal and social clips to full training series. Tell us what you're working on.";

export function meta() {
  return buildMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: "/media",
    keywords:
      "nonprofit video production Adelaide, charity video production Australia, Christian video production Adelaide, fundraising appeal video, church video production South Australia, not for profit videographer Adelaide, social media videos for charities",
    twitterDescription:
      "Adelaide video production for charities and Christian organisations — appeal videos, social clips and training series.",
  });
}

export const links = () => [canonical("/media")];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Nonprofit video production",
  serviceType: "Video production",
  description: DESCRIPTION,
  url: `${SITE_URL}/media`,
  areaServed: ["Adelaide", "South Australia", "Australia"],
  audience: {
    "@type": "Audience",
    audienceType: "Charities, nonprofits and Christian organisations",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Video production for nonprofits",
    itemListElement: [
      "Fundraising appeal videos",
      "Social media clips and cut-downs",
      "Training and course video series",
    ].map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
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

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Video production",
      item: `${SITE_URL}/media`,
    },
  ],
};

export default function MediaServicesRoute() {
  const context: SharedContextProps = useOutletContext();
  const portfolioRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(SplitText, ScrollTrigger);

    document.fonts.ready.then(() => {
      const titleSplit = SplitText.create("#media-header", {
        type: "words",
      });
      gsap.from(titleSplit.words, {
        opacity: 0,
        y: -10,
        stagger: 0.08,
        duration: 0.6,
      });
    });

    gsap.utils.toArray<HTMLElement>(".media-beat").forEach((beat) =>
      gsap.from(beat, {
        scrollTrigger: { trigger: beat, start: "top 85%" },
        opacity: 0,
        y: 20,
        duration: 0.6,
      }),
    );
  }, []);

  const scrollToPortfolio = () =>
    portfolioRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ minHeight: "85vh" }} className="col middle center gap-20">
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
          __html: JSON.stringify([serviceSchema, breadcrumbSchema]),
        }}
      />

      {/* 1. Hero */}
      <header
        className="col middle center shrink-p-10 w-100"
        style={{ minHeight: "90vh" }}
      >
        <div className="col gap-20 middle w-100">
          <AnimatedDots autoPlayDelay={3000} />

          <div className="col middle gap-10 w-100 mb-20 mt-20">
        
            <h1
              id="media-header"
              className="textCenter w-75"
              style={{ color: "var(--txt)", letterSpacing: -1.5 }}
            >
              Videos that help{" "}
              <strong style={{ fontWeight: 600 }}>charities</strong> and{" "}
              <strong style={{ fontWeight: 600 }}>
                Christian organisations
              </strong>{" "}
              raise money and awareness.
            </h1>
          </div>

          <div className="w-50 mb-20">
            <div className="row gap-10 shrink-col">
              <button
                className="accent row center gap-5 middle w-50"
                onClick={scrollToPortfolio}
              >
                <Icon name="arrow-down" size={16} />
                See our work
              </button>
              <a
                className="outline-secondary row middle gap-5 w-50 center"
                role="button"
                style={{ color: "var(--accent)", background: "none" }}
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
            className="w-75 boxed outline-accent col middle gap-10"
          >
            {/* w-100 + padding (not margins) so the media box has a width
                of its own before the video loads. */}
            <div className="w-100 p-10 border-box">
              <VideoPlayer
                src={HERO_VIDEO}
                className="r-default"
                label="Transform Creative 2026 showreel"
                loop
              />
            </div>
            <p className="textCenter mb-10" style={{ color: "var(--accent-sm)" }}>
              Appeal videos, social clips and full training series — made
              for the causes that matter.
            </p>
          </div>
        </div>
      </header>

      <div className="horizontal-line w-100" style={{ margin: "60px 0 20px 0" }} />

      {/* 2. Worked with */}
      <section className="col middle center m-10 w-100" style={{ overflow: "clip" }}>
        <WorkedWith />
      </section>

      <div className="horizontal-line mediumFade mt-20 mb-20" />

      {/* 3. How we work */}
      <section
        aria-labelledby="media-how-we-work"
        className="col middle w-100 shrink-p-10"
      >
        <p className="m0" style={{ color: "var(--accent-lg)" }}>
          How we work
        </p>
        <h2
          id="media-how-we-work"
          className="textCenter mt-10 mb-20"
          style={{ color: "var(--txt)", letterSpacing: -1.5 }}
        >
          A video crew that <b style={{ fontWeight: 600 }}>gets your mission</b>.
        </h2>
        <ol className="row wrap gap-20 w-75 stretch m0" style={{ listStyle: "none", padding: 0 }}>
          {MEDIA_HOW_WE_WORK.map((beat, index) => (
            <li
              key={beat.title}
              className="media-beat boxed outline-accent flex-card col gap-10 p-20"
            >
              <div className="row middle gap-10">
                <div className="icon-tile center middle">
                  <Icon name={beat.icon} size={18} color="var(--bkg)" />
                </div>
                <p className="m0 text-sm" style={{ color: "var(--accent)" }}>
                  {index + 1}
                </p>
              </div>
              <h3 className="m0">{beat.title}</h3>
              <p className="m0">{beat.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="horizontal-line mediumFade mt-20 mb-20" />

      {/* 4. Portfolio carousel */}
      <section
        ref={portfolioRef}
        aria-labelledby="media-portfolio"
        className="col middle w-100"
        style={{ scrollMarginTop: 100 }}
      >
        <h2
          id="media-portfolio"
          className="textCenter w-75 mb-20"
          style={{ color: "var(--txt)" }}
        >
          Videos we've made for{" "}
          <b style={{ fontWeight: 600, color: "var(--accent)" }}>
            charities and churches
          </b>
        </h2>
        <ProjectCarousel projects={PROJECTS.filter((p) => p.type === "media")} />
        <Link
          to="/portfolio?type=media"
          className="row middle gap-5 mt-20"
          style={{ color: "var(--accent)" }}
        >
          Browse the full video portfolio
          <Icon name="arrow-forward" size={16} color="var(--accent)" />
        </Link>
      </section>

      <div className="horizontal-line mediumFade mt-20 mb-20" />

      {/* 5. About — {{TODO: Isaac to fill in}} */}
      <section
        aria-labelledby="media-about"
        className="row gap-20 w-75 shrink-col middle shrink-p-10"
      >
        <div className="flex-card">
          {PORTRAIT_SRC ? (
            <img
              src={PORTRAIT_SRC}
              alt="Isaac, video producer and founder of Transform Creative, Adelaide"
              className="media-4-5 media-cover r-default"
              loading="lazy"
            />
          ) : (
            <div className="media-4-5 media-fallback r-default col middle center">
              <Icon name="person-outline" size={50} color="var(--accent)" />
            </div>
          )}
        </div>
        <div className="flex-card-2 col gap-10">
          <p className="m0" style={{ color: "var(--accent-lg)" }}>
            Who you'll work with
          </p>
          <h2 id="media-about" className="m0" style={{ color: "var(--txt)" }}>
            {/* {{TODO: heading}} */}
            Hi, I'm Isaac.
          </h2>
          {/* {{TODO: about copy}} */}
          <p className="m0">About copy goes here.</p>
        </div>
      </section>

      <div className="horizontal-line mediumFade mt-20 mb-20" />

      {/* 6. Book a call */}
      <div className="w-100 col middle">
        <ContactTab headerText="Tell us what you're working on." />
      </div>

      {/* 7. Software cross-sell */}
      <aside className="w-75 shrink-p-10 mb-20">
        <Link
          to="/development"
          className="boxed outline-accent row middle between gap-10 p-20 shrink-col"
          style={{ color: "var(--txt)", textDecoration: "none" }}
        >
          <div className="row middle gap-10">
            <div className="icon-tile center middle">
              <Icon name="code-outline" size={18} color="var(--bkg)" />
            </div>
            <p className="m0">
              <b style={{ fontWeight: 600 }}>Running appeals?</b> We also
              build donation platforms that keep the donor tip with your
              cause.
            </p>
          </div>
          <p className="m0 row middle gap-5" style={{ color: "var(--accent)" }}>
            See how
            <Icon name="arrow-forward" size={16} color="var(--accent)" />
          </p>
        </Link>
      </aside>

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
