import IonIcon from "@reacticons/ionicons";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Transition, TransitionGroup } from "react-transition-group";
import type { ActivatableElement } from "~/data/CommonTypes";
import { Icon } from "./Icon";
import "../../app-v2.css"

interface SavedModalProps extends ActivatableElement {
  timeout?: number;
  header?: string;
  body?: string;
  state?: "success" | "fail";
}

export default function Alert({
  active,
  onClose,
  timeout = 5,
  header,
  body,
  state = "success",
}: SavedModalProps) {
  const timerExpiry: Date = new Date();
  timerExpiry.setSeconds(new Date().getSeconds() + timeout);
  const transitionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active == true) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Update every 1 second

      // Cleanup function to clear the timeout if the component unmounts before 5 seconds
      return () => clearTimeout(timer);
    }
  }, [active]);

  const handleEnter = () => {
    gsap.to(transitionRef?.current, {
      alpha: 100,
      duration: 0.5,
      y: 300,
      ease: "elastic.inOut",
    });
  };

  const handleExit = () => {
    gsap.to(transitionRef?.current, {
      opacity: 0,
      y: -300,
      duration: 0.5,
      ease: "elastic.inOut",
    });
  };
  return (
    <Transition
      nodeRef={transitionRef}
      in={active}
      timeout={500}
      onEnter={handleEnter}
      onExit={handleExit}
      unmountOnExit
    >
      <div
        ref={transitionRef}
        className="boxed s1 mt-20 outline"
        style={{
          background: ` ${
            state == "fail"
              ? "var(--dangerColor)"
              : "var(--accent)"
          }`,
          position: "fixed",
          zIndex: 100,
          height: "auto",
          // Full width less a 16px gutter on phones, half width on desktop
          width: "max(50%, min(600px, calc(100vw - 32px)))",
          boxSizing: "border-box",
          left: "50%",
          transform: "translate(-50%, -50%)",
          top: -260,
        }}
      >
        <div className="row between middle gap-10 p1">
          <Icon
            className="no-shrink"
            name={`${
              state == "success"
                ? "checkmark-circle-outline"
                : "close-circle-outline"
            }`}
            size={20}
            color={state == "fail" ? "var(--bkg)" : "var(--bkg)"}
          />

          <div className="flex-1 break-word">
            {header && (
              <h3
                style={{ color: "var(--bkg)" }}
                className="m1 textCenter"
              >
                {header}
              </h3>
            )}
            {body && (
              <p
                style={{ color: "var(--bkg)" }}
                className="m1 textCenter"
              >
                {body}
              </p>
            )}
          </div>

          <IonIcon
            className="buttonIcon m0"
            name="close"
            style={{
              color: "var(--bkg)",
              right: 20,
              width: 15,
            }}
            onClick={() => onClose()}
          />
        </div>
      </div>
    </Transition>
  );
}
