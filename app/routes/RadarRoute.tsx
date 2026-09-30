import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import type { Session } from "@supabase/supabase-js";
import type { SharedContextProps } from "~/data/CommonTypes";
import { getUserMembership } from "~/database/Read";
import { TRANSFORM_BUSINESS_ID } from "~/business/radarBL";
import { Radar } from "~/presentation/radar/Radar";
import { buildMeta } from "~/business/seoBL";
import "../app-v2.css";

export function meta() {
  return buildMeta({
    title: "Radar | Transform Creative",
    description: "Charity lead radar.",
    path: "/radar",
    noIndex: true,
  });
}

/******************************
 * /radar: the ACNC warm-lead dashboard. Transform Creative agency admins only
 * (RLS on `orgs` enforces the same thing server-side).
 */
export default function RadarRoute() {
  const context: SharedContextProps = useOutletContext();

  // `session` is `undefined` while auth is still resolving on first load.
  const session = context.session as Session | null | undefined;
  const user = session?.user;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (session === undefined) return;

    if (!user) {
      context.navigate("/auth");
      return;
    }

    let active = true;
    getUserMembership(user.id)
      .then((membership) => {
        if (!active) return;
        if (
          membership?.role === "admin" &&
          membership.business_id === TRANSFORM_BUSINESS_ID
        ) {
          setAllowed(true);
        } else {
          context.navigate("/");
        }
      })
      .catch(() => {
        if (active) context.navigate("/");
      });
    return () => {
      active = false;
    };
  }, [session, user]);

  if (!user || !allowed) return null;

  return <Radar />;
}
