import { useOutletContext } from "react-router";
import "../../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import { FIA } from "~/data/Objects";
import { optimisedImage } from "~/business/commonBL";

interface Props {
  /** Rendered height in px. The PNG has padding baked in, so the artwork
   *  itself is about 60% of this. */
  height?: number;
  /** For callers outside the route <Outlet> (the footer), where
   *  useOutletContext() is null — they pass root's context in directly */
  context?: SharedContextProps;
}

/******************************
 * FiaBadge component
 * FIA membership badge, as a real link to our listing in FIA's member
 * directory, so crawlers can follow it and it opens in a new tab.
 */
export function FiaBadge({ height = 100, context: passed }: Props) {
  const outlet = useOutletContext<SharedContextProps | null>();
  const inShrink = (passed ?? outlet)?.inShrink ?? false;

  return (
    <a
      href={FIA.directoryUrl}
      target="_blank"
      rel="noopener"
      // The PNG's left padding would otherwise push it off its column's edge
      style={{ display: "inline-block", marginLeft: inShrink ? 0 : -20 }}
    >
      <img
        style={{ height }}
        src={optimisedImage(FIA.logo, 600, 85)}
        alt={FIA.alt}
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}
