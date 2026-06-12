import type { SharedContextProps } from "~/data/CommonTypes";
import {
  useNavigate,
  useOutletContext,
} from "react-router";
import { Icon } from "../elements/Icon";
import "./landing.css";
import ReactPlayer from "react-player";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ScrollTrigger,
  SplitText,
} from "gsap/all";

export interface MediaTabProps {}

/******************************
 * DesignTab component
 * @todo Create description
 */
export function MediaTab({}: MediaTabProps) {
  const context: SharedContextProps =
    useOutletContext();
  const reactPlayer =
    useRef<HTMLVideoElement>(null);

  const [playerPlay, setPlayerPlay] =
    useState(false);
  const [playerMuted, setPlayerMuted] =
    useState(true);
  const navigate = useNavigate();

  gsap.registerPlugin(SplitText);
  gsap.registerPlugin(ScrollTrigger);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPlayerPlay(true);
          } else setPlayerPlay(false);
        });
      },
      { threshold: 0.1 },
    );
    if (reactPlayer.current) {
      observer.observe(reactPlayer.current);
    }
    return () => {
      if (reactPlayer.current) {
        observer.unobserve(reactPlayer.current);
      }
    };
  }, []);

  /***************************************************
   * GSAP Animation
   */
  useGSAP(() => {
    document.fonts.ready.then(() => {
      const titleSplit = SplitText.create(
        "#media-title",
        {
          type: "words",
        },
      );

      gsap.from(titleSplit.words, {
        scrollTrigger: {
          scrub: 1,
          trigger: "#media",
          start: "top center",
          end: "+=300",
          toggleActions:
            "pause pause reverse pause",
        },
        opacity: 0,
        y: -10,
        stagger: 0.2,
      });
    });

    gsap.from("#media-icon", {
      scrollTrigger: {
        scrub: 1,
        trigger: "#media",
        start: "center bottom",
        end: "+=300",
        toggleActions:
          "pause pause reverse pause",
      },
      y: "-100px",
      opacity: 1,
    });

    gsap.fromTo(
      "#software-icon-media",
      {
        y: "-100px",
        opacity: 1,
      },
      {
        scrollTrigger: {
          scrub: 1,
          trigger: "#media",
          start: "center bottom",
          end: "+=300",
          toggleActions:
            "pause pause reverse pause",
        },
        y: 0,
        opacity: 0,
      },
    );

    gsap.fromTo(
      "#design-icon-media",
      {
        y: "-100px",
        opacity: 1,
      },
      {
        scrollTrigger: {
          scrub: 1,
          trigger: "#media",
          start: "center bottom",
          end: "+=300",
          toggleActions:
            "pause pause reverse pause",
        },
        y: 0,
        opacity: 0,
      },
    );

    gsap.from("#media-boxes", {
      scrollTrigger: {
        scrub: 1,
        trigger: "#media",
        start: "top 300",
        end: "+=300",
        toggleActions:
          "pause pause reverse pause",
      },
      opacity: 0,
      y: 300,
    });

    gsap.from("#media-sub", {
      scrollTrigger: {
        scrub: 1,
        trigger: "#media",
        start: "top 60%",
        end: "+=300",
        toggleActions:
          "pause pause reverse pause",
      },
      opacity: 0,
      y: 300,
    });
  }, []);

  return (
    <section
      id="media"
      className="w50 col middle"
    >
      <div
        style={{ minHeight: 150, width: 100 }}
      />

      <div className="row w50 around">
        <Icon
          id="software-icon-media"
          className="lateFade"
          style={{ opacity: 0 }}
          name="code-outline"
          size={40}
          color="var(--accent)"
        />
        <Icon
          id="media-icon"
          name="film-outline"
          className="lateFade"
          style={{ opacity: 0 }}
          size={40}
          color="var(--accent)"
        />
        <Icon
          id="design-icon-media"
          name="color-filter-outline"
          className="lateFade"
          style={{ opacity: 0 }}
          size={40}
          color="var(--accent)"
        />
      </div>

      <h4
        className="mb3 mt3 textCenter"
        id="media-title"
      >
        We create videos that gain attention and
        generate traction
      </h4>
      <p
        className="pb3 textCenter"
        id="media-sub"
      >
        Partner with us to create authentic
        material that cuts through the dribble of
        AI content.
      </p>
      <div className="w100 col" id="media-boxes">
        <div className="row">
          <div
            className="w100 boxed clickable"
            style={{
              aspectRatio: "16 / 9",
            }}
          >
            <ReactPlayer
              ref={reactPlayer}
              src="https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/2026%20reel-LQ.mp4"
              onClick={() => {
                setPlayerMuted(!playerMuted);
                !playerPlay &&
                  setPlayerPlay(true);
              }}
              muted={playerMuted}
              loop
              style={{
                minWidth: "100%",
                minHeight: "100%",
                objectFit: "cover",
              }}
              playing={playerPlay}
            />
          </div>
        </div>
        <div className="div10" />
        <div className="shrinkCol between h100">
          <div
            className="w75 boxed animate col"
            style={{
              overflow: "hidden",
              minHeight: 200,
              maxHeight: 200,
            }}
          >
            <div className="">
              <h3
                className="mt3 ml3"
                style={{ fontSize: "14pt" }}
              >
                Authentic content that hits.
              </h3>
              <ul className="textStart ml3 mr3 mb3">
                <li>Long-form training series</li>
                <li>Promotional videos</li>
                <li>Social media reels</li>
                <li>
                  Videos for fundraising campaigns
                </li>
              </ul>
            </div>
          </div>
          <div className="div10" />
          <div className="row boxedAccent w25 "    onClick={() =>
                  navigate(
                    "/portfolio?type=media",
                  )
                }>
            <div
              className={`clickable ${
                context.inShrink
                  ? "row middle between p3 w100"
                  : "col between h100"
              }`}
            >
              <h5
                className={`${
                  !context.inShrink &&
                  "pl3 pr3 pt3"
                }`}
                style={{
                  textAlign: "start",
                  zIndex: 500,
                }}
              >
                See more
              </h5>
              <Icon
                onClick={() =>
                  navigate(
                    "/portfolio?type=media",
                  )
                }
                name="arrow-forward-circle"
                size={40}
                color="var(--bkg)"
                className={`clickable ${
                  !context.inShrink && "pl3 pb3"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
