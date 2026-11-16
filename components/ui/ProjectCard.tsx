import Link from "next/link";
import type { Project } from "@/lib/types";
import { Architecture } from "@/components/casestudy/Architecture";

function numeral(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <article
      id={`project-${project.slug}`}
      data-project
      className="strata-row group py-10 md:py-12"
    >
      <div className="flex items-start gap-5 md:gap-10">
        <span aria-hidden="true" className="strata-numeral shrink-0">
          {numeral(index)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,4.5rem)] leading-[0.95] tracking-[var(--tracking-tight)] text-[var(--text)]">
            <Link
              href={`/projects/${project.slug}`}
              className="inline-block py-1 underline-offset-4 hover:underline"
            >
              {project.title}
            </Link>
          </h3>

          <p className="mt-4 max-w-[var(--measure-body)] text-[length:var(--fs-lg)] leading-[var(--leading-body)] text-[var(--text)]">
            {project.tagline}
          </p>

          <ul
            aria-label="Stack"
            className="strata-stack instrument mt-5 text-[length:var(--fs-xs)] text-[var(--text)]"
          >
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {project.architecture && project.architecture.length > 0 ? (
            <div className="hidden min-w-0 group-hover:block group-focus-within:block">
              <Architecture nodes={project.architecture} />
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[length:var(--fs-sm)]">
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex min-h-6 items-center py-1 font-medium text-[var(--text)] underline underline-offset-4"
            >
              Read case study
            </Link>
            {project.source ? (
              <a
                href={project.source}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-6 items-center py-1 text-[var(--text)] underline underline-offset-4"
              >
                Source
              </a>
            ) : null}
            {project.live ? (
              <a
                href={project.live}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-6 items-center py-1 text-[var(--text)] underline underline-offset-4"
              >
                Live
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
