/*************************************************************************
 * This is where we keep types which are regularly used accross projects
 */

import type { Session } from "@supabase/supabase-js";
import { NavigateFunction } from "react-router";
import type { IoniconName } from "./Ionicons";

export type PopAlertFn = (
  header: string,
  body?: string,
  isError?: boolean
) => void;

export type AlertType = {
  active: boolean;
  header?: string;
  body?: string;
  state?: "success" | "fail";
};

export interface InputOption {
  value: any;
  label: any;
}

export interface SharedContextProps {
  popAlert: PopAlertFn;
  session: Session | null;
  navigate: NavigateFunction;
  inShrink:boolean;
}

/** An item that can be shown or hidden */
export interface ActivatableElement {
  active: boolean;
  onClose: () => void;
}

export type ErrorLabelType = {
  selector?: string;
  active: boolean;
  text?: string;
  safe?: boolean;
};

/**A table from the supabase database */
interface SupabaseTable {
  id: number;
  created_at: Date;
}

export interface Project {
  id: number,
  name: string,
  video?: string,
  organisation?: string,
  type: "software" | "media" | "design"
  images: string[],
  description: string[],
  link?:string;
  endorsement?: {name: string, text: string} 
}

/** One of the three church comms jobs (/church sections 2 + 3 share these) */
export interface ChurchJob {
  /** Plan builder group this job prices into */
  id: "photo" | "content" | "website";
  icon: IoniconName;
  color: string;
  /** Section 2: the problem */
  jobTitle: string;
  jobBody: string;
  /** Phrase within jobBody to bold */
  jobHighlight?: string;
  /** Photo shown beside jobBody in the problem tabs */
  jobImage?: string;
  /** "We help churches by..." tab the "How we help" button opens */
  serviceId: string;
  /** Section 3: what we do about it */
  serviceTitle: string;
  serviceTagline: string;
  serviceBody: string[];
}

/** One "We help churches by..." tab on /church */
export interface ChurchService {
  id: string;
  /** Emphasised first word of the tab label, e.g. "Capturing" */
  verb: string;
  /** Rest of the tab label, e.g. "your Sunday" */
  rest: string;
  body: string;
  /** Phrases within body to bold */
  highlights?: string[];
  image?: string;
  /** Plan builder group the "Price this" link opens */
  group?: ChurchJob["id"];
}

/** One "How does it actually work" column on /church */
export interface ChurchWeekStep {
  title: string;
  icon: IoniconName;
  body: string;
  /** Phrases within body to bold */
  highlights?: string[];
  /** Photo behind the column */
  image: string;
}

export interface BoardQuestion {
  question: string;
  answer: string;
}

/** One question of a stepped survey (e.g. /church-comms-survey) */
export interface SurveyQuestion {
  id: string;
  title: string;
  helper?: string;
  /**
   * grid: one answer per row · single: pick one · multi: pick up to `max`
   * short: one-line text · paragraph: long text
   */
  type: "grid" | "single" | "multi" | "short" | "paragraph";
  options?: string[];
  /** grid only */
  rows?: string[];
  /** multi only */
  max?: number;
  /** Shuffle options per respondent (the "other" option stays last) */
  shuffle?: boolean;
  /** Label of a trailing "Other" option that asks for a few words */
  other?: string;
  optional?: boolean;
  /** Options that mean the respondent wants a follow-up */
  followUpOptions?: string[];
}

export interface SurveySection {
  id: string;
  title: string;
  icon: IoniconName;
  questions: SurveyQuestion[];
}

/** A grid answer is keyed by row; multi answers are a list */
export type SurveyAnswer = string | string[] | Record<string, string>;
