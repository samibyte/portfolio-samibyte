import { PROJECTS } from "@/lib/projects";
import { ProjectCard } from "@/components/ui/ProjectCard";

export function Projects() {
  return (
    <section
      id="projects"
      data-zone="sunlight"
      aria-labelledby="projects-title"
      className="relative px-6 py-24"
    >
      <div data-water-block className="mx-auto w-full max-w-6xl">
        <h2
          id="projects-title"
          className="font-[family-name:var(--font-display)] text-[length:var(--fs-3xl)] leading-tight text-[var(--text)]"
        >
          Projects
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {PROJECTS.map((project) => (
            <li key={project.slug} className="min-w-0">
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
