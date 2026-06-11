import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import gsap from "gsap";
import type { SharedContextProps } from "~/data/CommonTypes";
import { Tooltip } from "~/presentation/elements/Tooltip/Tooltip";

/*************************************************************************
 * SavingCalculator
 *
 * Lets a prospective client estimate how much more of their fundraising
 * reaches their cause when building with Transform Creative versus using
 * a generic "percentage based" giving platform.
 *
 * The maths mirrors the `formula_chart_v2` spreadsheet. Only two values
 * are exposed as inputs (annual fundraising total + the default state of
 * the donor "cover costs" toggle). Everything else is a constant below.
 *************************************************************************/

// --- Global assumptions (from the spreadsheet) ------------------------
const AVG_DONATION = 100; // Average donation amount ($)
const STRIPE_PCT = 0.0145; // Stripe fee %
const STRIPE_FIXED = 0.3; // Stripe fixed fee per transaction ($)
const BOX_ADDON_PCT = 0.05; // Amount a donor adds when they "cover costs"

// Share of donors who leave the "cover costs" box ticked. Defaulting the
// toggle ON nudges far more donors into covering costs than defaulting OFF.
const CHECK_RATE_DEFAULT_ON = 0.8;
const CHECK_RATE_DEFAULT_OFF = 0.4;

// Defaulting the box OFF loses us ~40%+ of donors, shrinking the add-on pool
// our cut is drawn from. We lift our percentage share to compensate so the
// engagement stays viable. Derived from the rates above so it stays in sync if
// they're ever tuned (a 0.8 -> 0.4 drop means a 2x boost to hold dollars steady).
const DEFAULT_OFF_TAKE_BOOST =
  CHECK_RATE_DEFAULT_ON / CHECK_RATE_DEFAULT_OFF;

// Platform fees charged on every donation (shown in the copy as context).
const THIRD_PARTY_FEE_PCT = 0.04; // Typical giving platform — ~4%

// A third party keeps the whole add-on pool (unless redirected — see below).
const THIRD_PARTY_CAUSE_SHARE = 0;

// Our cut of the donor "admin coverage" is a sliding scale: a bigger slice for
// small orgs (so the engagement is still worthwhile) tapering to a thin slice
// for large ones. Anchored so a ~$100k org yields the floor and a ~$10M org
// hits the cap, with the dollar take clamped to [floor, cap] beyond that.
const TRANSFORM_MIN_TAKE = 5000; // floor — at least this much from a ~$100k org
const TRANSFORM_MAX_TAKE = 100_000; // cap — no more than this from a ~$10M org
const SCALE_LOW_TOTAL = 100_000; // small-org anchor
const SCALE_HIGH_TOTAL = 10_000_000; // large-org anchor
const SCALE_LOW_CUT = 0.85; // our share of add-ons at the small-org anchor
const SCALE_HIGH_CUT = 0.15; // our share of add-ons at the large-org anchor

const DEFAULT_ANNUAL_TOTAL = 1_000_000;

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const fmt = (n: number) =>
  n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

const pct = (n: number) => `${+(n * 100).toFixed(1)}%`;

/** Transform Creative's dollar cut of the donor add-on income, on a sliding
 *  scale by org size (log-interpolated between the anchors, then clamped to
 *  the floor/cap). `boost` lifts our share when the toggle defaults OFF (see
 *  DEFAULT_OFF_TAKE_BOOST). The caller caps this at the available add-on pool. */
function transformTake(
  annualTotal: number,
  adminCoverage: number,
  boost = 1,
) {
  if (annualTotal <= 0) return 0;
  const t = clamp(
    (Math.log10(annualTotal) - Math.log10(SCALE_LOW_TOTAL)) /
      (Math.log10(SCALE_HIGH_TOTAL) - Math.log10(SCALE_LOW_TOTAL)),
    0,
    1,
  );
  // Boost the share to recover the shrunken pool, but never take more than 100%.
  const cut = clamp(
    (SCALE_LOW_CUT + t * (SCALE_HIGH_CUT - SCALE_LOW_CUT)) * boost,
    0,
    1,
  );
  return clamp(
    adminCoverage * cut,
    TRANSFORM_MIN_TAKE,
    TRANSFORM_MAX_TAKE,
  );
}

interface Provider {
  /** Label shown in the card heading. */
  name: string;
  /** Emphasised part of the heading. */
  emphasis: string;
  /** The provider's dollar cut of the donor add-on income; the rest goes to
   * the cause. */
  takeOfAddOns: (
    annualTotal: number,
    adminCoverage: number,
  ) => number;
  /** Platform fee charged on donations. Omitted for us — we only ever take
   * our sliding cut of the donor add-ons. */
  feePct?: number;
}

interface ProviderResult extends Provider {
  causeGets: number;
  causeShareAmount: number;
  /** Effective share of the add-ons kept by the provider (for display). */
  providerShare: number;
  platformFee: number;
}

export interface SavingCalculatorProps {}

/******************************
 * SavingCalculator component
 */
export function SavingCalculator({}: SavingCalculatorProps) {
  const context: SharedContextProps = useOutletContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const [annualTotal, setAnnualTotal] = useState(
    DEFAULT_ANNUAL_TOTAL,
  );
  const [coverCostsDefaultOn, setCoverCostsDefaultOn] =
    useState(true);

  // Quietly adjustable assumptions, surfaced as inline inputs in the
  // disclaimer copy. They default to the spreadsheet constants.
  const [avgDonation, setAvgDonation] = useState(AVG_DONATION);
  const [adminWeighting, setAdminWeighting] =
    useState(BOX_ADDON_PCT);

  // --- Shared figures -------------------------------------------------
  const numDonations = annualTotal / avgDonation;
  const stripeFees =
    annualTotal * STRIPE_PCT + numDonations * STRIPE_FIXED;

  const checkRate = coverCostsDefaultOn
    ? CHECK_RATE_DEFAULT_ON
    : CHECK_RATE_DEFAULT_OFF;
  const adminCoverage = annualTotal * checkRate * adminWeighting;

  const providers: Provider[] = [
    {
      name: "With Transform Creative you'll get",
      emphasis: "Transform Creative",
      // Sliding cut of the add-on income, scaled by org size. When the box
      // defaults OFF the pool shrinks, so we boost our share to compensate.
      takeOfAddOns: (total, admin) =>
        transformTake(
          total,
          admin,
          coverCostsDefaultOn ? 1 : DEFAULT_OFF_TAKE_BOOST,
        ),
    },
    {
      name: "With a third party you'll get",
      emphasis: "third party",
      // They keep 100% of the add-ons when the box defaults ON. If it defaults
      // OFF, the whole add-on pool is redirected back to the org.
      takeOfAddOns: (_total, admin) =>
        coverCostsDefaultOn
          ? admin * (1 - THIRD_PARTY_CAUSE_SHARE)
          : 0,
      feePct: THIRD_PARTY_FEE_PCT,
    },
  ];

  // When the "cover costs" box is defaulted OFF, far fewer donors cover the
  // admin overhead — so the platform fee comes straight out of the cause's
  // pocket. Defaulting it ON means the donor add-ons absorb it instead.
  const platformFeeApplies = !coverCostsDefaultOn;

  const results: ProviderResult[] = providers.map((p) => {
    // Never take more than the add-on pool actually holds.
    const providerTake = Math.min(
      p.takeOfAddOns(annualTotal, adminCoverage),
      adminCoverage,
    );
    const causeShareAmount = adminCoverage - providerTake;
    const providerShare =
      adminCoverage > 0 ? providerTake / adminCoverage : 0;
    const platformFee =
      platformFeeApplies && p.feePct ? annualTotal * p.feePct : 0;
    return {
      ...p,
      causeShareAmount,
      providerShare,
      platformFee,
      causeGets:
        annualTotal - stripeFees + causeShareAmount - platformFee,
    };
  });

  const [transform, thirdParty] = results;
  const extraToCause = transform.causeGets - thirdParty.causeGets;

  // --- Tooltip copy: dollar value of each percentage + how it's derived -----
  const donationCount = Math.round(numDonations);
  const stripeTip =
    `${fmt(stripeFees)} (1.45% + 30c from ` +
    `~${(donationCount/1000).toLocaleString()}K donations)`;
  const poolNote =
    `(Assumes ${pct(checkRate)} of donors approve at a ${pct(adminWeighting)} rate)`;

  // --- Entrance animation (matches the FeeStructure house style) ------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards =
      container.querySelectorAll<HTMLElement>("[data-card]");
    gsap.set(cards, { opacity: 0, y: -10 });

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

  return (
    <div className="col w-100" ref={containerRef}>
      {/* --- Controls --- */}
      <div
        style={{ background: "var(--accent-sm)" }}
        className="row shrink-col between gap-20 mb-20 boxed p-20"
      >
        <div className="row w-100 between middle shrink-col gap-20">
          <div className="col gap-10 w-100">
            <label className="row middle gap-10 boxed p-5 shrink-col">
              <p style={{ fontWeight: 600 }}>
                Annual fundraising total
              </p>
                 <input
                className="slider"
                type="range"
                min={SCALE_LOW_TOTAL}
                max={SCALE_HIGH_TOTAL}
                step={50_000}
                value={clamp(
                  annualTotal,
                  SCALE_LOW_TOTAL,
                  SCALE_HIGH_TOTAL,
                )}
                onChange={(e) => setAnnualTotal(+e.target.value)}
                style={{
                  minWidth: 120,
                  flex: 1,
                }}
              />
              <div
                className="row middle"
                style={{
                  background: "var(--accent)",
                  borderRadius: "var(--borderRadius)",
                  color: "var(--bkg)",
                }}
              >
                
                <p className="pl-5" style={{ color: "var(--bkg)" }}>
                  $
                </p>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={(annualTotal / 1_000_000).toFixed(1)}
                  onChange={(e) =>
                    setAnnualTotal(
                      Math.max(0, +e.target.value) * 1_000_000,
                    )
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    height: "auto",
                    width: (annualTotal / 1_000_000).toFixed(1).length*15 + 10,
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    color: "var(--bkg)",
                    outline: "none",
                  }}
                />
                <p className="pr-5" style={{ color: "var(--bkg)" }}>
                  Million
                </p>
              </div>
           
            </label>
            <div className="row middle gap-10 boxed p-5 shrink-wrap between">
              <p >
                <strong>'Cover admin costs'</strong> toggle default
                state
              </p>
                <ToggleSwitch
                  on={coverCostsDefaultOn}
                  onChange={setCoverCostsDefaultOn}
                />
            </div>
          </div>
          <div className="col end center w-50 shrink-col">
            <h2>+ {fmt(extraToCause)}</h2>
            <p style={{ opacity: 0.7 }}>To your cause annually*</p>
          </div>
        </div>
      </div>

      {/* --- Comparison cards --- */}
      <div
        className={
          (context.inShrink ? "col" : "row") + " center gap-20 w-100"
        }
      >
        <div className="w-100">
          {/* Transform Creative */}
          <div
            data-card
            className="h-100 accent boxed"
            style={{ alignSelf: "stretch" }}
          >
            <div className="col middle p-20">
              <CardHeading
                name={transform.name}
                emphasis={transform.emphasis}
                amount={transform.causeGets}
              />
              <CoverageRow
                label="Stripe fees"
                amount={-stripeFees}
                split={[
                  { name: "Stripe", value: "100%", tooltip: stripeTip },
                ]}
                faded
              />
              <CoverageRow
                label="Admin coverage"
                amount={adminCoverage}
                split={[
                  {
                    name: "Transform Creative",
                    value: pct(
                      Math.round(transform.providerShare * 100) / 100,
                    ),
                    tooltip:
                      `${fmt(adminCoverage - transform.causeShareAmount)} to Transform Creative ` +
                      `${poolNote}`,
                  },
                  {
                    name: "Your cause",
                    value: pct(
                      1 -
                        Math.round(transform.providerShare * 100) /
                          100,
                    ),
                    tooltip:
                      `${fmt(transform.causeShareAmount)} back to you ` +
                      `${poolNote}, `
                  },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Third party */}
        <div className="w-100">
          <div
            data-card
            className="col middle boxed p-20"
            style={{
              alignSelf: "stretch",
              background: "var(--bkg)",
              border: "1px solid var(--accent-md)",
            }}
          >
            <CardHeading
              name={thirdParty.name}
              emphasis={thirdParty.emphasis}
              amount={thirdParty.causeGets}
              dark
            />
            <CoverageRow
              label="Stripe fees"
              amount={-stripeFees}
              split={[
                { name: "Stripe", value: "100%", tooltip: stripeTip },
              ]}
              dark
              faded
            />
            {thirdParty.platformFee > 0 && (
              <CoverageRow
                label="Platform fee"
                amount={-thirdParty.platformFee}
                split={[
                  {
                    name: "Third party",
                    value: "100%",
                    tooltip:
                      `${fmt(thirdParty.platformFee)} — a ` +
                      `${pct(THIRD_PARTY_FEE_PCT)} platform fee charged on ` +
                      `your ${fmt(annualTotal)} of donations.`,
                  },
                ]}
                dark
                faded
              />
            )}
            <CoverageRow
              label="Admin coverage"
              amount={adminCoverage}
              split={[
                {
                  name: "Third party",
                  value: pct(thirdParty.providerShare),
                  tooltip:
                    `${fmt(adminCoverage - thirdParty.causeShareAmount)}` +
                    `` +
                    `${poolNote}.`,
                },
                {
                  name: "Your cause",
                  value: pct(1 - thirdParty.providerShare),
                  tooltip:
                    `${fmt(thirdParty.causeShareAmount)} — the remaining ` +
                    `${pct(1 - thirdParty.providerShare)} of ${poolNote}.`,
                },
              ]}
              dark
            />
          </div>
        </div>
      </div>

      <p className="center mt-20" style={{ fontStyle: "italic", opacity: 0.6 }}>
          *Estimate only. Assumes an average donation of ${" "}
          <InlineNumber
            value={avgDonation}
            onChange={(v) => setAvgDonation(Math.max(0, v))}
            step={10}
            min={10}
          />{" "}
          and a{" "}
          <InlineNumber
            value={+(adminWeighting * 100).toFixed(1)}
            onChange={(v) =>
              setAdminWeighting(clamp(v, 0, 100) / 100)
            }
            step={0.5}
            min={0}
            max={100}
            suffix="%"
          />{" "}
          admin costs weighting.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------- */

interface CardHeadingProps {
  name: string;
  emphasis: string;
  amount: number;
  dark?: boolean;
}

function CardHeading({
  name,
  emphasis,
  amount,
  dark,
}: CardHeadingProps) {
  const color = dark ? "var(--txt)" : "var(--bkg)";
  const [before, after] = name.split(emphasis);
  return (
    <div className="col middle center mb-10 gap-5">
      <p style={{ color, textAlign: "center" }}>
        {before}
        <strong>{emphasis}</strong>
        {after}
      </p>
      <h2 style={{ color, margin: 0 }}>{fmt(amount)}</h2>
    </div>
  );
}

interface CoverageRowProps {
  label: string;
  amount: number;
  split: { name: string; value: string; tooltip?: string }[];
  dark?: boolean;
  faded?: boolean;
}

function CoverageRow({
  label,
  amount,
  split,
  dark,
  faded,
}: CoverageRowProps) {
    const context:SharedContextProps = useOutletContext();

  const color = dark ? "var(--txt)" : "var(--bkg)";
  const sign = amount < 0 ? "−" : "+";
  return (
    <div
      className="row shrink-wrap between middle gap-10 w-100 p-10 mb-10"
      style={{
        borderRadius: "var(--borderRadius)",
        background: dark
          ? "rgba(0, 0, 0, 0.04)"
          : "rgba(255, 255, 255, 0.08)",
        opacity: faded ? 0.85 : 1,
        color,
      }}
    >
      <div style={{ color }}>
        <strong>
          {sign} {fmt(Math.abs(amount))}
        </strong>{" "}
        {label} →
      </div>
      <div className="col" style={{ color, textAlign: "end" }}>
        {split.map((s) => (
          <div key={s.name} style={{ color }}>
            {s.name} ·{" "}
            {s.tooltip ? (
              <Tooltip
                text={s.tooltip}
                position="left"
                wrapperStyle={{ display: "inline-block", }}
                style={{ color: "var(--txt)", fontWeight: 500,zIndex: 100,maxWidth: context.inShrink ? 220 : 400 }}
              >
                <strong
                  style={{
                    color,
                    cursor: "help",
                    textDecoration: "underline dotted",
                    textUnderlineOffset: 3,
                  }}
                >
                  {s.value}
                </strong>
              </Tooltip>
            ) : (
              <strong>{s.value}</strong>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  on: boolean;
  onChange: (on: boolean) => void;
}

function ToggleSwitch({ on, onChange }: ToggleSwitchProps) {
  return (
    <div
      className="row outline-secondary "
    >
      {[true, false].map((state) => (
        <button
          key={String(state)}
          onClick={() => onChange(state)}
          style={{
            border: "none",
            cursor: "pointer",
            borderRadius: "var(--borderRadius)",
            padding: "4px 14px",
            fontWeight: 700,
            transition: "0.2s",
            background:
              on === state ? "var(--accent)" : "transparent",
            color: on === state ? "var(--bkg)" : "var(--txt)",
          }}
        >
          {state ? "On" : "Off"}
        </button>
      ))}
    </div>
  );
}

interface InlineNumberProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}

/** A number input that quietly blends into the surrounding disclaimer copy —
 *  it reads as text until a curious user clicks it. */
function InlineNumber({
  value,
  onChange,
  step,
  min,
  max,
  suffix,
}: InlineNumberProps) {
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(+e.target.value)}
        className="r0"
        style={{
          width: `${String(value).length + 2}ch`,
          border: "none",
          background: "transparent",
          font: "inherit",
          fontStyle: "italic",
          color: "inherit",
          textAlign: "center",
          padding: 0,
          height: "auto",
          borderBottom: "1px dotted black",
          outline: "none",
          cursor: "text",
        }}
      />
      {suffix}
    </span>
  );
}
