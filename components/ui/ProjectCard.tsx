import Link from "next/link";
import type { Project } from "@/lib/types";
import { Architecture } from "@/components/casestudy/Architecture";
import { glass } from "@/lib/glass";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article
      className={glass({
        variant: "card",
        tone: "regular",
        interactive: true,
        className:
          "group relative flex h-full flex-col p-6 focus-within:border-[var(--text)]/40",
      })}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-0.5 rounded-2xl border border-[var(--text)]/40 opacity-0 group-hover:animate-ping group-focus-within:animate-ping motion-reduce:hidden"
      />
      <h3 className="font-[family-name:var(--font-display)] text-[length:var(--fs-2xl)] leading-tight text-[var(--text)]">
        <Link
          href={`/projects/${project.slug}`}
          className="py-1 underline-offset-4 hover:underline"
        >
          {project.title}
        </Link>
      </h3>
      <p className="mt-3 text-[length:var(--fs-base)] leading-relaxed text-[var(--text)]">
        {project.tagline}
      </p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Stack">
        {project.stack.map((item) => (
          <li
            key={item}
            className={glass({
              variant: "chip",
              tone: "clear",
              className: "px-2.5 py-1 text-[length:var(--fs-xs)] text-[var(--text)]",
            })}
          >
            {item}
          </li>
        ))}
      </ul>
      {project.architecture && project.architecture.length > 0 ? (
        <div className="hidden min-w-0 group-hover:block group-focus-within:block [&>figure]:mt-3">
          <Architecture nodes={project.architecture} />
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-4 pt-6 text-[length:var(--fs-sm)]">
        <Link
          href={`/projects/${project.slug}`}
          className="py-1 font-medium text-[var(--text)] underline underline-offset-4"
        >
          Read case study
        </Link>
        {project.source ? (
          <a
            href={project.source}
            target="_blank"
            rel="noreferrer"
            className="py-1 text-[var(--text)] underline underline-offset-4"
          >
            Source
          </a>
        ) : null}
        {project.live ? (
          <a
            href={project.live}
            target="_blank"
            rel="noreferrer"
            className="py-1 text-[var(--text)] underline underline-offset-4"
          >
            Live
          </a>
        ) : null}
      </div>
    </article>
  );
}
