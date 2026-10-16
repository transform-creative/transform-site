import type { HTMLAttributes } from "react";
import type { IoniconName } from "~/data/Ionicons";
import { ICON_SVG } from "./icons/IconSvg";

/** Shown when a name isn't in the registry, so a gap is visible, not blank. */
const FALLBACK_ICON: IoniconName =
  "help-circle-outline";

export interface IonIconProps extends HTMLAttributes<HTMLSpanElement> {
  name: IoniconName;
  size?: "small" | "large";
}

/******************************
 * IonIcon component
 *
 * Renders an icon from the generated registry in
 * `./icons/IconSvg.ts` — see `setup/icons/generate.mjs` for why the
 * `@reacticons/ionicons` package isn't used directly (one 856KB CommonJS file
 * with every icon inlined and no way to tree-shake it).
 *
 * The element, the style defaults and the `dangerouslySetInnerHTML` are copied
 * from that package's own implementation on purpose: identical markup means no
 * icon anywhere in the app moves by a pixel. Two deliberate notes on that:
 *
 * - It is a `<span>`, against the project's "never use spans" rule. An icon is
 *   inline content, and the package rendered one — switching to a `<div>` would
 *   turn every icon on every page from inline to block.
 * - `dangerouslySetInnerHTML` is safe here because the only possible values are
 *   the compile-time constants in `ICON_SVG`. `name` is typed to that object's
 *   keys, and the fallback covers anything that slips through a cast, so no
 *   user input can ever reach it.
 */
export default function IonIcon({
  name,
  size,
  style,
  ...rest
}: IonIconProps) {
  const svg = ICON_SVG[name];

  if (!svg && import.meta.env.DEV) {
    // Loud in dev, harmless in production: the fallback still renders.
    console.warn(
      `IonIcon: "${name}" is not in the icon registry. Add it to ` +
        `setup/icons/used-icons.txt and run \`npm run icons\`.`,
    );
  }

  const extent = size
    ? size === "small"
      ? ".5em"
      : "2em"
    : "1em";

  return (
    <span
      {...rest}
      style={{
        display: "inline-block",
        height: extent,
        width: extent,
        visibility: "inherit",
        fill: "currentcolor",
        boxSizing: "content-box",
        stroke: "currentcolor",
        ...style,
      }}
      dangerouslySetInnerHTML={{
        __html: svg ?? ICON_SVG[FALLBACK_ICON],
      }}
    />
  );
}
