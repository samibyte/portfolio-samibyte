import Link from "next/link";
import type { Project } from "@/lib/types";
import { Architecture } from "@/components/casestudy/Architecture";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[var(--text)]/20 p-6 transition-colors duration-200 hover:border-[var(--text)]/40 focus-within:border-[var(--text)]/40">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-0.5 rounded-2xl border border-[var(--text)]/40 opacity-0 group-hover:animate-ping group-focus-within:animate-ping motion-reduce:hidden"
      />
      <p className="text-[length:var(--fs-xs)] font-medium uppercase tracking-[0.2em] text-[var(--text)]/70">
        {project.tag}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--fs-2xl)] leading-tight text-[var(--text)]">
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
            className="rounded-full border border-[var(--text)]/25 px-2.5 py-1 text-[length:var(--fs-xs)] text-[var(--text)]"
          >
            {item}
          </li>
        ))}
      </ul>
      {project.architecture && project.architecture.length > 0 ? (
        <div className="hidden group-hover:block group-focus-within:block [&>figure]:mt-3">
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
