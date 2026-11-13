import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/lib/contact-schema";
import { content } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MIN_ELAPSED_MS = 1500;
// Best-effort only: a serverless deployment may run several instances and
// recycle them at any time. This is not a real rate limit.
const lastSentAt = new Map<string, number>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    const key = typeof field === "string" ? field : "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { form: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json(
      { ok: false, errors: { form: "Expected a JSON object." } },
      { status: 400 },
    );
  }

  const record = raw as Record<string, unknown>;
  const now = Date.now();

  // Bots that fill the hidden field or submit faster than a human can type
  // get a normal-looking 200 and nothing is sent.
  if (typeof record.website === "string" && record.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }
  if (typeof record.startedAt === "number" && now - record.startedAt < MIN_ELAPSED_MS) {
    return NextResponse.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: fieldErrors(parsed.error.issues) },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("contact: RESEND_API_KEY is not set; message not sent");
    return NextResponse.json(
      { ok: false, errors: { form: "Email is not configured." } },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  const previous = lastSentAt.get(ip);
  if (previous !== undefined && now - previous < WINDOW_MS) {
    return NextResponse.json(
      { ok: false, errors: { form: "Too many messages. Please wait a minute." } },
      { status: 429 },
    );
  }

  const data = parsed.data;
  const resend = new Resend(apiKey);
  // SPEC §7: onboarding@resend.dev only reaches the account owner in dev.
  // Set RESEND_FROM to an address on a verified domain in production.
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from,
    to: content.email,
    replyTo: data.email,
    subject: `Portfolio contact from ${data.name}`,
    text: `${data.message}\n\n— ${data.name} <${data.email}>`,
  });

  if (error) {
    console.error("contact: Resend rejected the message", error);
    return NextResponse.json(
      { ok: false, errors: { form: "The message could not be sent." } },
      { status: 502 },
    );
  }

  lastSentAt.set(ip, Date.now());
  if (lastSentAt.size > 500) {
    for (const [candidate, sentAt] of lastSentAt) {
      if (now - sentAt >= WINDOW_MS) lastSentAt.delete(candidate);
    }
  }

  return NextResponse.json({ ok: true });
}
