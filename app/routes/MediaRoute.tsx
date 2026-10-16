import { Portfolio } from "~/presentation/media/Portfolio";
import { buildMeta, canonical } from "~/business/seoBL";

export function meta() {
  return buildMeta({
    title:
      "Portfolio | Nonprofit Video & Web Projects | Transform Creative",
    description:
      "Browse our work with South Australian and Australian nonprofits — video production, custom websites, and software that builds trust and drives impact.",
    path: "/portfolio",
    twitterDescription:
      "Browse our work with South Australian and Australian nonprofits — video production, custom websites, and software that builds trust.",
  });
}

export const links = () => [canonical("/portfolio")];

export default function MediaRoute() {
  return <Portfolio />;
}
