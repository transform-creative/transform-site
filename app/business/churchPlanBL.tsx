/*************************************************************************
 * churchPlanBL
 *
 * Pricing + rules for the /church plan builder. Every price, hour figure and
 * range lives in CHURCH_PLAN so the offer can be re-priced in one place.
 * The functions below are pure — the builder, the mobile price bar and the
 * "Email me this plan" payload all derive from them.
 *************************************************************************/

export type ChurchSystem = "elvanto" | "pco" | "other";
export type PlanGroupId = "photo" | "content" | "website";

export interface PlanItem {
  id: string;
  group: PlanGroupId;
  label: string;
  control: "stepper" | "toggle";
  /** Stepper range (toggles are 0/1) */
  min?: number;
  max?: number;
  /** Count for steppers, 0/1 for toggles */
  default: number;
  /** Monthly price, per unit for steppers */
  price: number;
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
    price: 250,
    note: "Quarterly invite plan + 30-min call, start-up setup (Spotify, Apple Podcasts, Google Business Profile), monthly report",
  },
  groups: [
    { id: "photo", title: "Photo + video" },
    { id: "content", title: "Content" },
    { id: "website", title: "Website" },
  ] as { id: PlanGroupId; title: string }[],
  items: [
    {
      id: "shoots",
      group: "photo",
      label: "Shoots a year",
      control: "stepper",
      min: 2,
      max: 6,
      default: 4,
      price: 100,
      hours: 0,
      priceLabel: "$100/mo each",
      note: "Easter, Christmas and launch Sundays count as 2",
    },
    {
      id: "reels",
      group: "content",
      label: "Sermon reels a week",
      control: "stepper",
      min: 0,
      max: 3,
      default: 1,
      price: 120,
      hours: 1.5,
      priceLabel: "$120/mo each",
      note: "Needs a clean audio feed from your sound desk. We set it up.",
    },
    {
      id: "posts",
      group: "content",
      label: "Feed posts a week",
      control: "stepper",
      min: 0,
      max: 5,
      default: 2,
      price: 40,
      hours: 0.5,
      priceLabel: "$40/mo each",
    },
    {
      id: "email",
      group: "content",
      label: "Weekly email",
      control: "toggle",
      default: 1,
      price: 150,
      hours: 2,
      priceLabel: "$150/mo",
    },
    {
      id: "announcementSlides",
      group: "content",
      label: "Announcement slides",
      control: "toggle",
      default: 1,
      price: 60,
      hours: 1,
      priceLabel: "$60/mo",
    },
    {
      id: "sermonSlides",
      group: "content",
      label: "Sermon slides",
      control: "toggle",
      default: 1,
      price: 100,
      hours: 1.5,
      priceLabel: "$100/mo",
      note: "Sermon notes in by Thursday",
    },
    {
      id: "followUpPack",
      group: "content",
      label: "Sermon follow-up pack",
      control: "toggle",
      default: 1,
      price: 100,
      hours: 1.5,
      priceLabel: "$100/mo",
      note: "Your pastor approves it each week",
    },
    {
      id: "podcast",
      group: "content",
      label: "Sermon podcast",
      control: "toggle",
      default: 0,
      price: 40,
      hours: 0.5,
      priceLabel: "$40/mo",
    },
    {
      id: "brochure",
      group: "content",
      label: "Monthly brochure",
      control: "toggle",
      default: 0,
      // TODO: confirm brochure price and hours
      price: 100,
      hours: 0.75,
      priceLabel: "$100/mo",
      note: "Designed in your church's template, print-ready PDF",
    },
    {
      id: "hub",
      group: "website",
      label: "Sermon hub + plan a visit",
      control: "toggle",
      default: 1,
      price: 300,
      hours: 0.5,
      setup: 1500,
      priceLabel: "$300/mo + $1,500 setup",
      note: "Needs a named welcome contact",
      requiresSystem: true,
    },
  ] as PlanItem[],
  /** Time spent on approvals, taken off the hours handed back */
  approvalHours: 0.5,
  /** Monthly cost of one day a week of a comms coordinator */
  coordinatorDayMonthly: 1270,
  /** Four or more posts a week needs at least four shoots a year */
  postsShootRule: { postsAtLeast: 4, minShoots: 4 },
  termMonths: 12,
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
  monthly: number;
};

export interface PlanPrice {
  monthly: number;
  setup: number;
  annual: number;
  lineItems: PlanLineItem[];
}

export const SYSTEM_LABELS: Record<ChurchSystem, string> = {
  elvanto: "Elvanto",
  pco: "Planning Center",
  other: "Other",
};

export const SHOOTS_BUMPED_NOTICE =
  "Four or more posts a week needs at least 4 shoots a year, so we've bumped that up.";

export const planItem = (id: string) =>
  CHURCH_PLAN.items.find((i) => i.id === id)!;

/*******************************
 * The plan a church of 300–500 usually needs.
 */
export function defaultPlan(): ChurchPlan {
  return {
    system: "elvanto",
    values: Object.fromEntries(
      CHURCH_PLAN.items.map((i) => [i.id, i.default]),
    ),
  };
}

/*******************************
 * Lowest a stepper may go given the rest of the plan (posts lift the shoots
 * floor).
 */
export function minFor(item: PlanItem, plan: ChurchPlan): number {
  const { postsAtLeast, minShoots } = CHURCH_PLAN.postsShootRule;
  if (item.id === "shoots" && plan.values.posts >= postsAtLeast)
    return Math.max(item.min ?? 0, minShoots);
  return item.min ?? 0;
}

/*******************************
 * True when the item can't be used on the plan's system.
 */
export function isItemDisabled(item: PlanItem, plan: ChurchPlan) {
  return !!item.requiresSystem && plan.system === "other";
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

  const max = item.control === "toggle" ? 1 : (item.max ?? value);
  const values = {
    ...plan.values,
    [id]: Math.min(Math.max(value, minFor(item, plan)), max),
  };

  const { postsAtLeast, minShoots } = CHURCH_PLAN.postsShootRule;
  if (values.posts >= postsAtLeast && values.shoots < minShoots) {
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
    else if (plan.system === "other") values[item.id] = 1;
  }
  return { system, values };
}

/*******************************
 * Price the plan: monthly + one-off setup, with line items for the PDF.
 */
export function priceOf(plan: ChurchPlan): PlanPrice {
  const lineItems: PlanLineItem[] = [
    {
      id: "base",
      label: CHURCH_PLAN.base.label,
      qty: 1,
      monthly: CHURCH_PLAN.base.price,
    },
  ];
  let setup = 0;

  for (const item of CHURCH_PLAN.items) {
    const qty = plan.values[item.id] ?? 0;
    if (qty <= 0) continue;
    lineItems.push({
      id: item.id,
      label:
        item.control === "stepper"
          ? `${item.label}: ${qty}`
          : item.label,
      qty,
      monthly: item.price * qty,
    });
    setup += item.setup ?? 0;
  }

  const monthly = lineItems.reduce((sum, l) => sum + l.monthly, 0);
  return {
    monthly,
    setup,
    annual: monthly * CHURCH_PLAN.termMonths,
    lineItems,
  };
}

const roundToHalf = (n: number) => Math.round(n * 2) / 2;

/*******************************
 * Hours a week handed back, less approval time, to the nearest half hour.
 * Null when it's under an hour (the line is hidden).
 */
export function hoursBack(plan: ChurchPlan): number | null {
  const total = CHURCH_PLAN.items.reduce(
    (sum, i) => sum + i.hours * (plan.values[i.id] ?? 0),
    0,
  );
  const back = roundToHalf(total - CHURCH_PLAN.approvalHours);
  return back < 1 ? null : back;
}

/*******************************
 * The monthly total as days a week of a comms coordinator, in words.
 */
export function coordinatorDays(monthly: number): string {
  const days = Math.max(
    0.5,
    roundToHalf(monthly / CHURCH_PLAN.coordinatorDayMonthly),
  );
  if (days === 0.5) return "half a day";
  return days === 1 ? "1 day" : `${days} days`;
}
