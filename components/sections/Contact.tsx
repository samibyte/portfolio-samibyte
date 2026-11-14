import { content } from "@/lib/content";
import { ContactForm } from "@/components/form/ContactForm";

export function Contact() {
  return (
    <section
      id="contact"
      data-zone="abyss"
      aria-labelledby="contact-title"
      className="relative isolate overflow-hidden px-6 py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 159, 67, 0.18) 0%, rgba(255, 159, 67, 0.05) 45%, transparent 72%)",
          }}
        />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2">
        <div>
          <h2
            id="contact-title"
            className="font-[family-name:var(--font-display)] text-[length:var(--fs-3xl)] leading-tight text-[var(--text)]"
          >
            {content.contact.heading}
          </h2>
          <p className="mt-5 max-w-prose text-[length:var(--fs-base)] leading-relaxed text-[var(--text)]">
            {content.contact.body}
          </p>
          <p className="mt-4 text-[length:var(--fs-sm)] text-[var(--text)]/80">
            {content.contact.status}
          </p>
          <a
            href={`mailto:${content.email}`}
            className="mt-6 inline-block text-[length:var(--fs-base)] text-[var(--text)] underline underline-offset-4"
          >
            {content.email}
          </a>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
