import type {
  SurveyAnswer,
  SurveyQuestion,
  SurveySection,
} from "../data/CommonTypes";

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
