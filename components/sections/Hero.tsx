import { content } from "@/lib/content";
import { glass } from "@/lib/glass";
import { BuoyChip } from "@/components/ui/BuoyChip";
import { Masthead } from "@/components/sections/Masthead";

export function Hero() {
  return (
    <section
      id="hero"
      data-zone="surface"
      aria-labelledby="hero-title"
      className="relative h-[calc(var(--vh)*100)] overflow-hidden"
    >
      <BuoyChip />
      <p className="hero-role instrument text-[length:var(--fs-xs)] text-[var(--text)]">
        {content.role} · {content.location}
      </p>
      <Masthead />
      <div className="hero-copy">
        <div data-water-block>
          <p className="max-w-[var(--measure-body)] text-[length:var(--fs-lg)] leading-[var(--leading-body)] text-[var(--text)]">
            {content.hero.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
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
