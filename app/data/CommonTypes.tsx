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
  /** Section 3: what we do about it */
  serviceTitle: string;
  serviceTagline: string;
  serviceBody: string[];
}

export interface ChurchWeekStep {
  day: string;
  icon: IoniconName;
  body: string;
}

export interface BoardQuestion {
  question: string;
  answer: string;
}
