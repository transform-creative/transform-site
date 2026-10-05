import { useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { gsap } from "gsap";
import type { SharedContextProps } from "~/data/CommonTypes";
import { Icon } from "~/presentation/elements/Icon";
import "../../app-v2.css";

export interface FAQLink {
  label: string;
  href: string;
}

export interface QuestionDropdownProps {
  question: string;
  answer: string;
  links?: FAQLink[];
}

/******************************
 * QuestionDropdown component
 * Animated accordion for a single FAQ question and answer.
 * Expands/collapses with GSAP height animation.
 * (Copied from the Ping Pong-A-Thon site.)
 */
export function QuestionDropdown({
  question,
  answer,
  links,
}: QuestionDropdownProps) {
  const context: SharedContextProps = useOutletContext();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  function open() {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.fromTo(
      panel,
      { height: 0, opacity: 0 },
      {
        height: "auto",
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      },
    );
    gsap.to(chevronRef.current, {
      rotation: 180,
      duration: 0.3,
      ease: "power2.out",
    });
    setIsOpen(true);
  }

  function close() {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.to(panel, {
      height: 0,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
    });
    gsap.to(chevronRef.current, {
      rotation: 0,
      duration: 0.25,
      ease: "power2.in",
    });
    setIsOpen(false);
  }

  function toggle() {
    isOpen ? close() : open();
  }

  return (
    <div>
      <button
        type="button"
        className="accent r-default p-10 mt-5 row between middle gap-10 w-100"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <h3 className="pl-5" style={{ textAlign: "start" }}>
          {question}
        </h3>
        <div ref={chevronRef} className="no-shrink">
          <Icon name="chevron-down" size={16} color="var(--bkg)" />
        </div>
      </button>

      <div ref={panelRef} className="gsap-collapsed">
        <div
          className="p-10 mt-5 col gap-10 pb-10 boxed outline-secondary"
          style={{ textAlign: "start" }}
        >
          <p className="pre-line">{answer}</p>

          {links && links.length > 0 && (
            <div className="row gap-5 wrap">
              {links.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  className="outline pr-10 pl-10 pt-5 pb-5"
                  onClick={() => window.open(link.href, "_blank")}
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
