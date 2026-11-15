"use client";

import { useEffect, useRef, useState } from "react";
import { contactSchema } from "@/lib/contact-schema";
import { content } from "@/lib/content";
import { glass } from "@/lib/glass";

type Field = "name" | "email" | "message";
type Status = "idle" | "sending" | "success" | "error";

const INPUT = glass({
  variant: "field",
  tone: "regular",
  className:
    "mt-2 w-full px-3 py-2.5 text-[length:var(--fs-base)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)]",
});

export function ContactForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = contactSchema.safeParse({
      name: values.name,
      email: values.email,
      message: values.message,
      website: values.website,
      startedAt: startedAt.current || Date.now(),
    });

    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "name" && !next.name) {
          next.name = "Enter your name (1–80 characters).";
        }
        if (field === "email" && !next.email) {
          next.email = "Enter a valid email address.";
        }
        if (field === "message" && !next.message) {
          next.message = "Enter a message of 10–2000 characters.";
        }
      }
      setErrors(next);
      setStatus("idle");
      return;
    }

    setErrors({});
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const statusMessage =
    status === "success"
      ? "Message sent. Thanks for reaching out."
      : status === "error"
        ? `Something went wrong. Please try again or email ${content.email}.`
        : "";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="contact-name"
          className="block text-[length:var(--fs-sm)] text-[var(--text)]"
        >
          {content.contact.form.name}
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          className={INPUT}
        />
        {errors.name ? (
          <p
            id="contact-name-error"
            className="mt-1 text-[length:var(--fs-sm)] font-medium text-[var(--text)]"
          >
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="block text-[length:var(--fs-sm)] text-[var(--text)]"
        >
          {content.contact.form.email}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={200}
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={INPUT}
        />
        {errors.email ? (
          <p
            id="contact-email-error"
            className="mt-1 text-[length:var(--fs-sm)] font-medium text-[var(--text)]"
          >
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-[length:var(--fs-sm)] text-[var(--text)]"
        >
          {content.contact.form.message}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={2000}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={INPUT}
        />
        {errors.message ? (
          <p
            id="contact-message-error"
            className="mt-1 text-[length:var(--fs-sm)] font-medium text-[var(--text)]"
          >
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className={glass({
          variant: "control",
          tone: "solid",
          interactive: true,
          className:
            "px-5 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)] disabled:opacity-60",
        })}
      >
        {status === "sending" ? "Sending…" : content.contact.form.submit}
      </button>

      <p role="status" aria-live="polite" className="min-h-6 text-[length:var(--fs-sm)] text-[var(--text)]">
        {statusMessage}
      </p>
    </form>
  );
}
