import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/LandingRoute.tsx"),
  route("/home", "routes/HomeRoute.tsx"),
  route("/portfolio", "routes/MediaRoute.tsx"),
  route("/contact", "routes/ContactRoute.tsx"),
  route("/development", "routes/DevelopmentRoute.tsx"),
    route("/auth", "routes/AuthenticationRoute.tsx"),
  route("/client", "routes/ClientIndexRoute.tsx"),
  route("/client/:id", "routes/ClientRoute.tsx"),
  route("", "routes/ErrorBoundary.tsx"),
] satisfies RouteConfig;
