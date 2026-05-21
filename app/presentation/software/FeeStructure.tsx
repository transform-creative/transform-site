import type { SharedContextProps } from "~/data/CommonTypes";
import { useEffect, useRef } from "react";
import { useOutletContext } from "react-router";
import gsap from "gsap";

export interface FeeStructureProps {}

/******************************
 * FeeStructure component
 * @todo Create description
 */
export function FeeStructure({}: FeeStructureProps) {
  const context: SharedContextProps = useOutletContext();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const boxesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    const boxesContainer = boxesRef.current;
    if (!title || !boxesContainer) return;

    const boxes = boxesContainer.querySelectorAll(":scope > div");

    gsap.set(title, { opacity: 0, y: -10 });
    gsap.set(boxes, { opacity: 0, y: -10 });

    const titleObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          gsap.to(title, { opacity: 1, y: 0, ease: "power3", duration: 0.6 });
          titleObserver.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const boxesObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          gsap.to(boxes, { opacity: 1, y: 0, stagger: 0.15, ease: "power3", duration: 0.6 });
          boxesObserver.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    titleObserver.observe(title);
    boxesObserver.observe(boxesContainer);

    return () => {
      titleObserver.disconnect();
      boxesObserver.disconnect();
    };
  }, []);

  return (
    <div>
      <h2 className="center mb-10" id="fee-structure-title" ref={titleRef}>
        Our fee structure
      </h2>
      <div className="row shrink-wrap gap-10" id="fee-structure-boxes" ref={boxesRef}>
        <div
          className="col boxed w-100 p-20 middle accent"
          style={{
            textAlign: context.inShrink
              ? "center"
              : "start",
          }}
        >
          <div>
            <h3
              className="pl-10 pr-10"
              style={{

                borderRadius:
                  "var(--borderRadius)",
              }}
            >
              $10-50k
            </h3>
          </div>
          <h4 className="">1. Intital Build</h4>
          <p className="center">
            The cost to build your entire site.
            This covers everything until your site
            goes live. This fee changes based on
            the complexity of the site.
          </p>
        </div>

        <div
          className="col boxed w-100 p-20 middle accent"
          style={{
            textAlign: context.inShrink
              ? "center"
              : "start",
          }}
        >
          <h3
            className="pl-10 pr-10"
            style={{
              color: "var(--bkg)",
              borderRadius: "var(--borderRadius)",
            }}
          >
            $600 - $1500 (per month)
          </h3>
          <h4 className="center">
            2. Maintenance
          </h4>

          <p className="center">
            We charge an ongoing fee which gives
            us 24/7 availability to fix stuff, add
            stuff and give you + your clients
            customer support.
          </p>
        </div>

        <div
          className="col boxed w-100 p-20 middle"
          style={{
            textAlign: context.inShrink
              ? "center"
              : "start",
          }}
        >
          <h3
            className="pl-10 pr-10"
            style={{
              borderRadius: "var(--borderRadius)",
            }}
          >
            ~2% of your online giving*
          </h3>
          <h4 className="center">
            Payment Gateway*
          </h4>
          <p className="center">
            For collecting online donations
            payment gateways like Stripe charge a
            small fee
          </p>
        </div>
      </div>
      <p className="center mt-20" style={{fontStyle: "italic"}}>
        <em>
          *The Payment Gateway fee is purely based
          on your giving provider (none of it goes
          to us!)
        </em>
      </p>
    </div>
  );
}
