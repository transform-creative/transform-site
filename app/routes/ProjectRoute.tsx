import { Link, useOutletContext, useParams } from "react-router";
import type { Route } from "./+types/ProjectRoute";
import "../app-v2.css";
import type { SharedContextProps } from "~/data/CommonTypes";
import { PROJECTS } from "~/data/Objects";
import {
  projectFromSlug,
  projectSlug,
  projectToIcon,
  projectTypeLabel,
} from "~/business/commonBL";
import { buildMeta, canonical, SITE_URL } from "~/business/seoBL";
import { Icon } from "~/presentation/elements/Icon";
import { VideoPlayer } from "~/presentation/elements/VideoPlayer";
import { ContactTab } from "~/presentation/landing/ContactTab";
import {
  ProjectDescription,
  ProjectEndorsement,
  ProjectGallery,
  ProjectMoreLink,
} from "~/presentation/landing/ProjectSections";

/*
 * /portfolio/:slug — the indexable twin of the ProjectInfoPopup. The popup is
 * still how people browse; this page exists so each project has its own URL,
 * title and description for search engines (and something shareable).
 * Every project is prerendered — see react-router.config.ts.
 */

/** "Crossover website" for Crossover reads badly as "… for Crossover" */
function projectHeading(name: string, org?: string): string {
  return org && !name.toLowerCase().includes(org.toLowerCase())
    ? `${name} for ${org}`
    : name;
}

/** First paragraph, cut on a word boundary to fit a meta description */
function shortDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max - 1))}…`;
}

export function meta({ params }: Route.MetaArgs) {
  const project = projectFromSlug(params.slug, PROJECTS);
  if (!project) {
    return buildMeta({
      title: "Project not found | Transform Creative",
      description: "This project couldn't be found.",
      path: `/portfolio/${params.slug}`,
      noIndex: true,
    });
  }

  const label = projectTypeLabel(project.type);
  const path = `/portfolio/${params.slug}`;
  return [
    ...buildMeta({
      title: `${projectHeading(project.name, project.organisation)} | ${label} | Transform Creative`,
      description: shortDescription(project.description[0] ?? label),
      path,
      image: project.images[0],
      imageWidth: 0,
      imageHeight: 0,
    }),
    // links() gets no params, so the per-project canonical rides on meta
    { tagName: "link", ...canonical(path) },
  ];
}

export default function ProjectRoute() {
  const context: SharedContextProps = useOutletContext();
  const { slug } = useParams();
  const project = projectFromSlug(slug, PROJECTS);

  if (!project) {
    return (
      <div className="col middle center gap-20" style={{ minHeight: "70vh" }}>
        <h1 className="textCenter">Project not found</h1>
        <Link to="/portfolio" className="btn-look link-plain">
          Back to the portfolio
        </Link>
      </div>
    );
  }

  const label = projectTypeLabel(project.type);
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    // Not VideoObject — that needs an uploadDate we don't record
    "@type": "CreativeWork",
    name: project.name,
    description: project.description.join(" "),
    url: `${SITE_URL}/portfolio/${projectSlug(project, PROJECTS)}`,
    image: project.images[0],
    genre: label,
    creator: {
      "@type": "Organization",
      name: "Transform Creative",
      url: SITE_URL,
    },
    ...(project.organisation && {
      sourceOrganization: {
        "@type": "Organization",
        name: project.organisation,
      },
    }),
  };

  return (
    <article className="col middle w-100 gap-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(creativeWorkSchema),
        }}
      />

      <header className="col middle center gap-10 mt-20 shrink-p-10 border-box">
        <Icon
          name={projectToIcon(project.type)}
          size={50}
          color="var(--accent)"
        />
        <h1
          className="textCenter"
          style={{ color: "var(--txt)", letterSpacing: -1.5 }}
        >
          <small className="eyebrow accent-text">{label}</small>
          {projectHeading(project.name, project.organisation)}
        </h1>
        <div className="row middle center wrap gap-10">
          {project.link && (
            <a
              style={{ textDecoration: "none" }}
              className="p2 accentButton row center middle"
              target="_blank"
              rel="noreferrer"
              href={project.link}
            >
              <Icon name="open-outline" className="mr2" />
              View live project
            </a>
          )}
          <Link
            to="/portfolio"
            className="btn-look link-plain row center middle gap-5"
          >
            <Icon name="arrow-back" color="var(--accent)" />
            All projects
          </Link>
        </div>
      </header>

      {project.video && (
        <div
          className={`${context.inShrink ? "w-100" : "w-75"} shrink-p-10 border-box`}
        >
          <VideoPlayer
            src={project.video}
            poster={project.images[0]}
            className="r-default"
            label={project.name}
          />
        </div>
      )}

      <div className="horizontal-line fade-md" />
      <div className="col middle w-75 shrink-p-10 border-box gap-20">
        <ProjectDescription project={project} />
        <ProjectGallery project={project} />
        <ProjectEndorsement project={project} />
        <ProjectMoreLink project={project} />
      </div>

      <div className="horizontal-line mediumFade mt-20" />
      <div className="w-100 col middle">
        <ContactTab />
      </div>
    </article>
  );
}
