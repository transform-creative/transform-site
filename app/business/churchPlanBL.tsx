/*************************************************************************
 * churchPlanBL
 *
 * Pricing + rules for the /church plan builder. Every price, hour figure and
 * range lives in CHURCH_PLAN so the offer can be re-priced in one place.
 * The functions below are pure — the builder, the mobile price bar and the
 * "Email me this plan" payload all derive from them.
 *************************************************************************/

import type { IoniconName } from "~/data/Ionicons";

export type ChurchSystem =
  | "elvanto"
  | "pco"
  | "other";
export type PlanGroupId =
  | "photo"
  | "content"
  | "website";

export interface PlanItem {
  id: string;
  group: PlanGroupId;
  /** "{times}" is swapped for the stepper count, e.g. "4 times" — see itemLabel */
  label: string;
  control: "stepper" | "toggle";
  /** Stepper range (toggles are 0/1) */
  min?: number;
  max?: number;
  /** Count for steppers, 0/1 for toggles */
  default: number;
  /** Monthly price, per unit for steppers (ignored when `tiered` is set) */
  price: number;
  /** Stepper volume pricing, per year: the first `fullUnits` (default
   *  max(1, min)) units cost `start`, then each unit after costs `step` less
   *  than the one before. `singleExtra` is added when only one is taken. */
  tiered?: {
    start: number;
    step: number;
    fullUnits?: number;
    singleExtra?: number;
  };
  /** Hours a week handed back, per unit for steppers */
  hours: number;
  /** One-off setup fee when switched on */
  setup?: number;
  /** Price wording beside the control */
  priceLabel: string;
  note?: string;
  /** Needs Elvanto or Planning Center — switched off and disabled on "other" */
  requiresSystem?: boolean;
}

export const CHURCH_PLAN = {
  base: {
    label: "Always included",
    /** Per year */
    annual: 550,
    note: "Invite plan + 30-min strategy & feedback meeting twice a year, start-up setup (Spotify, Apple Podcasts, Google Business Profile), six-monthly report",
  },
  groups: [
    {
      id: "photo",
      title: "Photo + video of your church",
      icon: "camera-outline",
    },
    { id: "website", title: "Website", icon: "globe-outline" },
    { id: "content", title: "Content", icon: "megaphone-outline" },
  ] as { id: PlanGroupId; title: string; icon: IoniconName }[],
  items: [
    {
      id: "shoots",
      group: "photo",
      label:
        "Shoot content at our church {times} each year",
      note: "Pro photo and video to feed your website, socials and slides all year.",
      control: "stepper",
      min: 1,
      max: 6,
      default: 2,
      price: 0,
      // 1 = $750, 2 = $1,400, 3 = $1,950, 4 = $2,400, 5 = $2,750, 6 = $3,000
      tiered: { start: 750, step: 100, fullUnits: 1 },
      hours: 0,
      priceLabel: "",
      //      note: "Easter, Christmas and launch Sundays count as 2",
    },
    // {
    //   id: "reels",
    //   group: "content",
    //   label: "Sermon reels a week",
    //   control: "stepper",
    //   min: 0,
    //   max: 3,
    //   default: 1,
    //   price: 120,
    //   hours: 1.5,
    //   priceLabel: "$120/mo each",
    //   note: "Needs a clean audio feed from my sound desk. We set it up.",
    // },
   
    {
      id: "posts",
      group: "content",
      label: "Post on our social media {times} each week",
      control: "stepper",
      min: 0,
      max: 5,
      default: 1,
      price: 0,
      tiered: { start: 1000, step: 100 },
      hours: 0.5,
      priceLabel: "",
    },
     {
      id: "announcementSlides",
      group: "content",
      label: "Design our notice slides",
      control: "toggle",
      default: 1,
      price: 60,
      hours: 1,
      priceLabel: "$720/yr",
    },
    {
      id: "podcast",
      group: "content",
      label: "Upload our sermon podcast/video weekly",
      note: "We teach your team how to record it, then handle the weekly upload to your platforms.",
      control: "toggle",
      default: 0,
      price: 40,
      hours: 0.5,
      priceLabel: "$480 / yr",
    },
    {
      id: "email",
      group: "content",
      label: "Draft our email weekly",
      note: "Built from what's on in Elvanto or Planning Center, plus anything else you send us.",
      control: "toggle",
      default: 0,
      price: 75,
      hours: 2,
      priceLabel: "$900/yr",
    },

    // {
    //   id: "sermonSlides",
    //   group: "content",
    //   label: "Sermon slides",
    //   control: "toggle",
    //   default: 1,
    //   price: 100,
    //   hours: 1.5,
    //   priceLabel: "$100/mo",
    // },
    // {
    //   id: "followUpPack",
    //   group: "content",
    //   label: "Sermon follow-up pack",
    //   control: "toggle",
    //   default: 1,
    //   price: 100,
    //   hours: 1.5,
    //   priceLabel: "$100/mo",
    //   note: "my pastor approves it each week",
    // },

    // {
    //   id: "brochure",
    //   group: "content",
    //   label: "Monthly brochure design",
    //   control: "toggle",
    //   default: 0,
    //   // TODO: confirm brochure price and hours
    //   price: 100,
    //   hours: 0.75,
    //   priceLabel: "$200/mo",
    //   note: "You give us w",
    // },
    {
      id: "websiteBuild",
      group: "website",
      label: "A new website for your church",
      note: "Designed around your strategy and connected to Elvanto or Planning Center.",
      control: "toggle",
      default: 1,
      hours: 0.5,
      setup: 1500,
      price: 0,
      priceLabel: "$1,500 / one off",
    },
    {
      id: "websiteCare",
      group: "website",
      label: "Keep our website current",
      note: "We regularly update your service times, events, sermons and photos.",
      control: "toggle",
      default: 1,
      hours: 0.5,
      price: 230,
      priceLabel: "$2,760 / yr",
      requiresSystem: true,
    },
  ] as PlanItem[],
  /** Time spent on approvals, taken off the hours handed back */
  approvalHours: 0.5,
  /** Monthly cost of one day a week of a comms coordinator */
  coordinatorDayMonthly: 1270,
  /** Four or more posts a week needs at least four shoots a year */
  postsShootRule: {
    postsAtLeast: 4,
    minShoots: 4,
  },
  termMonths: 12,
  /** Church size used for the "cents per person, per week" line. Keep in
   *  sync with GIVING_MEMBERS in supabase/functions/_shared/church-plan-pdf.ts */
  givingMembers: 200,
};

/** A `type` (not interface) so it is assignable to the Json column the lead
 *  is saved into. */
export type ChurchPlan = {
  system: ChurchSystem;
  /** Item id → count (steppers) or 0/1 (toggles) */
  values: Record<string, number>;
};

/** A priced row of the plan. A `type` (not interface) so it is assignable to
 *  the Json column it is saved into. */
export type PlanLineItem = {
  id: string;
  label: string;
  qty: number;
  /** Kept for leads saved before pricing went annual */
  monthly: number;
  annual: number;
};

export interface PlanPrice {
  monthly: number;
  setup: number;
  annual: number;
  /** The annual total split into four quarterly payments */
  quarterly: number;
  lineItems: PlanLineItem[];
}

export const SYSTEM_LABELS: Record<
  ChurchSystem,
  string
> = {
  elvanto: "Elvanto",
  pco: "Planning Center",
  other: "Other",
};

export const SHOOTS_BUMPED_NOTICE =
  "Four or more posts a week needs at least 4 shoots a year, so we've bumped that up.";

export const planItem = (id: string) =>
  CHURCH_PLAN.items.find((i) => i.id === id)!;

/*******************************
 * An item's label with its count filled in ("{times}" → "4 times").
 */
export function itemLabel(
  item: PlanItem,
  qty: number,
): string {
  return item.label.replace(
    "{times}",
    `${qty} ${qty === 1 ? "time" : "times"}`,
  );
}

/*******************************
 * What an item costs a year at a given count. Tiered steppers get cheaper
 * per unit: e.g. shoots 1 = $750, 2 = $1,400, 3 = $1,950, 4 = $2,400.
 */
export function itemAnnual(
  item: PlanItem,
  qty: number,
): number {
  if (!item.tiered)
    return item.price * qty * CHURCH_PLAN.termMonths;
  const { start, step, singleExtra = 0 } = item.tiered;
  const fullUnits =
    item.tiered.fullUnits ?? Math.max(1, item.min ?? 0);
  let total = qty === 1 ? singleExtra : 0;
  for (let unit = 1; unit <= qty; unit++)
    total += Math.max(
      0,
      start - step * Math.max(0, unit - fullUnits),
    );
  return total;
}

/*******************************
 * Price wording beside an item's control. Tiered steppers show their
 * calculated total for the current count.
 */
export function itemPriceLabel(
  item: PlanItem,
  qty: number,
): string {
  if (!item.tiered) return item.priceLabel;
  return itemAnnual(item, qty).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

/*******************************
 * The plan a church of 300–500 usually needs.
 */
export function defaultPlan(): ChurchPlan {
  return {
    system: "elvanto",
    values: Object.fromEntries(
      CHURCH_PLAN.items.map((i) => [
        i.id,
        i.default,
      ]),
    ),
  };
}

/*******************************
 * Lowest a stepper may go given the rest of the plan (posts lift the shoots
 * floor).
 */
export function minFor(
  item: PlanItem,
  plan: ChurchPlan,
): number {
  const { postsAtLeast, minShoots } =
    CHURCH_PLAN.postsShootRule;
  if (
    item.id === "shoots" &&
    plan.values.posts >= postsAtLeast
  )
    return Math.max(item.min ?? 0, minShoots);
  return item.min ?? 0;
}

/*******************************
 * True when the item can't be used on the plan's system.
 */
export function isItemDisabled(
  item: PlanItem,
  plan: ChurchPlan,
) {
  return (
    !!item.requiresSystem &&
    plan.system === "other"
  );
}

/*******************************
 * Set one item's value, applying the plan rules. Returns the new plan and a
 * notice when a rule changed something the user didn't touch.
 */
export function setPlanValue(
  plan: ChurchPlan,
  id: string,
  value: number,
): { plan: ChurchPlan; notice?: string } {
  const item = planItem(id);
  if (isItemDisabled(item, plan)) return { plan };

  const max =
    item.control === "toggle"
      ? 1
      : item.max ?? value;
  const values = {
    ...plan.values,
    [id]: Math.min(
      Math.max(value, minFor(item, plan)),
      max,
    ),
  };

  const { postsAtLeast, minShoots } =
    CHURCH_PLAN.postsShootRule;
  if (
    values.posts >= postsAtLeast &&
    values.shoots < minShoots
  ) {
    values.shoots = minShoots;
    return {
      plan: { ...plan, values },
      notice: SHOOTS_BUMPED_NOTICE,
    };
  }

  return { plan: { ...plan, values } };
}

/*******************************
 * Switch church management system. "Other" switches the system-dependent
 * items off; moving back to Elvanto or Planning Center turns them back on.
 */
export function setPlanSystem(
  plan: ChurchPlan,
  system: ChurchSystem,
): ChurchPlan {
  const values = { ...plan.values };
  for (const item of CHURCH_PLAN.items) {
    if (!item.requiresSystem) continue;
    if (system === "other") values[item.id] = 0;
    else if (plan.system === "other")
      values[item.id] = 1;
  }
  return { system, values };
}

/*******************************
 * Price the plan: annual (+ quarterly split) and one-off setup, with line
 * items for the PDF.
 */
export function priceOf(
  plan: ChurchPlan,
): PlanPrice {
  const lineItems: PlanLineItem[] = [
    {
      id: "base",
      label: CHURCH_PLAN.base.label,
      qty: 1,
      monthly: CHURCH_PLAN.base.annual / CHURCH_PLAN.termMonths,
      annual: CHURCH_PLAN.base.annual,
    },
  ];
  let setup = 0;
  // Summed per year so tiered prices stay whole dollars
  let annual = CHURCH_PLAN.base.annual;

  for (const item of CHURCH_PLAN.items) {
    const qty = plan.values[item.id] ?? 0;
    if (qty <= 0) continue;
    const itemYear = itemAnnual(item, qty);
    lineItems.push({
      id: item.id,
      label: itemLabel(item, qty),
      qty,
      monthly: itemYear / CHURCH_PLAN.termMonths,
      annual: itemYear,
    });
    annual += itemYear;
    setup += item.setup ?? 0;
  }

  const monthly = annual / CHURCH_PLAN.termMonths;
  return {
    monthly,
    setup,
    annual,
    quarterly: annual / 4,
    lineItems,
  };
}

/*******************************
 * Annual price of the smallest possible plan: every item at its minimum
 * (toggles off). Used in copy like "the smallest plan starts at…".
 */
export function smallestPlanAnnual(): number {
  return priceOf({
    system: "elvanto",
    values: Object.fromEntries(
      CHURCH_PLAN.items.map((i) => [i.id, i.min ?? 0]),
    ),
  }).annual;
}

const roundToHalf = (n: number) =>
  Math.round(n * 2) / 2;

/*******************************
 * Hours a week handed back, less approval time, to the nearest half hour.
 * Null when it's under an hour (the line is hidden).
 */
export function hoursBack(
  plan: ChurchPlan,
): number | null {
  const total = CHURCH_PLAN.items.reduce(
    (sum, i) =>
      sum + i.hours * (plan.values[i.id] ?? 0),
    0,
  );
  const back = roundToHalf(
    total - CHURCH_PLAN.approvalHours,
  );
  return back < 1 ? null : back;
}

/*******************************
 * The annual total spread across CHURCH_PLAN.givingMembers, per week, in
 * words ("96 cents", "$1.25"). Keep in sync with perPersonWeekly in
 * supabase/functions/_shared/church-plan-pdf.ts
 */
export function perPersonWeekly(
  annual: number,
): string {
  const cents = Math.round(
    (annual * 100) / CHURCH_PLAN.givingMembers / 52,
  );
  if (cents < 100) return `${cents} cents`;
  return `$${(cents / 100).toFixed(2)}`;
}

/*******************************
 * The monthly total as days a week of a comms coordinator, in words.
 */
export function coordinatorDays(
  monthly: number,
): string {
  const days = Math.max(
    0.5,
    roundToHalf(
      monthly / CHURCH_PLAN.coordinatorDayMonthly,
    ),
  );
  if (days === 0.5) return "half a day";
  return days === 1 ? "1 day" : `${days} days`;
}
