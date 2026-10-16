import { Link, useOutletContext } from "react-router";
import "../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { IoniconName } from "~/data/Ionicons";
import { CONTACT } from "~/data/Objects";
import { ContactTab } from "~/presentation/landing/ContactTab";
import { Icon } from "~/presentation/elements/Icon";
import { buildMeta, canonical } from "~/business/seoBL";

export function meta() {
  return buildMeta({
    title: "Contact Transform Creative | Adelaide",
    description:
      "Book a free discovery call with Transform Creative, an Adelaide agency making websites, fundraising platforms and video for not-for-profits. Here's what happens next.",
    path: "/contact",
    twitterDescription:
      "Book a free discovery call with Transform Creative in Adelaide, and see what happens after you get in touch.",
  });
}

export const links = () => [canonical("/contact")];

/** What happens after someone gets in touch. Drawn from the process copy on
 *  /development (HOW_IT_WORKS) and /media (MEDIA_HOW_WE_WORK) — keep in step. */
const NEXT_STEPS: { icon: IoniconName; title: string; body: string }[] = [
  {
    icon: "chatbubbles-outline",
    title: "A free discovery call",
    body: "Book a time that suits you, or email us and we'll set one up. It's a relaxed chat about your organisation, what you're trying to achieve and what's getting in the way. No obligation, and no hard sell.",
  },
  {
    icon: "search-outline",
    title: "We look at where you are now",
    body: "For a website or fundraising platform, that usually means mapping what your current setup costs you, including the 'cover our costs' tips your donors get asked to add. For video, it means learning your story and who you need to reach.",
  },
  {
    icon: "document-text-outline",
    title: "A clear, fixed proposal",
    body: "We put what you need in writing with a fixed price, so you can take it to your board knowing exactly what you'll get and what it costs before any work starts.",
  },
  {
    icon: "hammer-outline",
    title: "We make it with you, then stick around",
    body: "You'll see real progress early and hear from us regularly, never a big reveal at the end. Once it's live we keep looking after it: hosting and updates for websites, cut-downs for social and advice on getting your video seen.",
  },
];

export default function ContactRoute() {
  const context: SharedContextProps = useOutletContext();

  return (
    <main className="col middle w-100 gap-20 shrink-p-10 border-box">
      <header
        className={`col middle center gap-10 mt-20 ${context.inShrink ? "w-100" : "w-50"}`}
      >
        <h1
          className="textCenter"
          style={{ color: "var(--txt)", letterSpacing: -1.5 }}
        >
          Let's talk about your{" "}
          <strong style={{ fontWeight: 600 }}>next project</strong>
        </h1>
        <p className="textCenter">
          We're an Adelaide creative agency making websites, fundraising
          platforms and video for Australian not-for-profits, charities and
          churches. Whether it's an appeal coming up, a website that's
          overdue for a rebuild or a platform you're outgrowing, tell us what
          you're working on and we'll take it from there.
        </p>
      </header>

      <ContactTab showHeader={false} />

      <div className="horizontal-line mediumFade" />

      <section
        className={`col gap-20 ${context.inShrink ? "w-100" : "w-50"}`}
      >
        <h2 className="textCenter" style={{ color: "var(--txt)" }}>
          What happens after you get in touch
        </h2>
        <ol className="col gap-20 p0 m0 list-none">
          {NEXT_STEPS.map((step, i) => (
            <li key={step.title} className="row gap-20 shrink-col">
              <Icon name={step.icon} size={35} color="var(--accent)" />
              <div className="col gap-5">
                <h3>
                  {i + 1}. {step.title}
                </h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="horizontal-line mediumFade" />

      <section
        className={`col middle center gap-10 ${context.inShrink ? "w-100" : "w-50"}`}
      >
        <h2 className="textCenter" style={{ color: "var(--txt)" }}>
          Not sure where to start?
        </h2>
        <p className="textCenter">
          See what we do, then get in touch when you're ready. We're based in{" "}
          {CONTACT.location} and work with organisations right across
          Australia.
        </p>
        <nav className="row wrap middle center gap-10">
          <Link to="/development" className="btn-look link-plain">
            Websites & fundraising platforms
          </Link>
          <Link to="/media" className="btn-look link-plain">
            Video production
          </Link>
          <Link to="/church" className="btn-look link-plain">
            Church comms
          </Link>
          <Link to="/portfolio" className="btn-look link-plain">
            Our work
          </Link>
        </nav>
      </section>
      <div style={{ height: 60 }} />
    </main>
  );
}
