import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router";
import type { Session } from "@supabase/supabase-js";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { Business } from "~/data/CustomTypes";
import { getBusinessForUser } from "~/database/Read";
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
  // An admin is a signed-in user who owns a `businesses` row. `undefined` while
  // we're still checking; `null` once we know they own no business.
  const [business, setBusiness] = useState<Business | null | undefined>(
    undefined
  );

  useEffect(() => {
    // Wait until the session has resolved before deciding.
    if (session === undefined) return;

    if (!user) {
      context.navigate("/auth");
      return;
    }

    if (!isOwnPortal) {
      context.navigate("/");
      return;
    }

    // Clients are admitted directly; no business lookup needed.
    if (isClient) {
      setBusiness(null);
      return;
    }

    // Otherwise the only way in is owning a business — look it up.
    let active = true;
    getBusinessForUser(user.id)
      .then((b) => {
        if (!active) return;
        setBusiness(b);
        if (!b) context.navigate("/");
      })
      .catch(() => {
        if (!active) return;
        setBusiness(null);
        context.navigate("/");
      });
    return () => {
      active = false;
    };
  }, [session, user, isClient, isOwnPortal, id]);

  // Don't render the portal to unauthorised viewers while we redirect.
  if (!user || !isOwnPortal || !id) {
    return null;
  }

  if (isClient) {
    return <ClientPortal clientId={id} />;
  }

  // Admin path: wait until the business ownership check resolves.
  if (business === undefined || !business) {
    return null;
  }

  return <ClientPortal clientId={id} business={business} />;
}
