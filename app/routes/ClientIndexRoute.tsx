import { useEffect } from "react";
import { useOutletContext } from "react-router";
import type { Session } from "@supabase/supabase-js";
import type { SharedContextProps } from "~/data/CommonTypes";
import { Route } from "../+types/root";
import "../app-v2.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Client Portal | Transform Creative" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

/******************************
 * `/client` — a parameterless entry point that forwards the signed-in user to
 * their own portal at `/client/:id`. Lets emails link to a stable `/client`
 * URL that resolves to whoever clicks it (the route itself is guarded so each
 * user only ever sees their own board). Sends signed-out visitors to sign in.
 */
export default function ClientIndexRoute() {
  const context: SharedContextProps = useOutletContext();
  // `session` is `undefined` while auth is still resolving on first load.
  const session = context.session as Session | null | undefined;

  useEffect(() => {
    if (session === undefined) return;
    if (!session?.user) {
      context.navigate("/auth");
      return;
    }
    context.navigate(`/client/${session.user.id}`, { replace: true });
  }, [session]);

  return null;
}
