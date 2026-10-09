import type {
  SurveyAnswer,
  SurveyQuestion,
  SurveySection,
} from "../data/CommonTypes";
import type { Json } from "../database/supabase";
import type { FormResponse } from "../data/CustomTypes";
import { csvCell } from "./radarBL";

/** Fisher–Yates shuffle into a new array */
function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The options a respondent sees for a question: shuffled when the question
 * asks for it, with the "Other" option always last.
 */
export function optionsFor(question: SurveyQuestion): string[] {
  const options = question.shuffle
    ? shuffled(question.options ?? [])
    : [...(question.options ?? [])];
  return question.other ? [...options, question.other] : options;
}

/** True when the question has a usable answer (optional ones always pass) */
export function isAnswered(
  question: SurveyQuestion,
  answer: SurveyAnswer | undefined,
  otherText: string | undefined,
): boolean {
  if (question.optional) return true;
  const otherFilled = (otherText ?? "").trim().length > 0;

  switch (question.type) {
    case "grid": {
      const rows = (answer ?? {}) as Record<string, string>;
      return (question.rows ?? []).every((row) => !!rows[row]);
    }
    case "single":
      if (typeof answer !== "string" || !answer) return false;
      return answer !== question.other || otherFilled;
    case "multi": {
      const picked = (answer ?? []) as string[];
      if (picked.length === 0) return false;
      return !question.other || !picked.includes(question.other) || otherFilled;
    }
    default:
      return typeof answer === "string" && answer.trim().length > 0;
  }
}

/** Every required question in the section has been answered */
export function isSectionComplete(
  section: SurveySection,
  answers: Record<string, SurveyAnswer>,
  otherText: Record<string, string>,
) {
  return section.questions.every((q) =>
    isAnswered(q, answers[q.id], otherText[q.id]),
  );
}

/** One "question: answer" line of a stored response */
export interface ResponseLine {
  /** Key path, outermost first, e.g. ["Plan parts", "Weekly email"] */
  path: string[];
  value: string;
}

/** "dietaryRequirements" → "Dietary requirements"; keys with spaces are kept */
export function humaniseKey(key: string): string {
  if (/\s/.test(key)) return key;
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatValue(value: Json | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * Split a response's `metadata` json into one line per answer. Nested objects
 * become longer paths, arrays of plain values are joined with commas, and
 * arrays of objects are numbered. A top-level `answers` object is unwrapped so
 * survey answers sit alongside the contact fields. `formId` is left out (the
 * viewer shows it as the response's heading).
 */
export function flattenResponse(
  value: Json | undefined,
  path: string[] = [],
): ResponseLine[] {
  if (Array.isArray(value)) {
    if (value.every((v) => v === null || typeof v !== "object"))
      return [
        { path, value: value.length ? value.map(formatValue).join(", ") : "—" },
      ];
    return value.flatMap((v, i) => flattenResponse(v, [...path, `#${i + 1}`]));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, v]) => {
      if (path.length === 0 && key === "formId") return [];
      if (path.length === 0 && key === "answers") return flattenResponse(v);
      return flattenResponse(v, [...path, humaniseKey(key)]);
    });
  }
  return [{ path, value: formatValue(value) }];
}

/**
 * CSV of responses: one row per response, one column per answer path (in the
 * order they first appear), so different forms can share one sheet.
 */
export function responsesToCsv(responses: FormResponse[]): string {
  const columns: string[] = [];
  const rows = responses.map((r) => {
    const cells = new Map<string, string>();
    for (const line of flattenResponse(r.metadata)) {
      const key = line.path.join(" › ") || "Value";
      if (!columns.includes(key)) columns.push(key);
      cells.set(key, line.value);
    }
    return { r, cells };
  });
  const header = ["ID", "Form", "Submitted", ...columns];
  const lines = rows.map(({ r, cells }) =>
    [
      r.id,
      formIdOf(r),
      r.created_at,
      ...columns.map((c) => cells.get(c) ?? ""),
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\n");
}

/** The form a response came from (its `metadata.formId`), or "other" */
export function formIdOf(response: FormResponse): string {
  const meta = response.metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const id = meta.formId;
    if (typeof id === "string" && id) return id;
  }
  return "other";
}
