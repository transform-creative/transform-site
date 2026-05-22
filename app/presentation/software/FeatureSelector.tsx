import { useState, useRef, useLayoutEffect, useEffect, ReactElement } from "react";
import { Icon } from "~/presentation/elements/Icon";
import type { IoniconName } from "~/data/Ionicons";
import { useOutletContext } from "react-router";
import { SharedContextProps } from "~/data/CommonTypes";
import gsap from "gsap";

export interface Feature {
  className?: string;
  icon: { name: IoniconName; size: number };
  text: string;
  description: string[];
  component?: ReactElement
}

interface Props {
  features: Feature[];
}

export default function FeatureSelector({ features }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState<{
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });
  const descriptionRef = useRef<HTMLDivElement>(null);
  const hasInteracted = useRef(false);
  const isFirstRender = useRef(true);
  const prevIndexRef = useRef(0);
  const context:SharedContextProps = useOutletContext();

  useEffect(() => {
    if (!hasInteracted.current) return;
    descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedIndex]);

  // Animate description on selection change — skip initial render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!descriptionRef.current) return;
    const direction = selectedIndex > prevIndexRef.current ? 1 : -1;
    prevIndexRef.current = selectedIndex;
    if (context.inShrink) {
      gsap.from(descriptionRef.current.children, {
        opacity: 0,
        y: -10,
        stagger: 0.1,
        ease: "power3",
        duration: 0.5,
      });
    } else {
      gsap.from(descriptionRef.current.children, {
        opacity: 0,
        x: direction * 40,
        stagger: 0.1,
        ease: "power3",
        duration: 0.5,
      });
    }
  }, [selectedIndex]);

  // Animate buttons in when they enter the viewport
  useEffect(() => {
    const container = buttonsContainerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll("button");
    if (!buttons.length) return;

    gsap.set(buttons, { opacity: 0, y: -10 });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          gsap.to(buttons, { opacity: 1, y: 0, stagger: 0.1, ease: "power3", duration: 0.6 });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const btn = buttonRefs.current[selectedIndex];
    if (btn) {
      setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [selectedIndex]);

  const selected = features[selectedIndex];

  return (
    <div className="col gap-20 w-100">
      <div style={{ position: "relative" }}>
        <div className="row gap-10 center wrap" ref={buttonsContainerRef}>
          {features.map((feature, index) => (
            <button
              key={index}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              className={`gap-10 center col boxed middle ${feature.className ?? ""}`}
              style={{
                width: 150,
                color:
                  index === selectedIndex
                    ? "var(--accent)"
                    : 'var(--txt)',
              }}
              onClick={() => { hasInteracted.current = true; setSelectedIndex(index); }}
            >
              <Icon
                name={
                  index === selectedIndex
                    ? (feature.icon.name.split("-outline")[0]) as IoniconName
                    : feature.icon.name
                }
                size={25}
                color={
                  index === selectedIndex
                    ? "var(--bkg)"
                    : undefined
                }
              />
              {feature.text}
            </button>
          ))}
        </div>

        {/* Sliding pill indicator */}
       {context.inShrink || <div
          style={{
            position: "absolute",
            bottom: -8,
            left: pillStyle.left,
            width: pillStyle.width,
            height: 2,
            backgroundColor: "var(--accent)",
            borderRadius: 999,
            transition:
              "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />}
      </div>

      {/* Description panel */}
      <div
        ref={descriptionRef}
        key={selectedIndex}
        className="col gap-10 center middle fade-sm w-100"
        style={{ minHeight: 50, textAlign: "center" }}
      >
        <div className="w-75">
          <div className="p-0 pb-20">
            {selected.description.map((para, i) => (
              <div key={i}>
                {i === 0 ? (
                  <h4 className="center p-20">{para}</h4>
                ) : (
                  <p className="center mb-20"> {para}</p>
                )}
              </div>
            ))}
          </div>
          {selected.component || null}
        </div>
      </div>
    </div>
  );
}
