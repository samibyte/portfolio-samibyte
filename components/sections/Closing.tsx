import FluidGlass from "@/components/ui/FluidGlass";

/**
 * Closing band: the last descent. A single liquid-glass torus resting over the
 * "samibyte" wordmark, in the abyss zone, after Contact.
 *
 * The geometry and the optical numbers follow the reference FluidGlass defaults
 * (torus, refraction 1, dispersion 0.35, reflection 1, a slow 0.3 rad/s tumble,
 * shadow 0.5, elevation 0.4): the tumble is what reveals the ring's volume, and
 * a lens at spin 0 reads as a flat magnifier. Only size, follow smoothness,
 * wobble, the warm tint and the DPR cap are themed for this page.
 *
 * The wordmark is drawn by the glass's own canvas so the ring can bend it; the
 * clipped <p className="fluid-glass__label"> keeps it readable to screen
 * readers and to search engines (the canvas itself is aria-hidden).
 *
 * The band is full-bleed and 56vh tall (min 22rem) so the torus has room to
 * follow the pointer without reaching the canvas boundary, where the mark would
 * be clipped.
 */
export function Closing() {
  return (
    <section
      id="closing"
      data-zone="abyss"
      aria-label="samibyte"
      className="relative isolate overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 55%, rgba(255, 159, 67, 0.10) 0%, rgba(255, 159, 67, 0.03) 45%, transparent 72%)",
        }}
      />

      <div className="h-[calc(var(--vh)*56)] min-h-[22rem] w-full">
        <FluidGlass
          className="fluid-glass--mark"
          text="samibyte"
          fontWeight={400}
          shape="torus"
          size={260}
          position={[0.5, 0.5]}
          interaction="follow"
          smoothness={0.72}
          wobble={0.18}
          spin={0}
          idle={false}
          refraction={1}
          dispersion={0.35}
          reflection={1}
          tint={0.1}
          color="#ff9f43"
          shadow={0.5}
          elevation={0.4}
          morphOnClick={false}
          maxDevicePixelRatio={1.5}
        />
      </div>
    </section>
  );
}
