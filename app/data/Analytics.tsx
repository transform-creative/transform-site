import { insertLog } from "~/database/Auth";

/******************************************
 * Product analytics — the stable strings every activity row in `audit_logs`
 * is written and queried with, plus the fire-and-forget writers that emit
 * them. Mirrors the Ping Pong-A-Thon `Analytics.tsx` structure.
 *
 * Each stream gets its own `event_type`, an `as const` action map (with a
 * derived union type) and human labels for the admin dashboard. To add a
 * stream: add an `*_EVENT_TYPE`, an `*_ACTION` map + labels, and a thin typed
 * wrapper around `logActivity`.
 *
 * **Nothing is written outside production.** `insertLog` short-circuits to a
 * `console.info` in dev, so an empty `audit_logs` in dev is by design.
 */

/* ── Church page (/church) ─────────────────────────────────────────────── */

/**
 * The `event_type` column value for every /church row in `audit_logs`.
 * Keep this stable — dashboards/queries filter on it.
 */
export const CHURCH_EVENT_TYPE = "church_activity";

/**
 * Stable action codes for /church events. Use these constants at call sites
 * instead of free-text so queries stay reliable.
 */
export const CHURCH_ACTION = {
  /** First change to the plan builder on a page load */
  PLAN_INTERACT: "plan.interact",
  BOARD_POPUP_OPEN: "board_popup.open",
  /** "Email me this plan" submitted */
  PLAN_PDF_REQUEST: "plan.pdf_request",
  BOOK_CHAT_CLICK: "book_chat.click",
  /** Clicked the ?survey= banner through to /church-comms-survey */
  SURVEY_OPEN: "survey.open",
} as const;

export type ChurchAction =
  (typeof CHURCH_ACTION)[keyof typeof CHURCH_ACTION];

/**
 * Human-readable labels for each action, for the admin dashboard. Falls back
 * to the raw action string for any code not listed.
 */
export const CHURCH_ACTION_LABELS: Record<string, string> = {
  [CHURCH_ACTION.PLAN_INTERACT]: "Used the plan builder",
  [CHURCH_ACTION.BOARD_POPUP_OPEN]: "Opened board questions",
  [CHURCH_ACTION.PLAN_PDF_REQUEST]: "Requested plan PDF",
  [CHURCH_ACTION.BOOK_CHAT_CLICK]: "Clicked book a chat",
  [CHURCH_ACTION.SURVEY_OPEN]: "Opened the survey",
};

/**
 * Stable identifiers for *which* button on /church an action came from.
 */
export const CHURCH_CTA_SOURCE = {
  HEADER: "header",
  HERO: "hero",
  PRICE_THIS: "price_this",
  PLAN_BUILDER: "plan_builder",
  BOARD_POPUP: "board_popup",
  MOBILE_BAR: "mobile_bar",
  FINAL_CTA: "final_cta",
} as const;

export type ChurchCtaSource =
  (typeof CHURCH_CTA_SOURCE)[keyof typeof CHURCH_CTA_SOURCE];

export const CHURCH_CTA_SOURCE_LABELS: Record<string, string> = {
  [CHURCH_CTA_SOURCE.HEADER]: "Header button",
  [CHURCH_CTA_SOURCE.HERO]: "Hero button",
  [CHURCH_CTA_SOURCE.PRICE_THIS]: "Service card: price this",
  [CHURCH_CTA_SOURCE.PLAN_BUILDER]: "Plan builder",
  [CHURCH_CTA_SOURCE.BOARD_POPUP]: "Board popup",
  [CHURCH_CTA_SOURCE.MOBILE_BAR]: "Mobile price bar",
  [CHURCH_CTA_SOURCE.FINAL_CTA]: "Final call to action",
};

/** Per-event fields a /church row may carry on top of the actor block. */
export interface ChurchActivityExtra {
  source?: ChurchCtaSource;
  /** The control first changed (plan.interact) */
  control?: string;
  role?: string;
  monthly?: number;
}

/* ── Shared writer ─────────────────────────────────────────────────────── */

const VISITOR_KEY = "tc_visitor_id";
const SESSION_KEY = "tc_session_id";

export interface TrackingIds {
  visitor_id: string;
  session_id: string;
}

let cachedIds: TrackingIds | null = null;

/********************************************
 * getTrackingIds
 * A visitor id (localStorage, survives visits) and a session id
 * (sessionStorage, one tab visit) so rows from one visit can be joined.
 */
export function getTrackingIds(): TrackingIds {
  if (cachedIds) return cachedIds;
  if (typeof window === "undefined") {
    return { visitor_id: "", session_id: "" };
  }

  cachedIds = {
    visitor_id: readOrCreate(window.localStorage, VISITOR_KEY),
    session_id: readOrCreate(window.sessionStorage, SESSION_KEY),
  };
  return cachedIds;
}

/********************************************
 * Read an id from the given storage, creating + persisting one if absent.
 */
function readOrCreate(store: Storage, key: string): string {
  try {
    const existing = store.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    store.setItem(key, id);
    return id;
  } catch {
    // Storage can throw (private mode, blocked cookies) — fall back to an
    // in-memory id so the session is still internally consistent.
    return crypto.randomUUID();
  }
}

/********************************************
 * logActivity
 * Fire-and-forget activity logging for any stream. Adds the tracking ids and
 * a timestamp, then forwards to `insertLog` as an `info` row. Never awaited
 * and never throws into the UI.
 * @param eventType One of the `*_EVENT_TYPE` constants
 * @param action One of that stream's action codes
 * @param extra Per-event fields
 */
export function logActivity(
  eventType: string,
  action: string,
  extra?: object,
) {
  try {
    const meta = {
      action,
      ...getTrackingIds(),
      ts: new Date().toISOString(),
      ...extra,
    };
    void Promise.resolve(insertLog(eventType, "info", meta)).catch(
      () => {},
    );
  } catch {
    // Analytics must never break the page.
  }
}

/********************************************
 * logChurchActivity
 * Typed wrapper for /church events.
 */
export function logChurchActivity(
  action: ChurchAction,
  extra?: ChurchActivityExtra,
) {
  logActivity(CHURCH_EVENT_TYPE, action, extra);
}
