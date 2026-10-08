import { Link } from "react-router";
import { CONTACT, NAV_LINKS } from "~/data/Objects";
import "../app-v2.css";

export interface FooterBarProps {}

/******************************
 * FooterBar component
 * Site links (real <a> tags so crawlers follow them) plus the business
 * location and email, kept consistent with the Google Business Profile.
 */
export function FooterBar({}: FooterBarProps) {
  return (
    <footer className={`col middle between boxedAccent raised`}>
      <div className="col p-20 center middle">
        {/* wrap: five links don't fit one line on a phone */}
        <nav className="row middle center wrap gap-10 w100">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="btn-look link-plain"
            >
              {link.footerLabel}
            </Link>
          ))}
          <Link to="/contact" className="btn-look link-plain">
            Contact
          </Link>
        </nav>
        <address className="col middle center gap-5 mt-10">
          <a
            className="link-plain"
            href={`mailto:${CONTACT.email}`}
          >
            {CONTACT.email}
          </a>
          <p className="m0">{CONTACT.location}</p>
        </address>
        <div>
          <p>© {new Date().getFullYear()} Transform Creative</p>
        </div>
      </div>
    </footer>
  );
}
