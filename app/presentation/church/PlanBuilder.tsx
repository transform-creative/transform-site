import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useOutletContext } from "react-router";
import gsap from "gsap";
import type { SharedContextProps } from "~/data/CommonTypes";
import {
  CHURCH_PLAN,
  SYSTEM_LABELS,
  coordinatorDays,
  hoursBack,
  isItemDisabled,
  minFor,
  priceOf,
  setPlanSystem,
  setPlanValue,
  type ChurchPlan,
  type ChurchSystem,
  type PlanGroupId,
  type PlanItem,
} from "~/business/churchPlanBL";
import { scrollToId } from "~/business/commonBL";
import { CHURCH_FOOTNOTE } from "~/data/Objects";
import {
  CHURCH_ACTION,
  CHURCH_CTA_SOURCE,
  logChurchActivity,
  type ChurchCtaSource,
} from "~/data/Analytics";
import { Icon } from "~/presentation/elements/Icon";
import { PillToggle } from "~/presentation/elements/PillToggle";
import { Stepper } from "~/presentation/elements/Stepper";
import { ToggleSwitch } from "~/presentation/elements/ToggleSwitch";
import { BookChatButton } from "./BookChatButton";
import "../../app-v2.css";

/**
 * Starting state for the entrance animation, applied in the markup so the
 * prerendered HTML is already hidden — GSAP reveals it on scroll-in.
 */
const CARD_HIDDEN = {
  opacity: 0,
  transform: "translateY(-10px)",
} as const;

export const fmt = (n: number) =>
  n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

const SYSTEM_OPTIONS = (Object.keys(SYSTEM_LABELS) as ChurchSystem[]).map(
  (value) => ({ value, label: SYSTEM_LABELS[value] }),
);

export interface PlanBuilderHandle {
  /** Open a group's controls and scroll to it ("Price this →") */
  openGroup: (id: PlanGroupId) => void;
}

interface Props {
  plan: ChurchPlan;
  onChange: (plan: ChurchPlan) => void;
  onEmail: (source: ChurchCtaSource) => void;
  onBoard: (source: ChurchCtaSource) => void;
}

/******************************
 * PlanBuilder component
 * The /church plan builder. Same card as the /development savings
 * calculator: controls on the left, the monthly price on the right. The plan
 * itself is held by the route so the mobile price bar and email form share it.
 */
export const PlanBuilder = forwardRef<PlanBuilderHandle, Props>(
  function PlanBuilder({ plan, onChange, onEmail, onBoard }, ref) {
    const context: SharedContextProps = useOutletContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const totalRef = useRef<HTMLHeadingElement>(null);
    // Starts at the real total so the prerendered figure doesn't count up
    // from $0 on load.
    const shownTotal = useRef({ value: priceOf(plan).monthly });
    const hasInteracted = useRef(false);

    const [notice, setNotice] = useState<string>();
    const [openGroups, setOpenGroups] = useState<
      Record<PlanGroupId, boolean>
    >({ photo: true, content: true, website: true });

    const price = priceOf(plan);
    const hours = hoursBack(plan);

    useImperativeHandle(ref, () => ({
      openGroup: (id) => {
        setOpenGroups((groups) => ({ ...groups, [id]: true }));
        scrollToId(`plan-group-${id}`, 140);
      },
    }));

    // Only the content group starts open on small screens — it's the long one
    // and the one most churches tweak.
    useEffect(() => {
      setOpenGroups({
        photo: !context.inShrink,
        content: true,
        website: !context.inShrink,
      });
    }, [context.inShrink]);

    // Tween the big number between totals, like a counter.
    useEffect(() => {
      gsap.to(shownTotal.current, {
        value: price.monthly,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => {
          if (totalRef.current)
            totalRef.current.textContent = fmt(
              Math.round(shownTotal.current.value),
            );
        },
      });
    }, [price.monthly]);

    // Entrance animation (matches the SavingCalculator house style).
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const cards = container.querySelectorAll<HTMLElement>("[data-card]");
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            gsap.to(cards, {
              opacity: 1,
              y: 0,
              stagger: 0.15,
              ease: "power3",
              duration: 0.6,
            });
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    function noteInteraction(control: string) {
      if (hasInteracted.current) return;
      hasInteracted.current = true;
      logChurchActivity(CHURCH_ACTION.PLAN_INTERACT, { control });
    }

    function changeValue(id: string, value: number) {
      noteInteraction(id);
      const result = setPlanValue(plan, id, value);
      setNotice(result.notice);
      onChange(result.plan);
    }

    function changeSystem(system: ChurchSystem) {
      noteInteraction("system");
      setNotice(undefined);
      onChange(setPlanSystem(plan, system));
    }

    return (
      <div className="col w-100" ref={containerRef}>
        <div
          data-card
          className="boxed outline-accent"
          style={{ ...CARD_HIDDEN, background: "var(--accent-sm)" }}
        >
          <h2
            className="textCenter pt-10 pb-10"
            style={{ background: "#11111122", color: "var(--accent)" }}
          >
            Build your plan
          </h2>


          <div className="row shrink-col between gap-20 p-20">
            {/* --- Controls --- */}
            <div className="col gap-10 w-100">
              <p className="field-label">Step 1 · Your system</p>
              <PillToggle
                ariaLabel="Your church management system"
                options={SYSTEM_OPTIONS}
                value={plan.system}
                onChange={changeSystem}
              />
              {plan.system === "other" && (
                <p className="text-sm accent-text">
                  Let's chat, most of this still works.
                </p>
              )}

              <p className="field-label mt-10">Step 2 · Build your plan</p>
              <div className="row middle gap-10 boxed p-5 between">
                <div className="col">
                  <p className="bold">{CHURCH_PLAN.base.label}</p>
                  <p className="text-sm muted">{CHURCH_PLAN.base.note}</p>
                </div>
                <p className="text-sm no-shrink">
                  {fmt(CHURCH_PLAN.base.price)}/mo
                </p>
              </div>

              {CHURCH_PLAN.groups.map((group) => (
                <div key={group.id} id={`plan-group-${group.id}`}>
                  <button
                    type="button"
                    className="text-button row middle between w-100 mt-10"
                    aria-expanded={openGroups[group.id]}
                    onClick={() =>
                      setOpenGroups((groups) => ({
                        ...groups,
                        [group.id]: !groups[group.id],
                      }))
                    }
                  >
                    <h3 className="bold">{group.title}</h3>
                    <Icon
                      name={
                        openGroups[group.id] ? "chevron-up" : "chevron-down"
                      }
                      size={14}
                    />
                  </button>
                  <div
                    className={`collapse-row ${openGroups[group.id] ? "open" : ""}`}
                  >
                    <div className="col gap-10 pt-5">
                      {CHURCH_PLAN.items
                        .filter((item) => item.group === group.id)
                        .map((item) => (
                          <PlanRow
                            key={item.id}
                            item={item}
                            plan={plan}
                            onChange={(v) => changeValue(item.id, v)}
                          />
                        ))}
                      {group.id === "photo" && notice && (
                        <p className="text-sm accent-text" role="status">
                          {notice}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* --- Output --- */}
            <div
              className="col middle center gap-10 w-50 shrink-col sticky"
              style={{ top: 140, alignSelf: "flex-start" }}
            >
              <p className="muted">Your plan, a month ex GST*</p>
              <h1 ref={totalRef} className="num" aria-live="polite">
                {fmt(price.monthly)}
              </h1>
              {price.setup > 0 && (
                <p className="bold">+ {fmt(price.setup)} one-off setup</p>
              )}
              {hours !== null && (
                <p className="textCenter">≈ {hours} hrs a week back*</p>
              )}
              <p className="textCenter">
                About the cost of {coordinatorDays(price.monthly)} a week of
                a comms coordinator*
              </p>
              <button
                type="button"
                className="text-button accent-text"
                onClick={() => onBoard(CHURCH_CTA_SOURCE.PLAN_BUILDER)}
              >
                Taking this to your board?
              </button>
              <div className="col gap-10 w-100">
                <button
                  type="button"
                  className="accent row middle center gap-5"
                  onClick={() => onEmail(CHURCH_CTA_SOURCE.PLAN_BUILDER)}
                >
                  <Icon name="mail-outline" size={16} color="var(--bkg)" />
                  Email me this plan
                </button>
                <BookChatButton source={CHURCH_CTA_SOURCE.PLAN_BUILDER} />
              </div>
            </div>
          </div>
        </div>

        <p
          className="textCenter mt-20 text-sm"
          style={{ fontStyle: "italic", opacity: 0.6 }}
        >
          {CHURCH_FOOTNOTE.text} (
          <a
            className="link"
            href={CHURCH_FOOTNOTE.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {CHURCH_FOOTNOTE.sourceLabel}
          </a>
          ).
        </p>
      </div>
    );
  },
);

/* -------------------------------------------------------------------- */

interface PlanRowProps {
  item: PlanItem;
  plan: ChurchPlan;
  onChange: (value: number) => void;
}

/******************************
 * One priced line of the builder: label + note on the left, price and its
 * stepper / toggle on the right.
 */
function PlanRow({ item, plan, onChange }: PlanRowProps) {
  const disabled = isItemDisabled(item, plan);
  const value = plan.values[item.id] ?? 0;

  return (
    <div
      className={`row middle gap-10 boxed p-5 shrink-wrap between ${disabled ? "disabled-row" : ""}`}
      aria-disabled={disabled}
    >
      <div className="col">
        <p className="bold">{item.label}</p>
        {item.note && <p className="text-sm muted">{item.note}</p>}
      </div>
      <div className="row middle gap-10 no-shrink">
        <p className="text-sm">{item.priceLabel}</p>
        {item.control === "stepper" ? (
          <Stepper
            label={item.label}
            value={value}
            min={minFor(item, plan)}
            max={item.max ?? value}
            disabled={disabled}
            onChange={onChange}
          />
        ) : (
          <ToggleSwitch
            label={item.label}
            on={value > 0}
            disabled={disabled}
            onChange={(on) => onChange(on ? 1 : 0)}
          />
        )}
      </div>
    </div>
  );
}
