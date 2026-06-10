import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import gsap from "gsap";
import type { SharedContextProps } from "~/data/CommonTypes";

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

// Platform fees charged on every donation (shown in the copy as context).
const THIRD_PARTY_FEE_PCT = 0.04; // Typical giving platform — ~4%

// A third party keeps the whole add-on pool (unless redirected — see below).
const THIRD_PARTY_CAUSE_SHARE = 0;

// Our cut of the donor "admin coverage" is a sliding scale: a bigger slice for
// small orgs (so the engagement is still worthwhile) tapering to a thin slice
// for large ones. Anchored so a ~$100k org yields the floor and a ~$10M org
// hits the cap, with the dollar take clamped to [floor, cap] beyond that.
const TRANSFORM_MIN_TAKE = 3_000; // floor — at least this much from a ~$100k org
const TRANSFORM_MAX_TAKE = 80_000; // cap — no more than this from a ~$10M org
const SCALE_LOW_TOTAL = 100_000; // small-org anchor
const SCALE_HIGH_TOTAL = 10_000_000; // large-org anchor
const SCALE_LOW_CUT = 0.75; // our share of add-ons at the small-org anchor
const SCALE_HIGH_CUT = 0.2; // our share of add-ons at the large-org anchor

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
 *  the floor/cap). The caller caps this at the available add-on pool. */
function transformTake(annualTotal: number, adminCoverage: number) {
  if (annualTotal <= 0) return 0;
  const t = clamp(
    (Math.log10(annualTotal) - Math.log10(SCALE_LOW_TOTAL)) /
      (Math.log10(SCALE_HIGH_TOTAL) - Math.log10(SCALE_LOW_TOTAL)),
    0,
    1,
  );
  const cut = SCALE_LOW_CUT + t * (SCALE_HIGH_CUT - SCALE_LOW_CUT);
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

  // --- Shared figures -------------------------------------------------
  const numDonations = annualTotal / AVG_DONATION;
  const stripeFees =
    annualTotal * STRIPE_PCT + numDonations * STRIPE_FIXED;

  const checkRate = coverCostsDefaultOn
    ? CHECK_RATE_DEFAULT_ON
    : CHECK_RATE_DEFAULT_OFF;
  const adminCoverage = annualTotal * checkRate * BOX_ADDON_PCT;

  const providers: Provider[] = [
    {
      name: "With Transform Creative you'll get",
      emphasis: "Transform Creative",
      // Sliding cut of the add-on income, scaled by org size.
      takeOfAddOns: transformTake,
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
    <div className="col middle w-100" ref={containerRef}>
      {/* --- Controls --- */}
      <div            style={{ background: "var(--accent-sm)" }}
         className="col shrink-wrap middle center gap-20 mb-20 boxed pt-20 pb-20 w-100"
>
        <div className="row"
        >
          <label className="row middle gap-10">
            <p style={{ fontWeight: 600 }}>Annual fundraising total</p>
            <div
              className="row middle"
              style={{
                background: "var(--bkg)",
                borderRadius: "var(--borderRadius)",
              }}
            >
              $
              <input
                type="number"
                min={0}
                step={0.1}
                value={annualTotal / 1_000_000}
                onChange={(e) =>
                  setAnnualTotal(Math.max(0, +e.target.value) * 1_000_000)
                }
                style={{
                  border: "none",
                  background: "transparent",
                  fontWeight: 700,
                  width: 70,
                  color: "var(--txt)",
                  outline: "none",
                }}
              />
              <span style={{ paddingRight: 10, fontWeight: 700 }}>
                Million
              </span>
            </div>
          </label>
          <div className="row middle gap-10">
            <ToggleSwitch
              on={coverCostsDefaultOn}
              onChange={setCoverCostsDefaultOn}
            />
            <span>
              <strong>'Cover costs'</strong> toggle default state
            </span>
          </div>
        </div>
         <div className="col middle center mb-20">
          <h2>+ {fmt(extraToCause)}</h2>
          <p>To your cause</p>
        </div>
      </div>
     
      {/* --- Comparison cards --- */}
        <div
          className={
            (context.inShrink ? "col" : "row") +
            " middle center gap-20 w-100"
          }
        >
                <div className="w-100">

          {/* Transform Creative */}
          <div
            data-card
            className="col middle accent boxed p-20"
            style={{ alignSelf: "stretch" }}
          >
            <CardHeading
              name={transform.name}
              emphasis={transform.emphasis}
              amount={transform.causeGets}
            />
            <CoverageRow
              label="Stripe fees"
              amount={-stripeFees}
              split={[{ name: "Stripe", value: "100%" }]}
              faded
            />
            <CoverageRow
              label="Admin coverage"
              amount={adminCoverage}
              split={[
                {
                  name: "Transform Creative",
                  value: pct(transform.providerShare),
                },
                {
                  name: "Your cause",
                  value: pct(1 - transform.providerShare),
                },
              ]}
            />
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
              split={[{ name: "Stripe", value: "100%" }]}
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
                },
                {
                  name: "Your cause",
                  value: pct(1 - thirdParty.providerShare),
                },
              ]}
              dark
            />
          </div>
        </div>
      </div>

      <p className="center mt-20" style={{ fontStyle: "italic" }}>
        <em>
          Estimate only. We take a sliding share of the donor "cover
          costs" add-ons (currently {pct(transform.providerShare)},
          scaling down as you grow) versus a typical ~
          {pct(THIRD_PARTY_FEE_PCT)} platform fee on every donation,
          assuming an average donation of {fmt(AVG_DONATION)}.
        </em>
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
    <div className="col middle center mb-10">
      <span style={{ color, textAlign: "center" }}>
        {before}
        <strong>{emphasis}</strong>
        {after}
      </span>
      <h1 style={{ color, margin: 0 }}>{fmt(amount)}</h1>
    </div>
  );
}

interface CoverageRowProps {
  label: string;
  amount: number;
  split: { name: string; value: string }[];
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
      <span style={{ color }}>
        <strong>
          {sign} {fmt(Math.abs(amount))}
        </strong>{" "}
        {label} →
      </span>
      <span className="col" style={{ color, textAlign: "end" }}>
        {split.map((s) => (
          <span key={s.name} style={{ color }}>
            {s.name} · <strong>{s.value}</strong>
          </span>
        ))}
      </span>
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
      className="row"
      style={{
        background: "var(--bkg)",
        borderRadius: "var(--borderRadius)",
        padding: 3,
        gap: 3,
      }}
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
