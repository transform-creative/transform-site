import { useNavigate } from "react-router";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/all";
import gsap from "gsap";

export interface LogoProps {
  size?: number;
}
const iconSpin = {
  rotate: -180,
  duration: 2,
  opacity: 0,
  ease: "bounce.out",
};

/******************************
 * Logo component
 * @todo Create description
 */
export function Logo({ size = 100 }: LogoProps) {
  const navigate = useNavigate();

  useGSAP(() => {
    document.fonts.ready.then(() => {
      const tl = gsap.timeline();

      tl.fromTo(
        "#icon",
        {
          opacity: 0,
        },
        {
          opacity: 1,
          ease: "bounce.out",
          rotate: -180,
          duration: 2,
        },1
      )
        .fromTo(
          "#logo-title-text",
          {
            opacity: 0,
            x: -100,
            ease: "power3",
          },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
          },"-=1"
        )
        .fromTo(
          "#logo-sub",
          { opacity: 0, y: -10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "bounce",
          },"-=0.3"
        )
    });
  }, []);

  /*****************************
   * Make icon spin on hover
   */
  function onIconHover() {
    gsap.fromTo(
      "#icon",
      {
        rotate: 0,
      },
      {
        rotate: "90",
        ease: "elastic.out",
        duration: 2,
      }
    );
  }

  return (
    <div>
      <div
        className="row clickable"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/")}
        onMouseEnter={() => onIconHover()}
      >
        <div
          style={{
            height: size * 2,
            width: size * 2,
            marginRight: `${Math.round(size / 5)}px`,
          }}
        >
          <img
            id="icon"
            className=""
            style={{
              opacity: 0,
              height: `${size * 2}px`,
              width: `${size * 2}px`,
            }}
            alt="transform creative icon"
            src="/transform-icon-color-donut.png"
          />
        </div>
        <div>
          {/* A div, not a heading — the wordmark sits in the header on every
              page, so making it an h1 would compete with each page's real h1.
              All its styling comes from #logo-title-text in app.css. */}
          <div
            id="logo-title-text"
            style={{
              opacity: 0,
              padding: 0,
              margin: 0,
              color: "var(--accent)",
              fontSize: `${size}pt`,
            }}
          >
            Transform
          </div>
          {/* Not a heading either, for the same reason — it was an h2 on
              every page. Block-level so it still sits under "Transform". */}
          <span
            id="logo-sub"
            className="heading-look block"
            style={{
              opacity: 0,
              fontSize: `${Math.round(size / 2)}pt`,
              color: "var(--accent)",
            }}
          >
            Creative
          </span>
        </div>
      </div>
    </div>
  );
}
