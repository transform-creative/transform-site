import { useEffect } from "react";
import { useOutletContext, useParams } from "react-router";
import type { Session } from "@supabase/supabase-js";
import type { SharedContextProps } from "~/data/CommonTypes";
import { ClientPortal } from "~/presentation/client/ClientPortal";
import { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Client Portal | Transform Creative" },
    {
      name: "description",
      content: "Your Transform Creative client portal.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function ClientRoute() {
  const context: SharedContextProps = useOutletContext();
  const { id } = useParams<{ id: string }>();

  // `session` is `undefined` while auth is still resolving on first load.
  const session = context.session as Session | null | undefined;
  const user = session?.user;
  // A client is any signed-in user whose app_metadata carries a `client_of`
  // (their business id). They may only view their own portal.
  const isClient = !!user?.app_metadata?.client_of;
  const isOwnPortal = !!user && user.id === id;

  useEffect(() => {
    // Wait until the session has resolved before deciding.
    if (session === undefined) return;

    if (!user) {
      context.navigate("/auth");
      return;
    }

    if (!isClient || !isOwnPortal) {
      context.navigate("/");
    }
  }, [session, user, isClient, isOwnPortal]);

  // Don't render the portal to unauthorised viewers while we redirect.
  if (!user || !isClient || !isOwnPortal || !id) {
    return null;
  }

  return <ClientPortal clientId={id} />;
}
