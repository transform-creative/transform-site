import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router";
import { Analytics } from "@vercel/analytics/react";

import type { Route } from "./+types/root";
import "./app.css";
import {
  AlertType,
  PopAlertFn,
  SharedContextProps,
} from "./data/CommonTypes";
import Alert from "./presentation/elements/Alert";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { HeaderBar } from "./presentation/HeaderBar";
import { FooterBar } from "./presentation/FooterBar";
import { SOCIAL_LINKS } from "./data/Objects";

export const links: Route.LinksFunction = () => [
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com",
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap",
  },
  {
    rel: "icon",
    href: "/transform-icon-color-donut.png",
  },
  {
    rel: "preload",
    href: "/SIFONN_PRO.otf",
    as: "font",
    type: "font/otf",
    crossOrigin: "anonymous",
  },
];

export const meta: Route.MetaFunction = () => [
  { title: "Transform Creative | Website & Video for Nonprofits" },
  {
    name: "description",
    content:
      "Adelaide creative agency specialising in websites, video production and software for Australian not-for-profits and charities. Built to drive real change.",
  },
]

/** Routes that sign people in or read their data, so need supabase-js */
const APP_ROUTES = [
  "/auth",
  "/client",
  "/radar",
  "/forms",
  "/church-comms-survey",
];

/** Where supabase-js keeps the session: sb-<project ref>-auth-token */
const AUTH_STORAGE_KEY = `sb-${
  new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(".")[0]
}-auth-token`;

/*******************************************
 * Whether this page needs the auth client. supabase-js is ~200KB, so public
 * visitors who have never signed in never download it. Anyone with a stored
 * session does, so the header can still show their portal link.
 */
function needsAuth(pathname: string): boolean {
  if (APP_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`)))
    return true;
  if (typeof window === "undefined") return false; // prerender
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null;
  } catch {
    return false; // storage blocked
  }
}

export function HydrateFallback() {

  return (
    <div
      style={{ width: "100%", height: "100vh" }}
      className="col middle center"
    >
      <img
        src="/transform-icon-color-donut.png"
        className="spin360"
        style={{ height: 100, width: 100 }}
        alt="digital content for positive change | Adelaide based film, software and design business"
      />
    </div>
  );
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Transform Creative",
  url: "https://www.transformcreative.com.au",
  logo: "https://www.transformcreative.com.au/transform-icon-color-donut.png",
  sameAs: SOCIAL_LINKS.map((link) => link.href),
  description:
    "Adelaide creative agency specialising in websites, video production and software for Australian not-for-profits and charities.",
  areaServed: ["South Australia", "Australia"],
  memberOf: {
    "@type": "Organization",
    name: "Fundraising Institute Australasia",
    url: "https://www.fia.org.au",
  },
  knowsAbout: [
    "Not-for-profit website design",
    "Video production",
    "Software development",
    "Charity digital content",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Adelaide",
    addressRegion: "SA",
    addressCountry: "AU",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Transform Creative",
  description:
    "Adelaide creative agency specialising in websites, video production and software for Australian not-for-profits and charities.",
  url: "https://www.transformcreative.com.au",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Adelaide",
    addressRegion: "SA",
    addressCountry: "AU",
  },
  knowsAbout: [
    "Nonprofit digital content",
    "Video production South Australia",
    "Charity website design",
  ],
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <Meta />
        <Links />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export default function App() {
  const shrinkWidth = 1200;

  const [alert, setAlert] = useState<AlertType>({
    active: false,
  });

  // undefined = still resolving; auth-guarded routes wait for it
  const [session, setSession] = useState<Session | null>();
  const [authStarted, setAuthStarted] = useState(false);
  // Starts false so prerendered HTML and the client's first render agree (no
  // hydration mismatch). The resize effect below corrects it on mount.
  const [inShrink, setInShrink] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Worked out during render, not in an effect: child effects run first, so
  // an app route's auth guard would otherwise see a null session and
  // redirect before the client had loaded.
  const authActive = authStarted || needsAuth(pathname);

  useEffect(() => {
    if (!authActive || authStarted) return;
    setAuthStarted(true);
    import("./database/SupabaseClient").then(({ supabase }) => {
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
    });
  }, [authActive, authStarted]);

  /******************************
   * Check screen width
   */
  useEffect(() => {
    const handleResize = () => {
      setInShrink(window.innerWidth < shrinkWidth);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /** Activate the saved popup box */
  const popAlert: PopAlertFn = (header, body, isError = false) => {
    setAlert({
      active: true,
      header: header,
      body: body,
      state: isError ? "fail" : "success",
    });
  };
const CONTEXT =  {
            popAlert: popAlert,
            session: authActive ? session : null,
            navigate,
            inShrink,
          } as SharedContextProps;


  return (
    <div style={{}}>
    
      <HeaderBar inShrink={inShrink}  context={CONTEXT}/>
      <Outlet
        context={
         CONTEXT
        }
      />

      <Alert
        header={alert.header}
        body={alert.body}
        active={alert.active}
        onClose={() => setAlert({ active: false })}
        state={alert.state}
      />
      <FooterBar context={CONTEXT} />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const navigate = useNavigate();
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="vh100 middle center col">
      <h1 className="mb2" style={{ color: "var(--accent)" }}>
        {message}
      </h1>
      <div className="row middle center">
        <p>{details || ""}</p>
      </div>
      <button
        className="mt3 accentButton row middle center"
        onClick={() => navigate("/")}
      >
        Home
      </button>

      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
