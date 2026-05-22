import { PROJECTS } from "~/data/Objects";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger, SplitText } from "gsap/all";
import gsap from "gsap";
import { ProjectCarousel } from "~/presentation/elements/ProjectCarousel";

export default function SoftwareProjects() {
  const softwareProjects = PROJECTS.filter((p) => p.type === "software");

  gsap.registerPlugin(ScrollTrigger, SplitText);

  useGSAP(() => {
    document.fonts.ready.then(() => {
      const titleSplit = SplitText.create("#software-projects-title", { type: "words" });
      gsap.from(titleSplit.words, {
        scrollTrigger: {
          scrub: 1,
          trigger: "#software-projects-title",
          start: "top 95%",
          end: "top 40%",
          toggleActions: "pause pause reverse pause",
        },
        opacity: 0,
        y: -10,
        stagger: 0.2,
      });
    });
  }, []);

  return (
    <div className="col middle center gap-20 w-100 m-20">
      <h2 id="software-projects-title" style={{ textAlign: "center" }}>
        Projects we're proud of
      </h2>
      <ProjectCarousel projects={softwareProjects} />
    </div>
  );
}
