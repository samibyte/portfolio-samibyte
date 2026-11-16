import { PROJECTS } from "@/lib/projects";
import { SECTION_ZONE, ZONES } from "@/lib/zones";
import { glass } from "@/lib/glass";
import { ProjectCard } from "@/components/ui/ProjectCard";

const PROJECT_ZONE =
  ZONES.find((zone) => zone.id === SECTION_ZONE.projects) ?? ZONES[0];

export function Projects() {
  return (
    <section
      id="projects"
      data-zone="sunlight"
      aria-labelledby="projects-title"
      className="relative px-6 py-[var(--station-pad)]"
    >
      <div
        data-water-block
        className="mx-auto grid w-full max-w-[96rem] gap-x-10 gap-y-10 md:grid-cols-[8rem_minmax(0,1fr)] lg:grid-cols-[11rem_minmax(0,1fr)]"
      >
        <div className="min-w-0">
          <div
            data-station="projects"
            className={glass({
              variant: "panel",
              tone: "strong",
              className:
                "strata-plate flex w-fit items-center gap-3 px-4 py-3 md:sticky md:top-24 md:flex-col md:items-start md:gap-2",
            })}
          >
            <span className="instrument text-[length:var(--fs-xs)] text-[var(--text)]">
              02
            </span>
            <span
              aria-hidden="true"
              className="h-px w-8 shrink-0 bg-current opacity-30 md:w-10"
            />
            <span className="instrument text-[length:var(--fs-xs)] text-[var(--text)]">
              Index
            </span>
            <span className="instrument text-[length:var(--fs-xs)] text-[var(--text)]">
              {PROJECT_ZONE.label}
            </span>
            <span className="instrument text-[length:var(--fs-xs)] text-[var(--text)]">
              {PROJECT_ZONE.metersFrom}–{PROJECT_ZONE.metersTo} M
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <h2
            id="projects-title"
            className="font-[family-name:var(--font-display)] text-[length:var(--fs-display)] leading-[0.9] tracking-[var(--tracking-tight)] text-[var(--text)]"
          >
            Projects
          </h2>
          <ol className="mt-10 md:mt-16">
            {PROJECTS.map((project, index) => (
              <li key={project.slug} className="min-w-0">
                <ProjectCard project={project} index={index} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
