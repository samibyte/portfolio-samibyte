import { content } from "@/lib/content";
import { glass } from "@/lib/glass";
import { BuoyChip } from "@/components/ui/BuoyChip";

export function Hero() {
  return (
    <section
      id="hero"
      data-zone="surface"
      aria-labelledby="hero-title"
      className="relative h-[calc(var(--vh)*100)] overflow-hidden"
    >
      <BuoyChip />
      <div className="absolute inset-x-0 top-[30%] -translate-y-1/2 px-6">
        <div data-water-block className="mx-auto w-full max-w-6xl">
          <p className="text-[length:var(--fs-xs)] uppercase tracking-[0.25em] text-[var(--text)]/70">
            {content.role} · {content.location}
          </p>
          <h1
            id="hero-title"
            className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[length:var(--fs-4xl)] leading-[1.05] text-[var(--text)]"
          >
            {content.name}
          </h1>
          <p className="mt-5 max-w-xl text-[length:var(--fs-lg)] leading-relaxed text-[var(--text)]">
            {content.hero.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {content.hero.ctas.map((cta) => {
              const external = cta.href.startsWith("http");
              return (
                <a
                  key={cta.label}
                  href={cta.href}
                  {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className={glass({
                    variant: "control",
                    tone: "solid",
                    interactive: true,
                    className:
                      "px-5 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)]",
                  })}
                >
                  {cta.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
