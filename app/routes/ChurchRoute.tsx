import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import "../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import {
  CHURCH_CAPACITY_LINE,
  CHURCH_EXAMPLE_PROJECT_IDS,
  CHURCH_FAQ,
  CHURCH_FAQ_SECTIONS,
  CHURCH_HERO_POSTER,
  CHURCH_HERO_VIDEO,
  CHURCH_JOBS,
  CHURCH_SERVICES,
  CHURCH_WEEK,
  PROJECTS,
} from "~/data/Objects";
import {
  CHURCH_ACTION,
  CHURCH_CTA_SOURCE,
  logChurchActivity,
  type ChurchCtaSource,
} from "~/data/Analytics";
import { defaultPlan, priceOf } from "~/business/churchPlanBL";
import { scrollToId } from "~/business/commonBL";
import { buildMeta, canonical, SITE_URL } from "~/business/seoBL";
import { Icon } from "~/presentation/elements/Icon";
import { DEFAULT_POSTER } from "~/presentation/elements/VideoPlayer";
import {
  FrequentlyAskedQuestions,
  faqJsonLd,
} from "~/presentation/elements/FrequentlyAskedQuestions";
import {
  PlanBuilder,
  fmt,
  type PlanBuilderHandle,
} from "~/presentation/church/PlanBuilder";
import { BoardPopup } from "~/presentation/church/BoardPopup";
import { PlanEmailForm } from "~/presentation/church/PlanEmailForm";
import { BookChatButton } from "~/presentation/church/BookChatButton";
import { ProblemTabs } from "~/presentation/church/ProblemTabs";
import { ServiceTabs } from "~/presentation/church/ServiceTabs";

const TITLE = "Church Comms, Done For You | Transform Creative";
const DESCRIPTION =
  "We film your Sundays and turn your sermon into the week's socials, slides and email. Works with Elvanto and Planning Center. Price your plan in a minute.";

export function meta() {
  return buildMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: "/church",
    keywords:
      "church media agency Adelaide, church communications, church social media, sermon clips, Elvanto, Planning Center, church website",
  });
}

export const links = () => [canonical("/church")];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Church comms, done for you",
  serviceType: "Church media and communications",
  description: DESCRIPTION,
  url: `${SITE_URL}/church`,
  areaServed: ["Adelaide", "South Australia", "Australia"],
  audience: { "@type": "Audience", audienceType: "Churches" },
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

const PLAN_ID = "plan";

// TODO: swap for real Sunday footage (set CHURCH_HERO_VIDEO). No stock footage.
const HERO_PLACEHOLDER_VIDEO =
  "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/2026%20reel-LQ.mp4";

export default function ChurchRoute() {
  const context: SharedContextProps = useOutletContext();
  const builder = useRef<PlanBuilderHandle>(null);

  const [plan, setPlan] = useState(defaultPlan);
  const [boardOpen, setBoardOpen] = useState(false);
  const [emailSource, setEmailSource] = useState<ChurchCtaSource>();
  const [pastPlanTop, setPastPlanTop] = useState(false);
  // The header's sticky wrapper reserves more height than its visible bar.
  // Measure both so the hero can start flush under the bar, not the wrapper.
  const [navBarHeight, setNavBarHeight] = useState(120);
  const [navGap, setNavGap] = useState(0);

  const price = priceOf(plan);

  useLayoutEffect(() => {
    const wrapper = document.getElementById("header-menu");
    const bar = wrapper?.firstElementChild as HTMLElement | null;
    if (!wrapper || !bar) return;
    const measure = () => {
      setNavBarHeight(bar.offsetHeight);
      setNavGap(Math.max(0, wrapper.offsetHeight - bar.offsetHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  // The mobile price bar rides in once the plan builder is on screen, and
  // steps out of the way as the page bottoms out so the footer is readable.
  useEffect(() => {
    const onScroll = () => {
      const planTop =
        document.getElementById(PLAN_ID)?.getBoundingClientRect()
          .top ?? Infinity;
      const fromBottom =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      setPastPlanTop(
        planTop < window.innerHeight * 0.6 && fromBottom >= 100,
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

  useGSAP(() => {
    gsap.fromTo(
      "[data-hero]",
      { opacity: 0, y: -10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3",
      },
    );
  }, []);

  function openBoard(source: ChurchCtaSource) {
    logChurchActivity(CHURCH_ACTION.BOARD_POPUP_OPEN, { source });
    setBoardOpen(true);
  }

  function openEmail(source: ChurchCtaSource) {
    setBoardOpen(false);
    setEmailSource(source);
  }

  const showMobileBar =
    context.inShrink && pastPlanTop && !boardOpen && !emailSource;

  const examples = CHURCH_EXAMPLE_PROJECT_IDS.map((id) =>
    PROJECTS.find((p) => p.id === id),
  ).filter((p) => p !== undefined);

  return (
    <div className="col middle center gap-20 w-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(CHURCH_FAQ)),
        }}
      />

      {/* 1. Hero: video filling the screen from the bottom of the navbar
          bar down, with an outline frame inset over it */}
      <section
        className="relative clip w-100 on-media"
        style={{
          marginTop: -navGap,
          height: `calc(100svh - ${navBarHeight}px)`,
        }}
      >
        <video
          className="layer-fill media-cover"
          src={CHURCH_HERO_VIDEO ?? HERO_PLACEHOLDER_VIDEO}
          poster={CHURCH_HERO_POSTER ?? DEFAULT_POSTER}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <div className="layer-fill scrim-dark" />
        <div
          className={`layer-inset frame-light r-lg col middle center gap-20 textCenter border-box ${
            context.inShrink ? "p-20" : "p-40"
          }`}
        >
          <h1
            data-hero
            style={{
              letterSpacing: -1.5,
              lineHeight: 1,
              textAlign: "center",
              maxWidth: 900,
            }}
          >
            Your church's{" "}
            <strong
              className="on-media-soft"
              style={{ fontWeight: 500 }}
            >
              local comms
            </strong>{" "}
            team.
          </h1>

          <div className="col middle center">
            {/* <p data-hero style={{ maxWidth: 520 }}>
              Sundays are{" "}
              <strong style={{ fontWeight: 600 }}>
                2 hours a week. What about the other 166?
              </strong>
            </p> */}
            <div data-hero className="mt-20">
              <button
                type="button"
                className="accent row middle center gap-5"
                onClick={() => scrollToId(PLAN_ID)}
              >
                <Icon
                  name="arrow-down"
                  size={16}
                  color="var(--bkg)"
                />
                Build your plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three jobs */}
      <section className="col middle gap-20 w-75 shrink-p-10 border-box">
        <div className="row w-100 between middle">
          <div className=" mt-20 mb-20 pt-20 pb-20 ">
            <h2 className="w-100" style={{ letterSpacing: -1.5 }}>
              We{" "}
              <strong style={{ fontWeight: 600 }}>
                shoot your service
              </strong>
              .
            </h2>
            <h3>
              Then run your{" "}
              <strong
                style={{ fontWeight: 600, color: "var(--accent)" }}
              >
                socials, website, slides & emails weekly.
              </strong>
            </h3>
          </div>
          <div className="end col">
            <p>
              <strong style={{ fontWeight: 600 }}>So</strong> your vision is clear.
            </p>
            <p>
              <strong style={{ fontWeight: 600 }}>So</strong> newcomers feel welcomed.
            </p>
             <p>
              <strong style={{ fontWeight: 600 }}>So</strong> regulars know what's happening.
            </p>
          </div>
        </div>
      
      </section>
      
      <ProblemTabs jobs={CHURCH_JOBS} />

      <div className="horizontal-line mediumFade" />

      {/* 3. What we do about it */}
      <ServiceTabs
        services={CHURCH_SERVICES}
        onPrice={(group) => builder.current?.openGroup(group)}
      />
      <div className="horizontal-line mediumFade" />


      {/* 4. Build your plan */}
      <section
        id={PLAN_ID}
        className="col middle w-75 shrink-p-10 border-box mt-20 pt-20"
      >
        <PlanBuilder
          ref={builder}
          plan={plan}
          onChange={setPlan}
          onEmail={openEmail}
          onBoard={openBoard}
        />
      </section>

      <div className="horizontal-line mediumFade" />

      {/* 5. How a week works */}
      <section className="col middle gap-20 w-75 shrink-p-10 border-box">
        <h2 className="textCenter" style={{ letterSpacing: -1.5 }}>
          How a <strong>week</strong> works
        </h2>
        <ol
          className="row shrink-col gap-20 w-100 p0 m0"
          style={{ listStyle: "none" }}
        >
          {CHURCH_WEEK.map((step) => (
            <li
              key={step.day}
              className="col gap-10 flex-card boxed p-20"
            >
              <div className="row middle gap-10">
                <Icon
                  name={step.icon}
                  size={16}
                  color="var(--accent)"
                />
                <p className="field-label">{step.day}</p>
              </div>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="horizontal-line mediumFade" />

      {/* 6. Who's doing this */}
      <section className="col middle gap-20 w-75 shrink-p-10 border-box">
        <div className="row shrink-col middle gap-20 w-100">
          <div className="w-30 shrink-col">
            {/* TODO: photo of Isaac */}
            <MediaPlaceholder label="Photo of Isaac" tall />
          </div>
          <div className="col gap-10 w-100">
            <h2 style={{ letterSpacing: -1.5 }}>
              Who's <strong>doing this</strong>
            </h2>
            <p>
              Hi, I'm Isaac. I run Transform Creative, and I spent two
              years doing comms at Kings Baptist, so I know what a
              church week looks like from the inside.
            </p>
            <p>
              We've also made film for Baptist Churches SA, Baptist
              Care, Crossover and others.
            </p>
            <p className="pill-accent bold">{CHURCH_CAPACITY_LINE}</p>
          </div>
        </div>

        {/* TODO: testimonial from the Kings pastor + office */}
        {/* <MediaPlaceholder label="Testimonial: Kings pastor + office" /> */}

        {/* <div className="grid-250 w-100">
          {examples.map((project) => (
            <div key={project.id} className="col gap-5">
              <img
                src={project.images[0]}
                alt={`${project.name}, ${project.organisation ?? "King's Baptist Church"}`}
                loading="lazy"
                className="media-16-9 media-cover r-default"
              />
              <p className="text-sm muted">{project.name}</p>
            </div>
          ))}
        </div> */}

        {/* TODO: client logo strip, once logo permissions are confirmed */}
        {/* <MediaPlaceholder label="Logo strip (waiting on permissions)" /> */}
      </section>

      <div className="horizontal-line mediumFade" />

      {/* 7. FAQ */}
      <section className="col middle w-50 shrink-p-10 border-box">
        <FrequentlyAskedQuestions
          sections={CHURCH_FAQ_SECTIONS}
          questions={CHURCH_FAQ}
        />
      </section>

      <div className="horizontal-line mediumFade" />

      {/* 8. Final CTA */}
      <section className="w-75 shrink-p-10 border-box mb-20">
        <div className="col middle gap-20 accent boxed p-20">
          <h2 className="textCenter" style={{ letterSpacing: -1.5 }}>
            Want to see what this could look like for{" "}
            <strong>your church</strong>?
          </h2>
          <p className="textCenter w-75">
            Build your plan and I'll email it through, or grab a
            no-pressure 20-minute chat.
          </p>
          <div className="row shrink-col gap-10 w-50">
            <button
              type="button"
              className="bkg row middle center gap-5 w-100"
              onClick={() => openEmail(CHURCH_CTA_SOURCE.FINAL_CTA)}
            >
              <Icon name="mail-outline" size={16} />
              Email me this plan
            </button>
            <BookChatButton
              source={CHURCH_CTA_SOURCE.FINAL_CTA}
              onAccent
              className="w-100"
            />
          </div>
        </div>
      </section>

      {/* Mobile price bar */}
      <div
        className={`sticky-bottom-bar row middle between gap-10 boxed p-10 ${
          showMobileBar ? "" : "faded-out"
        }`}
        aria-hidden={!showMobileBar}
      >
        <div className="col">
          <p className="bold num">{fmt(price.monthly)}/mo</p>
          {price.setup > 0 && (
            <p className="text-sm muted">
              + {fmt(price.setup)} setup
            </p>
          )}
        </div>
        <button
          type="button"
          className="accent row middle center gap-5"
          tabIndex={showMobileBar ? 0 : -1}
          onClick={() => openEmail(CHURCH_CTA_SOURCE.MOBILE_BAR)}
        >
          <Icon name="mail-outline" size={16} color="var(--bkg)" />
          Email me this plan
        </button>
      </div>

      <BoardPopup
        active={boardOpen}
        onClose={() => setBoardOpen(false)}
        onEmail={openEmail}
      />
      <PlanEmailForm
        active={!!emailSource}
        plan={plan}
        source={emailSource}
        onClose={() => setEmailSource(undefined)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------- */

interface MediaPlaceholderProps {
  label: string;
  /** Light text, for use on an accent background */
  onAccent?: boolean;
  /** Portrait (4:5) instead of 16:9 */
  tall?: boolean;
}

/******************************
 * A labelled, dashed slot for real photos/video still to be supplied.
 */
function MediaPlaceholder({
  label,
  onAccent,
  tall,
}: MediaPlaceholderProps) {
  const color = onAccent ? "var(--bkg)" : "var(--accent-lg)";
  return (
    <div
      className={`placeholder-box col middle center gap-5 border-box ${
        tall ? "media-4-5" : "media-16-9"
      }`}
      style={{ borderColor: color }}
    >
      <Icon name="images-outline" size={20} color={color} />
      <p className="text-sm textCenter" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
