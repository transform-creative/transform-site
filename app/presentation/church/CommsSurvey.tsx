import { useState } from "react";
import { useOutletContext, useSearchParams } from "react-router";
import type {
  SharedContextProps,
  SurveyAnswer,
  SurveyQuestion,
} from "~/data/CommonTypes";
import {
  CHURCH_SURVEY,
  CHURCH_SURVEY_ID,
  CONTACT,
} from "~/data/Objects";
import { scrollToId } from "~/business/commonBL";
import { isSectionComplete, optionsFor } from "~/business/surveyBL";
import { createResponse } from "~/database/Create";
import { Icon } from "~/presentation/elements/Icon";
import { LabelInput } from "~/presentation/elements/LabelInput/LabelInput";
import "../../app-v2.css";

const QUESTIONS = CHURCH_SURVEY.flatMap((s) => s.questions);
const FOLLOW_UP_QUESTION = QUESTIONS.find((q) => q.followUpOptions);

/******************************
 * CommsSurvey component
 * The /church-comms-survey form. Laid out like the YS extra sign-up card
 * (no photo), with PlanBuilder-style sections: each opens once the one
 * before it is answered and "Next" is pressed.
 */
export function CommsSurvey() {
  const context: SharedContextProps = useOutletContext();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [church, setChurch] = useState(
    searchParams.get("church") ?? "",
  );
  const [answers, setAnswers] = useState<
    Record<string, SurveyAnswer>
  >({});
  const [otherText, setOtherText] = useState<Record<string, string>>(
    {},
  );
  const [openIndex, setOpenIndex] = useState(0);
  // Furthest section opened so far; later ones stay locked
  const [reached, setReached] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Shuffled once per respondent, so the order holds while they answer
  const [optionOrder] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(QUESTIONS.map((q) => [q.id, optionsFor(q)])),
  );

  const wantsFollowUp =
    !!FOLLOW_UP_QUESTION &&
    !!FOLLOW_UP_QUESTION.followUpOptions?.includes(
      answers[FOLLOW_UP_QUESTION.id] as string,
    );

  // Number questions straight through the sections
  const numbers = Object.fromEntries(
    QUESTIONS.map((q, i) => [q.id, i + 1]),
  );

  function answer(id: string, value: SurveyAnswer) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function sectionReady(index: number) {
    return isSectionComplete(
      CHURCH_SURVEY[index],
      answers,
      otherText,
    );
  }

  function goToNext(index: number) {
    const next = CHURCH_SURVEY[index + 1];
    if (!next || !sectionReady(index)) return;
    setOpenIndex(index + 1);
    setReached((r) => Math.max(r, index + 1));
    // Wait for the previous section to collapse before scrolling
    setTimeout(
      () => scrollToId(`survey-section-${next.id}`, 140),
      350,
    );
  }

  async function handleSubmit() {
    const last = CHURCH_SURVEY.length - 1;
    if (!sectionReady(last) || submitting) return;

    setSubmitting(true);
    try {
      await createResponse({
        business_id: 129,
        metadata: {
          formId: CHURCH_SURVEY_ID,
          name: name.trim(),
          church: church.trim(),
          followUp: wantsFollowUp,
          answers,
          otherText,
        },
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      context.popAlert(
        "Something went wrong",
        `Contact ${CONTACT.email}`,
        true,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="col middle center">
      <div className="row w-100 center middle gap-20 mt-20 mb-20">
        <img
          style={{ height: 80 }}
          src="/transform-icon-color-donut.png"
          alt="Transform Creative"
        />
      </div>

      {submitted ? (
        <section
          style={{ minHeight: "70vh" }}
          className="col middle center gap-10 w-50 shrink-p-10 border-box textCenter mb-20 pb-20"
        >
          <h2 className="center">
            Thanks so much, that's a massive help.
          </h2>
          {wantsFollowUp && <p>I'll be in touch this week.</p>}
          <button
            className="accent middle center gap-5"
            onClick={() => context.navigate("/church")}
          >
            <Icon name="arrow-back"/>
            Back to the page
          </button>
        </section>
      ) : (
        <>
          <div className="col gap-10 middle w-50 shrink-p-10 border-box">
            <h2 className="textCenter">
              Church comms: a few quick questions
            </h2>
            <p className="textCenter">
              Thanks for taking a look at the plan. Your honest take
              will help me shape it into something that actually works
              for churches. It takes about 5 minutes.
            </p>
          </div>

          <div className="w-50 mb-20 mt-20 shrink-p-10 border-box">
            <div className="boxed outline-accent p-20 col gap-10">
              <div className="row shrink-col gap-10">
                <LabelInput
                  name="Your name"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <LabelInput
                  name="Your church"
                  placeholder="St Somewhere's"
                  autoComplete="organization"
                  value={church}
                  onChange={(e) => setChurch(e.target.value)}
                />
              </div>

              <div className="col mt-10">
                {CHURCH_SURVEY.map((section, i) => {
                  const open = openIndex === i;
                  const locked = i > reached;
                  const isLast = i === CHURCH_SURVEY.length - 1;
                  return (
                    <div
                      key={section.id}
                      id={`survey-section-${section.id}`}
                      className="divided-card pt-10 pb-10"
                    >
                      <button
                        type="button"
                        className="text-button row middle between w-100 mt-10"
                        aria-expanded={open}
                        disabled={locked}
                        onClick={() => setOpenIndex(open ? -1 : i)}
                      >
                        <div className="row middle gap-10">
                          <Icon
                            name={section.icon}
                            size={20}
                            color="var(--accent)"
                          />
                          <h3 className="bold">
                            {i + 1}. {section.title}
                          </h3>
                        </div>
                        <Icon
                          name={
                            locked
                              ? "lock-closed-outline"
                              : open
                                ? "chevron-up"
                                : "chevron-down"
                          }
                          size={14}
                        />
                      </button>

                      <div
                        className={`collapse-row ${open ? "open mt-10" : ""}`}
                      >
                        <div className="col gap-20 pt-5">
                          {section.questions.map((q) => (
                            <QuestionField
                              key={q.id}
                              question={q}
                              number={numbers[q.id]}
                              options={optionOrder[q.id]}
                              answer={answers[q.id]}
                              otherText={otherText[q.id] ?? ""}
                              onAnswer={(v) => answer(q.id, v)}
                              onOther={(text) =>
                                setOtherText((t) => ({
                                  ...t,
                                  [q.id]: text,
                                }))
                              }
                            />
                          ))}

                          {!sectionReady(i) && (
                            <p className="text-sm muted textCenter">
                              Answer each question to continue
                            </p>
                          )}

                          {isLast ? (
                            <button
                              type="button"
                              className="accent w-100 row middle center gap-5"
                              disabled={
                                !sectionReady(i) || submitting
                              }
                              onClick={handleSubmit}
                            >
                              {submitting
                                ? "Sending..."
                                : "Send my answers"}
                              <Icon
                                name="arrow-forward"
                                size={18}
                                color="var(--bkg)"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="row middle gap-5 p-5 center"
                              disabled={!sectionReady(i)}
                              onClick={() => goToNext(i)}
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
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- */

interface QuestionFieldProps {
  question: SurveyQuestion;
  number: number;
  /** Display order (may be shuffled), "Other" last */
  options: string[];
  answer: SurveyAnswer | undefined;
  otherText: string;
  onAnswer: (value: SurveyAnswer) => void;
  onOther: (text: string) => void;
}

/******************************
 * One survey question: grid of chips, a list of choices, or a text box.
 */
function QuestionField({
  question,
  number,
  options,
  answer,
  otherText,
  onAnswer,
  onOther,
}: QuestionFieldProps) {
  const context: SharedContextProps = useOutletContext();
  const picked =
    question.type === "multi"
      ? ((answer ?? []) as string[])
      : typeof answer === "string"
        ? [answer]
        : [];
  const showOther =
    !!question.other && picked.includes(question.other);

  function toggle(option: string) {
    if (question.type === "single") return onAnswer(option);
    onAnswer(
      picked.includes(option)
        ? picked.filter((p) => p !== option)
        : [...picked, option],
    );
  }

  const atMax =
    question.type === "multi" &&
    !!question.max &&
    picked.length >= question.max;

  return (
    <fieldset className="plain-fieldset col gap-10">
      <legend className="bold text-md mb-5">
        Q{number}. {question.title}
        {question.optional && (
          <small className="muted"> (optional)</small>
        )}
      </legend>
      {question.helper && (
        <p className="text-sm muted">{question.helper}</p>
      )}
      {question.type === "multi" && question.max && (
        <p className="text-sm muted">
          Pick up to {question.max}
          {picked.length > 0 && ` (${picked.length} chosen)`}
        </p>
      )}

      {question.type === "grid" && (
        <div className="col">
          {(question.rows ?? []).map((row, i, allRows) => {
            const rows = (answer ?? {}) as Record<string, string>;
            // Each row unlocks once every row above it is answered
            const locked = allRows.slice(0, i).some((r) => !rows[r]);
            return (
              <div
                key={row}
                className={`col gap-5 list-row ${locked ? "disabled-row" : ""}`}
                aria-disabled={locked}
              >
                <p>{row}</p>
                <div
                  className="row wrap gap-5"
                  role="radiogroup"
                  aria-label={row}
                >
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      tabIndex={locked ? -1 : undefined}
                      aria-checked={rows[row] === option}
                      className={`chip ${rows[row] === option ? "active" : ""}`}
                      onClick={() =>
                        onAnswer({ ...rows, [row]: option })
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(question.type === "single" || question.type === "multi") && (
        <div
          className="col gap-5"
          role={question.type === "single" ? "radiogroup" : "group"}
        >
          {options.map((option) => {
            const active = picked.includes(option);
            const icon =
              question.type === "single"
                ? active
                  ? "radio-button-on"
                  : "radio-button-off"
                : active
                  ? "checkbox"
                  : "square-outline";
            return (
              <button
                key={option}
                type="button"
                role={
                  question.type === "single" ? "radio" : "checkbox"
                }
                aria-checked={active}
                disabled={atMax && !active}
                className={`choice row middle gap-10 p-10 w-100 ${active ? "active" : ""}`}
                onClick={() => toggle(option)}
              >
                <Icon
                  name={icon}
                  size={18}
                  color={active ? "var(--bkg)" : "var(--accent)"}
                />
                {option}
              </button>
            );
          })}
          {showOther && (
            <input
              type="text"
              className="w-100 border-box fade-sm"
              placeholder="Tell me a bit more"
              aria-label={`${question.title} (other)`}
              autoFocus={!context.inShrink}
              value={otherText}
              onChange={(e) => onOther(e.target.value)}
            />
          )}
        </div>
      )}

      {question.type === "short" && (
        <input
          type="text"
          className="w-100 border-box"
          aria-label={question.title}
          value={(answer as string) ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
        />
      )}

      {question.type === "paragraph" && (
        <textarea
          className="w-100 border-box p-10 textarea-md"
          aria-label={question.title}
          value={(answer as string) ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
        />
      )}
    </fieldset>
  );
}
