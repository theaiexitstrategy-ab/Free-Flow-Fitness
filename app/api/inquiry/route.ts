import { NextRequest, NextResponse } from "next/server";
import { submitToPortal, type BookingSubmission } from "@/lib/portal";

export const runtime = "nodejs";

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

// Private-lesson inquiry: hold/inquiry only. NO charge is ever created here
// (pricing is not finalized). deposit_cents is hard-coded null.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body.");
  }

  const first_name = String(body.first_name || "").trim();
  const last_name = String(body.last_name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();

  if (!first_name || !last_name) return bad("Please include your name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Please include a valid email.");
  if (phone.replace(/\D/g, "").length < 10) return bad("Please include a valid phone number.");
  if (body.sms_consent !== true) return bad("SMS consent is required so we can reach you.");

  const submission: BookingSubmission = {
    service_type: "private_lesson",
    deposit_cents: null, // never charge on the inquiry flow
    first_name,
    last_name,
    email,
    phone,
    preferred_times: String(body.preferred_times || "").trim() || undefined,
    goals: String(body.goals || "").trim() || undefined,
    experience_level: String(body.experience_level || "").trim() || undefined,
    notes: String(body.notes || "").trim() || undefined,
    sms_consent: true,
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const result = await submitToPortal(submission, {
    pageUrl: req.headers.get("referer") || siteUrl,
    siteUrl,
  });

  if (!result.ok) return bad(result.error || "Submission failed.", 502);

  return NextResponse.json({ ok: true, demo: result.demo ?? false });
}
