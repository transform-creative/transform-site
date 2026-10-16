import type { ICON_SVG } from "~/presentation/elements/icons/IconSvg";

/** Every icon in the generated registry — see setup/icons/used-icons.txt.
 *  Naming one that isn't there is a typecheck error, not a blank icon. */
export type IoniconName = keyof typeof ICON_SVG;
