import { content } from "@/lib/content";

export function Skills() {
  return (
    <section
      id="skills"
      data-zone="midnight"
      aria-labelledby="skills-title"
      className="relative px-6 py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2
          id="skills-title"
          className="font-[family-name:var(--font-display)] text-[length:var(--fs-3xl)] leading-tight text-[var(--text)]"
        >
          Skills
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {content.skills.map((group) => (
            <li key={group.title}>
              <h3 className="text-[length:var(--fs-sm)] font-medium uppercase tracking-[0.2em] text-[var(--text)]/70">
                {group.title}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    data-skill={item}
                    className="rounded-full border border-[var(--text)]/25 px-3 py-1.5 text-[length:var(--fs-sm)] text-[var(--text)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
