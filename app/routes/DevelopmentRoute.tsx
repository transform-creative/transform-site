import { useEffect, useRef, useState } from "react";
import { Icon } from "~/presentation/elements/Icon";
import { Route } from "../+types/root";
import "../app-v2.css";
import FeatureSelector, {
  type Feature,
} from "~/presentation/software/FeatureSelector";
import SoftwareProjects from "~/presentation/software/SoftwareProjects";
import { FeeStructure } from "~/presentation/software/FeeStructure";
import { AnimatedDots } from "~/presentation/elements/AnimatedDots";
import { useGSAP } from "@gsap/react";
import { SplitText, ScrollTrigger } from "gsap/all";
import gsap from "gsap";
import HeaderText from "~/presentation/landing/HeaderText";
import { ScrollMoreButton } from "~/presentation/elements/ScrollMoreButton";
import { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext, useSearchParams } from "react-router";
import { ContactTab } from "~/presentation/landing/ContactTab";
import { AnimatedPageIcon } from "~/presentation/elements/AnimatedPageIcon";
import ReactPlayer from "react-player";
import { SavingCalculator } from "~/presentation/software/SavingCalculator";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title:
        "Nonprofit Website Development Adelaide | Transform Creative",
    },
    {
      name: "description",
      content:
        "Custom websites for Australian not-for-profits. Fast, accessible, on-brand sites that build donor trust — designed and built in Adelaide, SA.",
    },
    {
      name: "keywords",
      content:
        "nonprofit website development Adelaide, not for profit website design South Australia, charity website Australia, NFP software development, giving platform nonprofit",
    },
    // Open Graph
    {
      property: "og:title",
      content:
        "Nonprofit Website Development Adelaide | Transform Creative",
    },
    {
      property: "og:description",
      content:
        "Custom websites for Australian not-for-profits. Fast, accessible, on-brand sites that build donor trust — designed and built in Adelaide, SA.",
    },
    { property: "og:image", content: "/og-image.jpg" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:type", content: "website" },
    {
      property: "og:url",
      content: "https://www.transformcreative.com.au/development",
    },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content:
        "Nonprofit Website Development Adelaide | Transform Creative",
    },
    {
      name: "twitter:description",
      content:
        "Custom websites for Australian not-for-profits. Fast, accessible, on-brand sites that build donor trust.",
    },
    { name: "twitter:image", content: "/og-image.jpg" },
  ];
}

export default function DevelopmentRoute() {
  const featureSectionRef = useRef<HTMLDivElement>(null);
  const feeStructureRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  const savingsRef = useRef<HTMLDivElement>(null);
  const headerTextRef = useRef<HTMLHeadingElement>(null);
  const context: SharedContextProps = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("section") !== "savings") return;
    const top =
      (savingsRef.current?.getBoundingClientRect().top ?? 0) +
      window.scrollY -
      100;
    window.scrollTo({ top, behavior: "smooth" });
  }, [searchParams]);

  // React player vars
  const reactPlayer = useRef(null);
  const [playerPlay, setPlayerPlay] = useState(true);
  const [playerMuted, setPlayerMuted] = useState(true);

  gsap.registerPlugin(SplitText, ScrollTrigger);

  useGSAP(() => {
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

  const buttons: Feature[] = [
    {
      className: "center col middle",
      icon: { name: "card-outline", size: 50 },
      text: "No exorbitant 'platform fee'",
      description: [
        "'Percentage based' giving platforms make it easy to get started, but that ~4% fee adds up as you scale.",
        "We charge a modest fee, not a percentage of yFdonations, so you keep more of the money you raise.",
      ],
      component: (
        <div className="col middle ">
          <button
            className="row middle center gap-5 boxed"
            style={{
              color: "var(--accent)",
              background: "var(--bkg)",
            }}
            onClick={() => {
              const top =
                (feeStructureRef.current?.getBoundingClientRect()
                  .top ?? 0) +
                window.scrollY -
                100;
              window.scrollTo({ top, behavior: "smooth" });
            }}
          >
            <Icon name="arrow-down" />
            Find out more about our pricing structure
          </button>
        </div>
      ),
    },

    {
      className: "center col middle",
      icon: {
        name: "sparkles-outline",
        size: 50,
      },
      text: "Your dream features",
      description: [
        "Your out of the box giving solution is generic - it can't support all of your amazing ideas. (We can).",
        "If you're sick of your admin team telling you 'it's not possible with the current system', let's chat.",
      ],
      component: (
        <ContactTab
          headerText="Let's chat."
          buttonText="Book a 'no obligations' chat."
          showHeader={false}
          style={{ color: "var(--accent)", background: "var(--bkg)" }}
        />
      ),
    },
    {
      className: "center col middle",
      icon: {
        name: "lock-closed-outline",
        size: 50,
      },
      text: "Security customised for you",
      description: [
        "We know exactly how your users' data is stored and what's required to keep it safe.",
        "As your database grows you become a bigger target. Generic providers give you generic security. We take an active role in protecting you.",
      ],
      component: (
        <ContactTab
          headerText="Let's chat."
          buttonText="Book a 'no obligations' chat."
          showHeader={false}
          style={{ color: "var(--accent)", background: "var(--bkg)" }}
        />
      ),
    },
    {
      className: "center col middle",
      icon: { name: "people-outline", size: 50 },
      text: "Face to face support",
      description: [
        "Our local team is here to help you, (and your clients).",
        "No more waiting on hold... Send us a 'slack message' and have your problems fixed in minutes.",
      ],
      component: (
        <ContactTab
          headerText="Let's chat."
          buttonText="Book a 'no obligations' chat."
          showHeader={false}
          style={{ color: "var(--accent)", background: "var(--bkg)" }}
        />
      ),
    },
    {
      className: "center col middle",
      icon: { name: "flash-outline", size: 50 },
      text: "User focused optimisation",
      description: [
        "You current platform doesn't provide granular control over loading speed and dynamic user experience. (We do).",
        "In the modern era, a site that loads slowly can be the difference between a user making a donation or giving up. We're here to make sure your users get where you want them to.",
      ],
      component: (
        <div className="col middle ">
          <button
            className="row middle center gap-5"
            style={{
              color: "var(--accent)",
              background: "var(--bkg)",
            }}
            onClick={() => {
              const top =
                (examplesRef.current?.getBoundingClientRect().top ??
                  0) +
                window.scrollY -
                100;
              window.scrollTo({ top, behavior: "smooth" });
            }}
          >
            <Icon name="arrow-down" />
            See examples of our work
          </button>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{ minHeight: "85vh" }}
      className="col middle center gap-20 m-20 "
    >
      <div className="w-100 center col middle gap-20">
        <AnimatedDots autoPlayDelay={0} />
        <div className="col middle center">
          <div
            style={{ minHeight: "50vh" }}
            className="row middle between w-75 gap-20 shrink-col"
          >
            <div
              className="w-100"
              style={{
                aspectRatio: "16 / 9",
                borderRadius: "var(--borderRadius)",
              }}
            >
              <ReactPlayer
                src="https://api.freeflex.com.au/storage/v1/object/public/transform/Software-video.mp4"
                ref={reactPlayer}
                onClick={() => {
                  setPlayerMuted(!playerMuted);
                  !playerPlay && setPlayerPlay(true);
                }}
                style={{
                  minWidth: "100%",
                  minHeight: "100%",
                  borderRadius: "var(--borderRadius)",
                }}
                muted={playerMuted}
                loop
                playing={playerPlay}
              />
            </div>
            <div className="col gap-20 start shrink-col">
              <h2 className="shrink-col">
                We develop custom sites that <strong>
                  reduce fundraising
                  overheads
                </strong> and turn donors into believers.
              </h2>
              <div className="row gap-10 shrink-col">
                <button
                  className="accent"
                  onClick={() =>
                    setSearchParams({ section: "savings" })
                  }
                >
                  What could my org save?
                </button>
                <button className="outline">Contact us</button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="col middle w-100"
          ref={examplesRef}
          style={{ overflow: "clip" }}
        >
          <SoftwareProjects />
        </div>

        <div
          className="w-75 mb-20 pb-20 col gap-20 middle center"
          ref={savingsRef}
          style={{minHeight: '90vh'}}
        >
          {" "}
          <h2 className="textCenter accent mb-10 w-75" style={{color: "var(--txt)"}}>
            Our sites redirect third party donation fees <strong>back to you</strong>,
            allowing you to keep more of every dollar raised.
          </h2>
          <SavingCalculator />
        </div>
      </div>
      <div
        className="horizontal-line mediumFade"
        style={{ top: -30 }}
      />
      <div
        className="w-75 center accent boxed"
        ref={featureSectionRef}
      >
        <div className="p-20 w-100">
          <FeatureSelector features={buttons} />
        </div>
      </div>


      <div
        className="horizontal-line mediumFade"
        style={{ top: 0, marginTop: 100, marginBottom: 80 }}
      />

      <div className="w-100 col middle">
        <ContactTab />
      </div>
    </div>
  );
}
