import { content } from "@/lib/content";
import { SECTION_ZONE, ZONES } from "@/lib/zones";

const ABOUT_ZONE =
  ZONES.find((zone) => zone.id === SECTION_ZONE.about) ?? ZONES[0];

/**
 * Depth readout for a journey stop, interpolated across the About zone's own
 * bounds (twilight: 200–1000 m) from lib/zones.ts. Derived, never invented.
 */
function depthAt(index: number, total: number): number {
  const t = total <= 1 ? 0 : index / (total - 1);
  return Math.round(
    ABOUT_ZONE.metersFrom + (ABOUT_ZONE.metersTo - ABOUT_ZONE.metersFrom) * t,
  );
}

export function About() {
  const journey = content.journey;

  return (
    <section
      id="about"
      data-zone="twilight"
      aria-labelledby="about-title"
      className="relative px-6 py-[var(--station-pad)]"
    >
      <div data-water-block className="mx-auto w-full max-w-[96rem]">
        <h2
          id="about-title"
          className="font-[family-name:var(--font-display)] text-[length:var(--fs-display)] leading-[0.9] tracking-[var(--tracking-tight)] text-[var(--text)]"
        >
          About
        </h2>

        <p className="instrument mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--fs-xs)] text-[var(--text)]">
          <span
            aria-hidden="true"
            className="h-px w-8 shrink-0 bg-current opacity-30"
          />
          <span>{ABOUT_ZONE.label}</span>
          <span>
            {ABOUT_ZONE.metersFrom}–{ABOUT_ZONE.metersTo} M
          </span>
        </p>

        <div className="about__body">
          <div className="about__prose">
            {content.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <aside
            className="about__annotations"
            aria-labelledby="about-principles-title"
          >
            <h3
              id="about-principles-title"
              className="instrument text-[length:var(--fs-xs)] text-[var(--text)]"
            >
              Principles
            </h3>
            <ul className="about__annotation-list">
              {content.principles.map((principle, index) => (
                <li key={principle.title} className="about__annotation">
                  <h4>
                    <span
                      aria-hidden="true"
                      className="instrument text-[length:var(--fs-xs)] text-[var(--text)]"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {principle.title}
                  </h4>
                  <p>{principle.body}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="about__journey">
          <h3 className="instrument text-[length:var(--fs-xs)] text-[var(--text)]">
            Journey
          </h3>

          <ol className="sounding-line">
            {journey.map((entry, index) => (
              <li
                key={`${entry.period}-${entry.title}`}
                className="sounding-stop"
              >
                <p className="instrument text-[length:var(--fs-xs)] text-[var(--text)]">
                  <span className="sounding-stop__depth">
                    {depthAt(index, journey.length)} M
                  </span>
                  {" · "}
                  {entry.period} · {entry.kind}
                </p>
                <h4 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--fs-xl)] leading-tight text-[var(--text)]">
                  {entry.title}
                </h4>
                <p className="mt-1 text-[length:var(--fs-sm)] text-[var(--text)]">
                  {entry.detail}
                </p>
                {"description" in entry && entry.description ? (
                  <p className="mt-2 max-w-[var(--measure-body)] text-[length:var(--fs-sm)] leading-[var(--leading-body)] text-[var(--text)]">
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
