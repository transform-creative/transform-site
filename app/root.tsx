import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import {
  AlertType,
  PopAlertFn,
  SharedContextProps,
} from "./data/CommonTypes";
import Alert from "./presentation/elements/Alert";
import { useEffect, useState } from "react";
import { supabase } from "./database/SupabaseClient";
import { Session } from "@supabase/supabase-js";
import { HeaderBar } from "./presentation/HeaderBar";
import { FooterBar } from "./presentation/FooterBar";

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
  description:
    "Adelaide creative agency specialising in websites, video production and software for Australian not-for-profits and charities.",
  areaServed: ["South Australia", "Australia"],
  knowsAbout: [
    "Nonprofit website design",
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
    <html lang="en">
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
      </body>
    </html>
  );
}

export default function App() {
  const shrinkWidth = 1200;

  const [alert, setAlert] = useState<AlertType>({
    active: false,
  });

  const [session, setSession] = useState<Session | null>();
  const [inShrink, setInShrink] = useState(
    window.innerWidth < shrinkWidth
  );
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (_event == "SIGNED_IN" || _event == "TOKEN_REFRESHED") {
        //Perform sign in actions here
      }
      setSession(session);
    });
  }, []);

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
            session,
            navigate,
            inShrink,
          } as SharedContextProps;


  return (
    <div style={{}}>
      <div
        className="vertical-line slowFade"
        style={{
          left: `${inShrink ? "2%" : "10%"}`,
          top: 0,
        }}
      />
      <div
        className="vertical-line mediumFade"
        style={{
          right: `${inShrink ? "2%" : "10%"}`,
          top: 0,
          width: 1,
        }}
      />
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
      <FooterBar />
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
