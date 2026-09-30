import type { SharedContextProps } from "~/data/CommonTypes";
import { useNavigate, useOutletContext } from "react-router";
import { Logo } from "./elements/Logo";
import { useEffect, useState } from "react";
import { CONTACT } from "~/data/Objects";
import "../app-v2.css";

export interface FooterBarProps {}

/******************************
 * FooterBar component
 * @todo Create description
 */
export function FooterBar({}: FooterBarProps) {
  const context: SharedContextProps = useOutletContext();
  const navigate = useNavigate();

  const [scroll, setScroll] = useState(0);

  return (
    <div className={`col middle between boxedAccent raised`}>
      <div className="col p-20 center middle">
        <div className="row middle center w100">
          <div className="pr-10">
            <a
              role="button"
              className="row center middle"
              target="_blank"
              rel="noreferrer"
              href={`mailto:${CONTACT.email}`}
            >
              Contact
            </a>
          </div>
          <button onClick={() => navigate("/")}>Home</button>

          <button onClick={() => navigate("/development")}>
            Software
          </button>
          <button onClick={() => navigate("/media")}>Video</button>
          <button onClick={() => navigate("/portfolio")}>
            Portfolio
          </button>
        </div>
                <div> <p>© {new Date().getFullYear()} Transform Creative</p></div>

      </div>
    </div>
  );
}
