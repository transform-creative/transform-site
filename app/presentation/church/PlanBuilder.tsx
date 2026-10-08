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
  itemLabel,
  itemPriceLabel,
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
import {
  CHURCH_PLAN_IMAGES,
} from "~/data/Objects";
import {
  CHURCH_ACTION,
  CHURCH_CTA_SOURCE,
  logChurchActivity,
  type ChurchCtaSource,
} from "~/data/Analytics";
import { Icon } from "~/presentation/elements/Icon";
import { PillToggle } from "~/presentation/elements/PillToggle";
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

const SYSTEM_OPTIONS = (
  Object.keys(SYSTEM_LABELS) as ChurchSystem[]
).map((value) => ({
  value,
  label: SYSTEM_LABELS[value],
}));

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
 * calculator: controls on the left, the annual price on the right. The plan
 * itself is held by the route so the mobile price bar and email form share it.
 */
export const PlanBuilder = forwardRef<
  PlanBuilderHandle,
  Props
>(function PlanBuilder(
  { plan, onChange, onEmail, onBoard },
  ref,
) {
  const context: SharedContextProps =
    useOutletContext();
  const containerRef =
    useRef<HTMLDivElement>(null);
  const totalRef =
    useRef<HTMLHeadingElement>(null);
  // Starts at the real total so the prerendered figure doesn't count up
  // from $0 on load.
  const shownTotal = useRef({
    value: priceOf(plan).annual,
  });
  const hasInteracted = useRef(false);

  const [notice, setNotice] = useState<string>();
  const [openGroups, setOpenGroups] = useState<
    Record<PlanGroupId, boolean>
  >({
    photo: true,
    content: false,
    website: false,
  });

  const price = priceOf(plan);
  const hours = hoursBack(plan);

  useImperativeHandle(ref, () => ({
    openGroup: (id) => {
      setOpenGroups((groups) => ({
        ...groups,
        [id]: true,
      }));
      scrollToId(`plan-group-${id}`, 140);
    },
  }));

  // Tween the big number between totals, like a counter.
  useEffect(() => {
    gsap.to(shownTotal.current, {
      value: price.annual,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        if (totalRef.current)
          totalRef.current.textContent = fmt(
            Math.round(shownTotal.current.value),
          );
      },
    });
  }, [price.annual]);

  // Entrance animation (matches the SavingCalculator house style).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cards =
      container.querySelectorAll<HTMLElement>(
        "[data-card]",
      );
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
    logChurchActivity(
      CHURCH_ACTION.PLAN_INTERACT,
      { control },
    );
  }

  function changeValue(
    id: string,
    value: number,
  ) {
    noteInteraction(id);
    const result = setPlanValue(plan, id, value);
    setNotice(result.notice);
    onChange(result.plan);
  }

  /** Close this section and open the one after it */
  function goToNextGroup(id: PlanGroupId) {
    const groups = CHURCH_PLAN.groups;
    const next =
      groups[groups.findIndex((g) => g.id === id) + 1];
    if (!next) return;
    noteInteraction("next");
    setOpenGroups((open) => ({
      ...open,
      [id]: false,
      [next.id]: true,
    }));
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
        style={{
          ...CARD_HIDDEN,
          background: "var(--accent-sm)",
        }}
      >
        <h2
          className="textCenter pt-20 pb-20"
          style={{
            color: "var(--accent)",
            background: "#11111122",
          }}
        >
          What would great comms cost you?
        </h2>

        <div className="row shrink-col between gap-20 p-20">
          {/* --- Controls --- */}
          <div className="col gap-10 w-100 ">
            {/* <p className="field-label">Step 1 · Your system</p>
              <PillToggle
                ariaLabel="Your church management system"
                options={SYSTEM_OPTIONS}
                value={plan.system}
                onChange={changeSystem}
              /> */}
            {plan.system === "other" && (
              <p className="text-sm accent-text">
                Let's chat, most of this still
                works.
              </p>
            )}

            {/* <div className="row middle gap-10 boxed p-5 between">
                <div className="col">
                  <p className="bold">Always included</p>
                  <p className="text-sm muted">{CHURCH_PLAN.base.note}</p>
                </div>
                <p className="text-sm no-shrink">
                  {fmt(CHURCH_PLAN.base.price)}/mo
                </p>
              </div> */}

            {CHURCH_PLAN.groups.map((group, i) => (
              <div
                key={group.id}
                id={`plan-group-${group.id}`}
                className="divided-card pt-10 pb-10 "
              >
                <button
                  type="button"
                  className="text-button row middle between w-100 mt-10"
                  aria-expanded={
                    openGroups[group.id]
                  }
                  onClick={() =>
                    setOpenGroups((groups) => ({
                      ...groups,
                      [group.id]:
                        !groups[group.id],
                    }))
                  }
                >
                  <div className="row middle gap-10">
                    <Icon
                      name={group.icon}
                      size={20}
                      color="var(--accent)"
                    />
                    <h3 className="bold">
                      {group.title}
                    </h3>
                  </div>
                  <Icon
                    name={
                      openGroups[group.id]
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={14}
                  />
                </button>
                <div
                  className={`collapse-row  ${
                    openGroups[group.id]
                      ? "open mt-10"
                      : ""
                  } `}
                >
                  <div className={`col gap-10 pt-5 `}>
                    {CHURCH_PLAN.items
                      .filter(
                        (item) =>
                          item.group === group.id,
                      )
                      .map((item) => (
                        <PlanRow
                          key={item.id}
                          item={item}
                          plan={plan}
                          onChange={(v) =>
                            changeValue(
                              item.id,
                              v,
                            )
                          }
                        />
                      ))}
                    {group.id === "photo" &&
                      notice && (
                        <p
                          className="text-sm accent-text"
                          role="status"
                        >
                          {notice}
                        </p>
                      )}
                    {i < CHURCH_PLAN.groups.length - 1 && (
                      <button
                        type="button"
                        className="row middle gap-5 mt-10 p-5 center"
                        onClick={() =>
                          goToNextGroup(group.id)
                        }
                      >
                        Next
                        <Icon
                          name="arrow-forward"
                          size={16}
                          color="var(--txt)"
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Shown once they reach the last section. Hidden on mobile,
                where the output box straight below has the same button */}
            {!context.inShrink && openGroups[
              CHURCH_PLAN.groups[
                CHURCH_PLAN.groups.length - 1
              ].id
            ] && (
              <button
                type="button"
                className="accent row middle center gap-5"
                onClick={() =>
                  onEmail(CHURCH_CTA_SOURCE.PLAN_BUILDER)
                }
              >
                <Icon
                  name="mail-outline"
                  size={16}
                  color="var(--bkg)"
                />
                Email me this plan
              </button>
            )}
          </div>

          {/* --- Output --- */}
          <div
            className={`col middle center gap-10 w-50 shrink-col boxed accent p-20 border-box ${
              context.inShrink ? "" : "sticky"
            }`}
            style={{
              top: 140,
              alignSelf: context.inShrink
                ? "stretch"
                : "flex-start",
            }}
          >
            <p className="muted">
              <strong style={{ fontWeight: 600 }}>
                Annual
              </strong>{" "}
              cost (estimate only)
            </p>
            <div className="col middle mt-10 mb-10">
              {/* h2 so the hero stays the page's only h1 */}
              <h2
                ref={totalRef}
                className="num text-h1"
                aria-live="polite"
              >
                {fmt(price.annual)}
              </h2>
              <p
                style={{
                  color: "var(--accent-md)",
                }}
              >
                + GST
              </p>
            </div>
            <p className="textCenter">
              4 ×{" "}
              <strong style={{ fontWeight: 600 }}>
                {fmt(price.quarterly)}
              </strong>{" "}
              quarterly payments
            </p>
            {price.setup > 0 && (
              <p className="bold">
                + <strong style={{fontWeight: 600}}>{fmt(price.setup)}</strong> one-off setup
              </p>
            )}
            {/* {hours !== null && (
                <p className="textCenter">≈ {hours} hrs a week back*</p>
              )}
              <p className="textCenter">
                About the cost of {coordinatorDays(price.monthly)} a week of
                a comms coordinator*
              </p> */}
           
            <div className="col gap-10 w-100 mt-20">
              <button
                type="button"
                className="bkg row middle center gap-5"
                onClick={() =>
                  onEmail(
                    CHURCH_CTA_SOURCE.PLAN_BUILDER,
                  )
                }
              >
                <Icon
                  name="mail-outline"
                  size={16}
                  color="var(--txt)"
                />
                Email me this plan
              </button>
              <BookChatButton
                source={
                  CHURCH_CTA_SOURCE.PLAN_BUILDER
                }
                onAccent
              />
               <button
              type="button"
              className="text-button middle center gap-5 mt-5"
              style={{ color: 'var(--bkg)', fontWeight: 300 }}
              onClick={() =>
                onBoard(
                  CHURCH_CTA_SOURCE.PLAN_BUILDER,
                )
              }
            >
             Download the <b style={{fontWeight: 600}}>'board summary sheet'</b>
            </button>
            </div>
          </div>
        </div>
      </div>

      <p className="textCenter text-sm muted mt-20 mb-20 pb-20">
        All plans include a baseline{" "}
        {fmt(
          CHURCH_PLAN.base.price * CHURCH_PLAN.termMonths,
        )}{" "}
        per year fee which covers quarterly strategy
        meetings and behind-the-scenes admin costs.
      </p>
    </div>
  );
});

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
function PlanRow({
  item,
  plan,
  onChange,
}: PlanRowProps) {
  const context: SharedContextProps =
    useOutletContext();
  const disabled = isItemDisabled(item, plan);
  const value = plan.values[item.id] ?? 0;
  const on = value > 0 && !disabled;
  const label = itemLabel(item, value);
  const image = CHURCH_PLAN_IMAGES[item.id];

  // One pill per allowed count, from the current floor up to the max.
  const min = minFor(item, plan);
  const countOptions = Array.from(
    { length: (item.max ?? value) - min + 1 },
    (_, i) => ({
      value: String(min + i),
      label: String(min + i),
    }),
  );

  return (
    <div
      className={`row middle gap-10 boxed p-10 shrink-wrap between layered ${
        on ? "accent" : ""
      } ${disabled ? "disabled-row" : ""}`}
      aria-disabled={disabled}
    >
      {on && image && (
        <>
          <div
            className="bg-layer bg-blur-img"
            aria-hidden="true"
            style={{ backgroundImage: `url("${image}")` }}
          />
          <div
            className="bg-layer overlay-accent"
            aria-hidden="true"
          />
        </>
      )}
      <div className="col">
        <p className="bold">{label}</p>
        {item.note && (
          <p className="text-sm muted">
            {item.note}
          </p>
        )}
      </div>
      {/* Mobile: price note sits under the toggle / pills, not beside them */}
      <div
        className={`middle gap-10 no-shrink ${
          context.inShrink ? "col-reverse gap-5" : "row"
        }`}
      >
        <p className="text-sm">
          {itemPriceLabel(item, value)}
        </p>
        {item.control === "stepper" ? (
          <PillToggle
            ariaLabel={label}
            options={countOptions}
            value={String(value)}
            inverse={on}
            className="min-w-160"
            onChange={(v) => onChange(Number(v))}
          />
        ) : (
          <ToggleSwitch
            label={label}
            on={value > 0}
            disabled={disabled}
            inverse={on}
            onChange={(next) =>
              onChange(next ? 1 : 0)
            }
          />
        )}
      </div>
    </div>
  );
}
