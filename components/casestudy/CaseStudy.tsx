import Link from "next/link";
import type { ReactNode } from "react";
import type { ZoneId, Project } from "@/lib/types";
import { Architecture } from "./Architecture";

const LIGHT = "text-[#e0e8f0]";
const BAR_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0e8f0]";

function Section({
  id,
  zone,
  title,
  children,
}: {
  id: string;
  zone: ZoneId;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-zone={zone}
      aria-labelledby={`${id}-title`}
      className="relative px-6 py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2
          id={`${id}-title`}
          className="font-[family-name:var(--font-display)] text-[length:var(--fs-3xl)] leading-tight text-[var(--text)]"
        >
          {title}
        </h2>
        <div className="mt-6 max-w-prose space-y-5 text-[length:var(--fs-base)] leading-relaxed text-[var(--text)]">
          {children}
        </div>
      </div>
    </section>
  );
}

export function CaseStudy({ project }: { project: Project }) {
  return (
    <div className="pt-16">
      <header className="sticky top-16 z-10 border-b border-[#e0e8f0]/20 bg-[var(--panel)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-6 py-4">
          <div>
            <Link
              href="/#projects"
              className={`text-sm ${LIGHT} underline underline-offset-4 ${BAR_FOCUS}`}
            >
              ← All projects
            </Link>
            <p className="mt-3 text-[length:var(--fs-xs)] uppercase tracking-[0.2em] text-[#e0e8f0]/70">
              {project.tag}
            </p>
            <h1
              className={`mt-1 font-[family-name:var(--font-display)] text-[length:var(--fs-2xl)] leading-tight ${LIGHT}`}
            >
              {project.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 text-[length:var(--fs-sm)]">
            {project.source ? (
              <a
                href={project.source}
                target="_blank"
                rel="noreferrer"
                className={`${LIGHT} underline underline-offset-4 ${BAR_FOCUS}`}
              >
                Source
              </a>
            ) : null}
            {project.live ? (
              <a
                href={project.live}
                target="_blank"
                rel="noreferrer"
                className={`${LIGHT} underline underline-offset-4 ${BAR_FOCUS}`}
              >
                Live
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <Section id="problem" zone="sunlight" title="Problem">
        <p>{project.problem}</p>
      </Section>

      <Section id="solution" zone="twilight" title="Solution">
        <p>{project.solution}</p>
      </Section>

      <Section id="challenge" zone="abyss" title="Challenge">
        <p>{project.challenge}</p>

        <Architecture nodes={project.architecture} />

        {project.decision ? (
          <div className="mt-10 rounded-2xl border border-[var(--text)]/25 p-6">
            <h3 className="font-[family-name:var(--font-display)] text-[length:var(--fs-xl)] text-[var(--text)]">
              {project.decision.title}
            </h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-[length:var(--fs-xs)] uppercase tracking-[0.2em] text-[var(--text)]/70">
                  Tradeoff
                </dt>
                <dd className="mt-1">{project.decision.tradeoff}</dd>
              </div>
              <div>
                <dt className="text-[length:var(--fs-xs)] uppercase tracking-[0.2em] text-[var(--text)]/70">
                  What changed
                </dt>
                <dd className="mt-1">{project.decision.changed}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Section>

      <Section id="outcome" zone="midnight" title="Outcome">
        <p>{project.outcome}</p>
      </Section>

      <Section id="takeaway" zone="twilight" title="Takeaway">
        <p>{project.takeaway}</p>
      </Section>
    </div>
  );
}
