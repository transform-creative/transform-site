import { Link } from "react-router";
import { CONTACT, NAV_LINKS, SOCIAL_LINKS } from "~/data/Objects";
import { Icon } from "./elements/Icon";
import { FiaBadge } from "./elements/FiaBadge";
import { optimisedImage } from "~/business/commonBL";
import "../app-v2.css";
import { SharedContextProps } from "~/data/CommonTypes";

export interface FooterBarProps {context:SharedContextProps}

/******************************
 * FooterBar component
 * Site links (real <a> tags so crawlers follow them) plus the business
 * location and email, kept consistent with the Google Business Profile.
 */
export function FooterBar({context}: FooterBarProps) {
  return (
    <footer className={`col middle between boxedAccent raised`}>
      <div className={`w-100 center middle row shrink-col`}>
        <div className="col gap-10" style={{ margin: context.inShrink ? 20 : "0px 0px 0px 100px" }}>
          <div>
             <ul  className={`row gap-10 m0 p0 list-none ${context.inShrink && "center"}`}>
            {SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Transform Creative on ${link.label}`}
                  className="link-plain"
                >
                  <Icon name={link.icon} size={20} />
                </a>
              </li>
            ))}
          </ul>
            <img
              style={{ height: 100 }}
              src={
                "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/images/TC_LOGO_WHITE.png"
              }
              alt="Transform Creative"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p>
            We work with not for profit Aussie orgs to create websites
            and videos that help you raise money and increase impact.
          </p>
         
          <FiaBadge context={context} />
        </div>

        {/* <address className="col p-20  mb-10 boxed middle center gap-5 mt-10">
          <p className="m0 mb-5">
            <b style={{ fontWeight: 600, color: "var(--txt)" }}>
              {CONTACT.location}
            </b>
          </p>
          <a className="link-plain" href={`mailto:${CONTACT.email}`}>
            {CONTACT.email}
          </a>
        </address> */}
        <div className="w-100">
          <nav
            className="col  wrap gap-10"
            style={{ margin: context.inShrink ? "0 0 20px 0" : "50px 100px 50px 20px", alignItems: context.inShrink ? "center" : "end" }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="btn-look link-plain txt"
              >
                {link.footerLabel}
              </Link>
            ))}
            <Link to="/contact" className="btn-look txt link-plain">
              Contact
            </Link>
          </nav>
        </div>
      </div>
      <div className="mb-20">
        <p><b>© {new Date().getFullYear()} Transform Creative</b></p>
      </div>
    </footer>
  );
}
