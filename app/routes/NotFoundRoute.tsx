import { isRouteErrorResponse, Link, useNavigate, useOutletContext } from "react-router";
import { Route } from "../+types/root";
import "../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import { NAV_LINKS } from "~/data/Objects";
import { Icon } from "~/presentation/elements/Icon";
import { buildMeta } from "~/business/seoBL";

/*
 * Catch-all ("*") for URLs no other route matches.
 *
 * Prerendered once at /404 and moved to build/client/404.html by `buildEnd`
 * in react-router.config.ts. vercel.json only rewrites the auth-only routes
 * to the SPA shell, so any other unknown URL falls through to Vercel's
 * not-found handling, which serves that file with a real 404 status (not a
 * soft 404 with the homepage's title). The SPA then hydrates it here.
 */

export function meta() {
  return buildMeta({
    title: "Page not found | Transform Creative",
    description: "The page you were looking for could not be found.",
    path: "/",
    noIndex: true,
  });
}

export default function NotFoundRoute() {
  const context: SharedContextProps = useOutletContext();

  return (
    <main className="vh100 middle center col gap-20 shrink-p-10 border-box">
      <h1 className="textCenter" style={{ color: "var(--accent)" }}>
        Page not found
      </h1>
      <p className="textCenter">
        That page doesn't exist, or it has moved. Try one of these instead:
      </p>
      <nav
        className={`row wrap middle center gap-10 ${context.inShrink ? "col" : ""}`}
      >
        {NAV_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="btn-look link-plain">
            {link.footerLabel}
          </Link>
        ))}
        <Link to="/contact" className="btn-look no-underline accent">
          Contact
        </Link>
      </nav>
    </main>
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
        <Icon
          name="information-circle"
          className="mr1"
          color="var(--accent)"
          size={15}
        />
        <p>{details}</p>
      </div>
      <button
        className="mt3 accentButton row middle center"
        onClick={() => navigate("/")}
      >
        <Icon
          name="home"
          size={12}
          color="var(--txt)"
          className="mr1"
        />
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
