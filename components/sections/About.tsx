import { content } from "@/lib/content";

export function About() {
  return (
    <section
      id="about"
      data-zone="twilight"
      aria-labelledby="about-title"
      className="relative px-6 py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2
          id="about-title"
          className="font-[family-name:var(--font-display)] text-[length:var(--fs-3xl)] leading-tight text-[var(--text)]"
        >
          About
        </h2>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {content.about.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="max-w-prose text-[length:var(--fs-base)] leading-relaxed text-[var(--text)]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div>
            <h3 className="text-[length:var(--fs-sm)] font-medium uppercase tracking-[0.2em] text-[var(--text)]/70">
              Principles
            </h3>
            <ul className="mt-5 space-y-5">
              {content.principles.map((principle) => (
                <li key={principle.title}>
                  <h4 className="font-[family-name:var(--font-display)] text-[length:var(--fs-xl)] text-[var(--text)]">
                    {principle.title}
                  </h4>
                  <p className="mt-1 text-[length:var(--fs-sm)] leading-relaxed text-[var(--text)]/90">
                    {principle.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-[length:var(--fs-sm)] font-medium uppercase tracking-[0.2em] text-[var(--text)]/70">
            Journey
          </h3>
          <ol className="mt-5 space-y-8 border-l border-[var(--text)]/20 pl-5">
            {content.journey.map((entry) => (
              <li key={`${entry.period}-${entry.title}`}>
                <p className="text-[length:var(--fs-xs)] uppercase tracking-[0.15em] text-[var(--text)]/70">
                  {entry.period} · {entry.kind}
                </p>
                <h4 className="mt-1 font-[family-name:var(--font-display)] text-[length:var(--fs-xl)] text-[var(--text)]">
                  {entry.title}
                </h4>
                <p className="mt-1 text-[length:var(--fs-sm)] text-[var(--text)]">
                  {entry.detail}
                </p>
                {("description" in entry) && entry.description ? (
                  <p className="mt-2 max-w-prose text-[length:var(--fs-sm)] leading-relaxed text-[var(--text)]/90">
                    {entry.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
