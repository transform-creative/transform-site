import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { QuestionDropdown } from "~/presentation/elements/QuestionDropdown";
import type { FAQLink } from "~/presentation/elements/QuestionDropdown";
import "../../app-v2.css";

export interface FAQSection {
  id: string;
  title: string;
  visible?: boolean;
}

export interface FAQQuestion {
  section: string;
  question: string;
  answer: string;
  links?: FAQLink[];
  visible?: boolean;
}

export interface FrequentlyAskedQuestionsProps {
  sections: FAQSection[];
  questions: FAQQuestion[];
}

/******************************
 * FrequentlyAskedQuestions component
 * Renders FAQ questions grouped by section. Sections and individual questions
 * can be hidden by setting visible: false on the respective object.
 * (Copied from the Ping Pong-A-Thon site — the data now lives with each page.)
 */
export function FrequentlyAskedQuestions({
  sections,
  questions,
}: FrequentlyAskedQuestionsProps) {
  const context: SharedContextProps = useOutletContext();

  const visibleSections = sections.filter((s) => s.visible !== false);

  return (
    <div className="col gap-20 w-100">
      {visibleSections.map((section) => {
        const sectionQs = questions.filter(
          (q) => q.section === section.id && q.visible !== false,
        );
        if (!sectionQs.length) return null;

        return (
          <div key={section.id} className="col gap-5">
            <div className="mt-20 center">
              <h2 className="row middle">
                <strong className="mr-10 highlight-accent">
                  {section.title}
                </strong>{" "}
                questions
              </h2>
            </div>
            <div className="col gap-5">
              {sectionQs.map((q) => (
                <QuestionDropdown
                  key={q.question}
                  question={q.question}
                  answer={q.answer}
                  links={q.links}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/*******************************
 * faqJsonLd
 * schema.org FAQPage structured data for the visible questions.
 */
export function faqJsonLd(questions: FAQQuestion[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions
      .filter((q) => q.visible !== false && q.answer)
      .map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer },
      })),
  };
}
