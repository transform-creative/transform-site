import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router";
import type { Session } from "@supabase/supabase-js";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { Business } from "~/data/CustomTypes";
import { getBusinessById, getUserMembership } from "~/database/Read";
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

// The viewer's resolved access: which business they belong to and as what role.
// `business` is only loaded for admins. `undefined` while still resolving.
type Access =
  | { role: "client"; businessId: number; orgBusinessId: number | null }
  | { role: "admin"; businessId: number; business: Business };

export default function ClientRoute() {
  const context: SharedContextProps = useOutletContext();
  const { id } = useParams<{ id: string }>();

  // `session` is `undefined` while auth is still resolving on first load.
  const session = context.session as Session | null | undefined;
  const user = session?.user;
  const isOwnPortal = !!user && user.id === id;
  // The resolved access; `undefined` while we look up the membership.
  const [access, setAccess] = useState<Access | null | undefined>(undefined);

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

    // The single source of truth: the user's profiles_to_businesses membership.
    let active = true;
    getUserMembership(user.id)
      .then(async (membership) => {
        if (!active) return;
        if (!membership) {
          context.navigate("/");
          return;
        }
        if (membership.role === "client") {
          setAccess({
            role: "client",
            businessId: membership.business_id,
            orgBusinessId: membership.orgBusinessId,
          });
          return;
        }
        // Admin: load the business backing the board.
        const business = await getBusinessById(membership.business_id);
        if (!active) return;
        if (!business) {
          context.navigate("/");
          return;
        }
        setAccess({
          role: "admin",
          businessId: membership.business_id,
          business,
        });
      })
      .catch(() => {
        if (!active) return;
        setAccess(null);
        context.navigate("/");
      });
    return () => {
      active = false;
    };
  }, [session, user, isOwnPortal, id]);

  // Don't render the portal to unauthorised viewers while we redirect, or until
  // the membership lookup has resolved.
  if (!user || !isOwnPortal || !id || !access) {
    return null;
  }

  return (
    <ClientPortal
      clientId={id}
      businessId={access.businessId}
      orgBusinessId={access.role === "client" ? access.orgBusinessId : null}
      business={access.role === "admin" ? access.business : undefined}
    />
  );
}
