import { useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { ChurchJob, SharedContextProps } from "~/data/CommonTypes";
import { boldPhrases, useAutoCycle } from "~/business/commonBL";
import { Icon } from "~/presentation/elements/Icon";
import "../../app-v2.css";

interface Props {
  jobs: ChurchJob[];
  /** Jumps to the job's "We help churches by..." tab */
  onHelp: (serviceId: string) => void;
}

/******************************
 * ProblemTabs component
 * The /church problem section: a headline band over folder-style tabs, one
 * per job, each showing a photo beside why churches struggle with it.
 */
export function ProblemTabs({ jobs, onHelp }: Props) {
  const context: SharedContextProps = useOutletContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const { paused, ms, hoverProps } = useAutoCycle(
    jobs.length,
    activeIndex,
    setActiveIndex,
  );

  const job = jobs[activeIndex];

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-tab-content]",
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power3" },
      );
    },
    { scope: panel, dependencies: [activeIndex] },
  );

  return (
    <section className="w-75 shrink-p-10 border-box">
      <div className="col accent boxed clip w-100">
      <div className="col middle tint-1 w-100 p-20 border-box">
        <h2 className="textCenter w-75" style={{ letterSpacing: -1.5 }}>
          Church comms is{" "}
          <b style={{ fontWeight: 600 }}>three big jobs</b>
          , and in most churches it lands on one person.
        </h2>
      </div>

      <div
        className={`col w-100 border-box ${context.inShrink ? "p-10" : "p-20"}`}
        {...hoverProps}
      >
        {/* Time until the next tab; freezes with the auto-cycle on hover */}
        <div className="tint-1 h-4 w-100 r-default clip mb-20" aria-hidden>
          <div
            key={activeIndex}
            className="progress-fill"
            style={{
              animationDuration: `${ms}ms`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>

        <div role="tablist" className="row tint-1 tab-top">
          {jobs.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`problem-tab-${tab.id}`}
              aria-selected={i === activeIndex}
              aria-controls="problem-panel"
              className={`on-accent-button tab-top textLeft bold flex-card ${
                context.inShrink ? "text-md break-word p-10" : ""
              } ${i === activeIndex ? "tint-2" : "bkg-none dimmed"}`}
              style={{ flexBasis: 0, fontWeight: 600}}
              onClick={() => setActiveIndex(i)}
            >
              {tab.jobTitle}
            </button>
          ))}
        </div>

        <div
          ref={panel}
          role="tabpanel"
          id="problem-panel"
          aria-labelledby={`problem-tab-${job.id}`}
          className={`row shrink-col middle gap-20 tint-2 r-default p-20 border-box ${
            activeIndex === 0 ? "r-tl-0" : ""
          }`}
        >
          <div data-tab-content className="w-50">
            {job.jobImage ? (
              <img
                src={job.jobImage}
                alt=""
                className="media-16-9 media-cover r-default w-100"
              />
            ) : (
              <div
                className="placeholder-box media-16-9 col middle center gap-5 border-box w-100"
                style={{ borderColor: "var(--bkg)" }}
              >
                <Icon name="images-outline" size={20} color="var(--bkg)" />
                <p className="text-sm textCenter">Photo from a real Sunday</p>
              </div>
            )}
          </div>
          <div
            data-tab-content
            className={`col gap-20 r-default p-10 w-50 border-box ${
              context.inShrink ? "middle" : ""
            }`}
          >
            <h2 style={{fontSize: 30}}>
              {boldPhrases(
                job.jobBody,
                job.jobHighlight ? [job.jobHighlight] : [],
              )}
            </h2>
            <button
              type="button"
              className="boxed p-10 row middle gap-5 w-fit"
              onClick={() => onHelp(job.serviceId)}
            >
              How we help
              <Icon name="arrow-down" size={14} color="var(--bkg)" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
