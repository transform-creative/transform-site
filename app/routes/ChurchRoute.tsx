import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router";
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
  CHURCH_SURVEY_ID,
  CHURCH_WEEK,
  FOUNDER_PHOTO,
  PROJECTS,
} from "~/data/Objects";
import {
  CHURCH_ACTION,
  CHURCH_CTA_SOURCE,
  logChurchActivity,
  type ChurchCtaSource,
} from "~/data/Analytics";
import { defaultPlan, priceOf } from "~/business/churchPlanBL";
import { boldPhrases, scrollToId } from "~/business/commonBL";
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
import {
  ServiceTabs,
  type ServiceTabsHandle,
} from "~/presentation/church/ServiceTabs";

const TITLE =
  "Church Websites & Media in Adelaide | Transform Creative";
const DESCRIPTION =
  "A new church website for $1,500, regularly kept current, plus Sunday shoots, socials, slides and email. From an Adelaide creative agency.";

export function meta() {
  return buildMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: "/church",
    shareTitle: "Your church's local comms team",
    shareDescription:
      "We shoot your Sundays, then keep your website, socials, slides and emails up to date every week. Price your plan in a minute.",
    image: "/og/church_comms_meta.jpg",
    imageAlt:
      "Your church's local comms team: Transform Creative, Adelaide",
  });
}

export const links = () => [canonical("/church")];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Church websites and comms",
  serviceType: "Church media and communications",
  description: DESCRIPTION,
  url: `${SITE_URL}/church`,
  areaServed: [
    { "@type": "City", name: "Adelaide" },
    { "@type": "State", name: "South Australia" },
  ],
  offers: {
    "@type": "Offer",
    name: "New church website",
    description:
      "One-off build of a new church website, connected to Elvanto or Planning Center.",
    price: 1500,
    priceCurrency: "AUD",
    priceSpecification: {
      "@type": "PriceSpecification",
      price: 1500,
      priceCurrency: "AUD",
      valueAddedTaxIncluded: false,
    },
  },
  audience: {
    "@type": "Audience",
    audienceType: "Churches",
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

const PLAN_ID = "plan";

export default function ChurchRoute() {
  const context: SharedContextProps = useOutletContext();
  const builder = useRef<PlanBuilderHandle>(null);
  const serviceTabs = useRef<ServiceTabsHandle>(null);

  const [plan, setPlan] = useState(defaultPlan);
  const [boardOpen, setBoardOpen] = useState(false);
  const [emailSource, setEmailSource] = useState<ChurchCtaSource>();
  const [pastPlanTop, setPastPlanTop] = useState(false);
  // The header's sticky wrapper reserves more height than its visible bar.
  // Measure both so the hero can start flush under the bar, not the wrapper.
  const [navBarHeight, setNavBarHeight] = useState(120);
  const [navGap, setNavGap] = useState(0);
  const [searchParams] = useSearchParams();
  // Set after mount, not during render: the prerendered page has no
  // query string, so rendering the banner straight away would mismatch.
  const [surveyInvite, setSurveyInvite] = useState<{
    name: string;
    url: string;
  }>();

  const price = priceOf(plan);

  // /church?survey=<name>&church=<church> shows the survey banner
  useEffect(() => {
    const name = searchParams.get("survey")?.trim();
    if (!name) return;
    const query = new URLSearchParams({ name });
    const church = searchParams.get("church")?.trim();
    if (church) query.set("church", church);
    setSurveyInvite({
      name,
      url: `/${CHURCH_SURVEY_ID}?${query.toString()}`,
    });
  }, [searchParams]);

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

  // The price bar rides in once the plan builder is on screen, and
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
    window.addEventListener("scroll", onScroll, {
      passive: true,
    });
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

  const showPriceBar = pastPlanTop && !boardOpen && !emailSource;

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

      {/* Starts just under the visible nav bar, then sticks to the top of
          the screen on scroll. Takes the hero's place under the header
          wrapper, so it pulls up by the same gap. */}
      {surveyInvite && (
        <a
          href={surveyInvite.url}
          target="_blank"
          rel="noopener"
          className="sticky-bar accent row middle center gap-10 p-10 w-100 border-box no-underline fade-md"
          style={{ marginTop: -navGap }}
          onClick={() => logChurchActivity(CHURCH_ACTION.SURVEY_OPEN)}
        >
          <p className="textCenter">
            Thanks for taking a look {surveyInvite.name}.{" "}
            <strong
              style={{ fontWeight: 600, textDecoration: "underline" }}
            >
              Click here
            </strong>{" "}
            to help me out big time by answering a few questions after
            you've had a look.
          </p>
          <Icon name="open-outline" size={18} color="var(--bkg)" />
        </a>
      )}

      {/* 1. Hero: video filling the screen from the bottom of the navbar
          bar down, with an outline frame inset over it */}
      <section
        className="relative clip w-100 on-media"
        style={{
          // With the survey banner above, only cancel the column's 20px gap
          marginTop: surveyInvite ? -20 : -navGap,
          height: `calc(100svh - ${navBarHeight}px)`,
        }}
      >
        <video
          className="layer-fill media-cover"
          src={CHURCH_HERO_VIDEO}
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

          <div className="col middle">
            <p data-hero style={{ maxWidth: 520 }}>
              We shoot your Sundays, then keep your{" "}
              <strong style={{ fontWeight: 600 }}>
                website, socials, slides and emails
              </strong>{" "}
              up to date every week.
            </p>
            {/* Stacked on mobile, stretched so both buttons match the wider one */}
            <div
              data-hero
              className={`gap-10 mt-20 ${
                context.inShrink
                  ? "col stretch w-fit"
                  : "row middle center"
              }`}
            >
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
                Create your comms plan
              </button>
              <BookChatButton
                source={CHURCH_CTA_SOURCE.HERO}
                white
                className="btn-pad"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="horizontal-line" />

      {/* 2. Three jobs */}
      <section className="col middle gap-20 w-75 shrink-p-10 border-box">
        <div className="row shrink-col w-100 between middle gap-20">
          <div
            className={
              context.inShrink ? "mt-20" : "mt-20 mb-20 pt-20 pb-20"
            }
          >
            <h2
              className={`w-100 ${
                context.inShrink ? "textCenter" : ""
              }`}
              style={{ letterSpacing: -1.5 }}
            >
              A new website,{" "}
              <strong style={{ fontWeight: 600 }}>
                kept current.
              </strong>
            </h2>
            <h3 className={context.inShrink ? "textCenter" : ""}>
              We'll build your church a new site for $1,500,{" "}
              <strong
                style={{
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                and keep everything up to date
              </strong>
            </h3>
          </div>
          <div
            className={`col ${
              context.inShrink ? "middle mb-20" : "end"
            }`}
          >
            <p>
              <strong style={{ fontWeight: 600 }}>So</strong> your
              vision is clear.
            </p>
            <p>
              <strong style={{ fontWeight: 600 }}>So</strong>{" "}
              newcomers feel welcomed.
            </p>
            <p>
              <strong style={{ fontWeight: 600 }}>So</strong> regulars
              know what's happening.
            </p>
          </div>
        </div>
      </section>
      <div className="horizontal-line" />

      <ProblemTabs
        jobs={CHURCH_JOBS}
        onHelp={(id) => serviceTabs.current?.openService(id)}
      />

      <div className="horizontal-line mediumFade" />

      {/* 3. What we do about it */}
      <ServiceTabs
        ref={serviceTabs}
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

      {/* 5. How does it actually work: full-bleed accent band of photo columns */}
      <section
        className={`accent col gap-20 w-100 border-box ${
          context.inShrink ? "p-20" : "p-40"
        }`}
        style={{ minHeight: "90vh" }}
      >
        <div>
          <h2
            className="textCenter text-h1"
            style={{ letterSpacing: -1.5 }}
          >
            How does it <strong>actually work</strong>?
          </h2>
          <p className="textCenter mb-20">
            Our goal is to accurately{" "}
            <b style={{ fontWeight: 600 }}>
              represent your heart online,
            </b>{" "}
            so we make collaborating with you and{" "}
            <b style={{ fontWeight: 600 }}>
              understanding your mission
            </b>{" "}
            our core focus.
          </p>
        </div>
        <ol
          className={`row shrink-col stretch gap-20 w-100 p0 m0 ${
            context.inShrink ? "" : "grow-1"
          }`}
          style={{ listStyle: "none" }}
        >
          {CHURCH_WEEK.map((step, i) => {
            // Alternate text top / bottom across the row
            const atBottom = i % 2 === 1;
            return (
              <li
                key={step.title}
                // flex-1's zero basis lets a stacked card shrink below its
                // text (and clip it), so cards size to content on mobile
                className={`relative clip r-16 on-media col min-h-320 w-100  ${
                  context.inShrink ? "" : "flex-1"
                } ${atBottom ? "bottom" : ""}`}
              >
                {/* Not lazy: lazy waited until the cards were nearly on
                    screen, so they sat blank for a few seconds. Eager +
                    low priority fetches them with the page, after the hero. */}
                <img
                  src={step.image}
                  alt=""
                  fetchPriority="low"
                  decoding="async"
                  className="layer-fill media-cover blur-2"
                />
                <div
                  className={`layer-fill ${
                    atBottom ? "scrim-bottom" : "scrim-top"
                  }`}
                />
                <div className="relative col middle gap-10 p-20 w-100 border-box textCenter">
                  {atBottom && (
                    <p
                      className="center middle mb-10"
                      style={{
                        borderRadius: "50%",
                        background: "var(--accent)",
                        width: 40,
                        height: 40,
                        left: 20,
                        top: 20,
                        color: "var(--bkg)",
                      }}
                    >
                      <strong style={{ fontWeight: 600 }}>
                        {i + 1}
                      </strong>
                    </p>
                  )}

                  <Icon name={step.icon} size={50} color="#ffffff" />
                  <h2 style={{ letterSpacing: -1.5 }}>
                    {step.title}
                  </h2>
                  <p>{boldPhrases(step.body, step.highlights)}</p>
                  {atBottom || (
                    <p
                      className="center middle mt-10"
                      style={{
                        borderRadius: "50%",
                        background: "var(--accent)",
                        width: 40,
                        height: 40,
                        left: 15,
                        top: 15,
                        color: "var(--bkg)",
                      }}
                    >
                      <strong style={{ fontWeight: 600 }}>
                        {i + 1}
                      </strong>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 6. Who's doing this */}
      <section
        className="col middle center gap-20 w-50 shrink-p-10 border-box"
        style={{ minHeight: "60vh" }}
      >
        <div className="horizontal-line" />
        <div className="row shrink-col middle gap-20 w-100">
          {/* 45% of a 50% section keeps the photo the same size it was at 30% of 75% */}
          {/* Capped on mobile, where w-45 goes full width and the 4:5 photo gets huge */}
          <div
            className={`w-45 ${context.inShrink ? "max-w-260" : ""}`}
          >
            <img
              src={FOUNDER_PHOTO}
              alt="Isaac Drury, founder of Transform Creative"
              loading="lazy"
              className="media-4-5 media-cover r-16 w-100"
            />
          </div>
          {/* Centred on mobile so the fit-content pill lines up with the text */}
          <div
            className={`col gap-10 w-100 ${
              context.inShrink ? "middle" : ""
            }`}
          >
            <h2 style={{ letterSpacing: -1.5 }}>
              Who's <strong>doing this</strong>?
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
        <div className="horizontal-line" />

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
            Could this work for <strong>your church</strong>?
          </h2>
          <p className="textCenter w-75">
            Use our cost calculator and we'll email your plan through,
            and then we'd love to have a chat with you about how we
            can help.
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

      {/* Price bar */}
      <div
        className={`sticky-bottom-bar row middle between gap-10 boxed p-10 ${
          showPriceBar ? "" : "faded-out"
        }`}
        aria-hidden={!showPriceBar}
      >
        <div className="col flex-1">
          <p className="bold num">{fmt(price.annual)}/yr</p>
          {price.setup > 0 && (
            <p className="text-sm muted">
              + {fmt(price.setup)} setup
            </p>
          )}
        </div>
        <button
          type="button"
          className="accent row middle center gap-5 no-shrink"
          tabIndex={showPriceBar ? 0 : -1}
          onClick={() => openEmail(CHURCH_CTA_SOURCE.MOBILE_BAR)}
        >
          <Icon name="mail-outline" size={16} color="var(--bkg)" />
          Email me this plan
        </button>
        {!context.inShrink && (
          <BookChatButton
            source={CHURCH_CTA_SOURCE.MOBILE_BAR}
            className="no-shrink btn-pad"
          />
        )}
      </div>

      <BoardPopup
        active={boardOpen}
        onClose={() => setBoardOpen(false)}
        onEmail={openEmail}
        annual={price.annual}
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
