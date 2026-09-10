import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import ReactPlayer from "react-player";
import type { SharedContextProps } from "~/data/CommonTypes";
import { Icon } from "~/presentation/elements/Icon";
import "../../app-v2.css";

export interface VideoPlayerProps {
  /** Direct media URL. Must keep a plain `.mp4`/`.webm`/… ending — see note below. */
  src: string;
  /** Frame shown until the video decodes one of its own, and if loading fails.
   *  Safe to point at a URL that may not exist — a missing poster shows nothing. */
  poster?: string;
  /** Starts muted playback as soon as the first frame is ready (ambient video). */
  autoPlay?: boolean;
  loop?: boolean;
  /** Click-to-play button + unmute on the first manual play. Default true. */
  interactive?: boolean;
  /** Seconds to wait for a decodable frame before showing the fallback. Default 12. */
  timeout?: number;
  /** Accessible name, also used in the fallback copy. */
  label?: string;
  className?: string;
}

/** Loading outcomes. "waiting" covers both the initial fetch and a retry. */
type LoadState = "waiting" | "ready" | "failed";

/** Watchdog windows a still-progressing load is allowed before giving up. */
const MAX_GRACE = 2;

/** readyState HAVE_CURRENT_DATA — the first frame is decoded and painted. */
const HAVE_CURRENT_DATA = 2;

/******************************
 * VideoPlayer component
 *
 * A `<video>` on its own is silent about failure: when the fetch stalls, the
 * codec is unsupported, or the browser declines to preload at all, it paints
 * nothing and the container's background is all the user sees. This wraps
 * ReactPlayer so that never happens — the frame is primed on mount, and any
 * failure (including one the media element never reports) falls back to a
 * visible, retryable panel.
 *
 * Two things here look redundant but are not:
 *
 * 1. Load state comes from native listeners plus a direct `readyState` read,
 *    not React's `onLoadedData`/`onError`. A cached or fast response finishes
 *    loading before React attaches its media listeners, so the React props
 *    silently never fire and the overlay would stick forever.
 * 2. `src` must stay a bare media URL. ReactPlayer only matches whole-number
 *    media fragments, so a `#t=0.5` added to force a preview frame makes
 *    `canPlay` fail and it renders *nothing at all*. `primeFirstFrame` seeks
 *    instead.
 */
export function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  loop = false,
  interactive = true,
  timeout = 12,
  label = "video",
  className = "",
}: VideoPlayerProps) {
  const context: SharedContextProps = useOutletContext();

  // Held as state, not a ref, so the effects below re-run against the fresh
  // element a retry mounts.
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("waiting");
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  // Remounts the media element, so a retry re-issues the request rather than
  // reusing the errored one.
  const [attempt, setAttempt] = useState(0);
  // Extra watchdog windows granted to a load that is slow but progressing.
  const [grace, setGrace] = useState(0);

  /**
   * Browsers are free to fetch nothing for a video that isn't autoplaying —
   * iOS Safari and any data-saver mode do exactly that, which leaves an empty
   * box. An explicit load plus a nudge off zero forces one frame to decode.
   */
  const primeFirstFrame = useCallback(() => {
    if (!video) return;
    // networkState NETWORK_EMPTY: it has decided to fetch nothing at all.
    // Any other state means a request is in flight that load() would restart.
    if (video.networkState === video.NETWORK_EMPTY) video.load();
    // HAVE_METADATA is the earliest a seek is allowed.
    if (video.readyState >= video.HAVE_METADATA && video.currentTime === 0) {
      video.currentTime = 0.05;
    }
  }, [video]);

  useEffect(() => {
    if (!video) return;
    setPlaying(autoPlay);
    setGrace(0);

    // ReactPlayer forwards a fixed allow-list of props to the <video> and
    // `poster` is not among them, so it has to be set on the element. The
    // native attribute is also the safest home for it: unlike an <img>, a
    // poster that 404s renders nothing at all rather than a broken image.
    if (poster) video.poster = poster;

    const succeed = () => setLoadState("ready");
    const fail = () => setLoadState("failed");

    // Catch up on whatever happened before this effect ran, then subscribe.
    if (video.error) fail();
    else if (video.readyState >= HAVE_CURRENT_DATA) succeed();
    else setLoadState("waiting");

    video.addEventListener("loadeddata", succeed);
    video.addEventListener("error", fail);
    video.addEventListener("loadedmetadata", primeFirstFrame);
    primeFirstFrame();

    return () => {
      video.removeEventListener("loadeddata", succeed);
      video.removeEventListener("error", fail);
      video.removeEventListener("loadedmetadata", primeFirstFrame);
    };
  }, [video, src, poster, autoPlay, primeFirstFrame]);

  /**
   * A request that hangs never fires `error`, so the element would sit blank
   * forever. Give up on our own terms instead — but only once the media has
   * stopped making progress, so a slow connection isn't mistaken for a broken
   * one.
   */
  useEffect(() => {
    if (loadState !== "waiting") return;
    const timer = setTimeout(() => {
      const progressing =
        !!video && (video.readyState > 0 || video.buffered.length > 0);
      if (progressing && grace < MAX_GRACE) return setGrace((g) => g + 1);
      setLoadState("failed");
    }, timeout * 1000);
    return () => clearTimeout(timer);
  }, [loadState, timeout, grace, video]);

  /**
   * The first manual play unmutes, which the browser allows because it came
   * from a gesture. If it declines anyway, fall back to muted playback rather
   * than leaving a video that looks broken.
   */
  const togglePlay = async () => {
    if (playing) {
      setPlaying(false);
      video?.pause();
      return;
    }
    setMuted(false);
    setPlaying(true);
    if (!video) return;
    video.muted = false;
    try {
      await video.play();
    } catch {
      video.muted = true;
      setMuted(true);
      try {
        await video.play();
      } catch {
        setPlaying(false);
      }
    }
  };

  // With a poster the box already looks like a video, so it gets its play
  // button immediately — clicking before the media is ready just queues the
  // play. Without one there is nothing to click until a frame exists.
  const showPlayButton =
    interactive &&
    !playing &&
    (loadState === "ready" || (loadState === "waiting" && !!poster));

  if (loadState === "failed") {
    return (
      <figure
        className={`media-16-9 w-100 clip relative media-fallback col middle center gap-10 ${className}`}
        style={
          poster
            ? {
                backgroundImage: `url(${poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <Icon
          name="videocam-off"
          size={context.inShrink ? 24 : 32}
          color="var(--accent-sm)"
        />
        <figcaption
          className="textCenter"
          style={{ color: "var(--accent-sm)" }}
        >
          This {label} didn't load.
        </figcaption>
        <div className="row middle center gap-10 shrink-col">
          <button
            className="outline-bkg row middle center gap-5"
            onClick={() => {
              setLoadState("waiting");
              setAttempt((a) => a + 1);
            }}
          >
            <Icon name="refresh" size={16} color="var(--bkg)" />
            Try again
          </button>
          <a
            className="outline-bkg row middle center gap-5"
            role="button"
            href={src}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="open-outline" size={16} color="var(--bkg)" />
            Open directly
          </a>
        </div>
      </figure>
    );
  }

  return (
    <div className={`media-16-9 w-100 clip relative ${className}`}>
      <ReactPlayer
        key={attempt}
        ref={setVideo}
        src={src}
        className="media-cover r-default"
        style={{ width: "100%", height: "100%" }}
        // Cheapest hint that still yields a frame; primeFirstFrame does the rest.
        preload="metadata"
        // Without this iOS refuses to play inline and hijacks to fullscreen.
        playsInline
        muted={muted}
        loop={loop}
        playing={playing}
        aria-label={label}
        onClick={interactive ? togglePlay : undefined}
      />
      {loadState === "waiting" && !poster && (
        <div className="overlay-center">
          <p className="fade-sm" style={{ color: "var(--accent-sm)" }}>
            Loading…
          </p>
        </div>
      )}
      {showPlayButton && (
        <div className="overlay-center">
          <button
            className="bkg-none fade-sm"
            aria-label={`Play ${label}`}
            onClick={togglePlay}
          >
            <Icon
              name="play"
              size={context.inShrink ? 36 : 48}
              color="#ffffff"
              className="glyph-shadow"
            />
          </button>
        </div>
      )}
    </div>
  );
}
