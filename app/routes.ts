import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/LandingRoute.tsx"),
  route("/home", "routes/HomeRoute.tsx"),
  route("/portfolio", "routes/MediaRoute.tsx"),
  route("/portfolio/:slug", "routes/ProjectRoute.tsx"),
  route("/sitemap.xml", "routes/SitemapRoute.ts"),
  route("/contact", "routes/ContactRoute.tsx"),
  route("/development", "routes/DevelopmentRoute.tsx"),
  route("/media", "routes/MediaServicesRoute.tsx"),
  route("/church", "routes/ChurchRoute.tsx"),
    route("/auth", "routes/AuthenticationRoute.tsx"),
  route("/client", "routes/ClientIndexRoute.tsx"),
  route("/client/:id", "routes/ClientRoute.tsx"),
  route("/forms/:id", "routes/FormRoute.tsx"),
  // Same component as /forms/:id, so it needs its own route id
  route("/church-comms-survey", "routes/FormRoute.tsx", {
    id: "church-comms-survey",
  }),
  route("/radar", "routes/RadarRoute.tsx"),
  route("", "routes/ErrorBoundary.tsx"),
] satisfies RouteConfig;
