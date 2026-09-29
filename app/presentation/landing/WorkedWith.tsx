import { WORKED_WITH_LOGOS } from "~/data/Objects";
import "./CircularGallery.css";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { OutletProps, useOutlet, useOutletContext } from "react-router";
import { SharedContextProps } from "~/data/CommonTypes";
import { Carousel } from "../elements/Carousel";

export default function WorkedWith() {

    const context:SharedContextProps = useOutletContext();
  const [galleryProjects, setGalleryProjects] =
    useState<any>([
      ...WORKED_WITH_LOGOS,
      ...WORKED_WITH_LOGOS,
    ]);
  const itemRefs = useRef<
    (HTMLDivElement | null)[]
  >([]);

  useEffect(() => {}, [WORKED_WITH_LOGOS]);

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
    <div
      id="images-main"
    >
      <div className={`${scrollerCss}`}>
        <Carousel interval={1} autoplay loop resistance={50000}>
          {galleryProjects.map((img, idx) => (
            <div key={`${img.id} - ${idx}`}>
              <img
                style={{ maxHeight: `${context.inShrink ? "100" : "200"}px` }}
                key={img.name}
                src={img.image}
                alt={img.name}
                className="ml2 mr2"
              />
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
}
