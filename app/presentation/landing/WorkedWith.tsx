import { WORKED_WITH_LOGOS } from "~/data/Objects";
import "./CircularGallery.css";
import "../../app-v2.css";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useOutletContext } from "react-router";
import { SharedContextProps } from "~/data/CommonTypes";
import { optimisedImage } from "~/business/commonBL";
import { Carousel } from "../elements/Carousel";

/** Two sets so the strip is always wider than the screen and keeps scrolling */
const GALLERY = [...WORKED_WITH_LOGOS, ...WORKED_WITH_LOGOS];

export default function WorkedWith() {
  const context: SharedContextProps = useOutletContext();

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      "#images-main",
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 1,
        ease: "power3",
      },
      2
    );
  }, []);

  const scrollerCss = `scroller__inner slow back`;

  return (
    <div id="images-main">
      <div className={`${scrollerCss}`}>
        <Carousel interval={1} autoplay loop resistance={50000}>
          {GALLERY.map((logo, idx) => {
            // The second set (and the Carousel's loop clones) only fill the
            // strip, so screen readers and crawlers get each logo once
            const isCopy = idx >= WORKED_WITH_LOGOS.length;
            return (
              <div key={`${logo.name} - ${idx}`} aria-hidden={isCopy || undefined}>
                <img
                  style={{ maxHeight: `${context.inShrink ? "100" : "200"}px` }}
                  // Higher quality: lossy artefacts show on flat logo colours
                  src={optimisedImage(logo.image, 480, 85)}
                  alt={isCopy ? "" : logo.name}
                  loading="lazy"
                  decoding="async"
                  className="ml2 mr2"
                />
              </div>
            );
          })}
        </Carousel>
      </div>
    </div>
  );
}
