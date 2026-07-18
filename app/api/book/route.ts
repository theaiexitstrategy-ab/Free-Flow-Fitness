import { NextRequest, NextResponse } from "next/server";
import { getPackage, type PackageId } from "@/lib/packages";
import { submitToPortal, type BookingSubmission } from "@/lib/portal";

export const runtime = "nodejs";

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body.");
  }

  const packageId = body.package as PackageId;
  const pkg = packageId ? getPackage(packageId) : undefined;
  if (!pkg) return bad("Unknown package.");

  const first_name = String(body.first_name || "").trim();
  const last_name = String(body.last_name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();

  if (!first_name || !last_name) return bad("Please include your name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Please include a valid email.");
  if (phone.replace(/\D/g, "").length < 10) return bad("Please include a valid phone number.");
  if (body.sms_consent !== true) return bad("SMS consent is required to confirm your booking.");

  // SECURITY: never trust a deposit amount from the client. Re-derive it from
  // the server-side catalog by package id. Body Painting => null (inquiry).
  const submission: BookingSubmission = {
    service_type: "party",
    package: pkg.id,
    package_name: pkg.name,
    deposit_cents: pkg.depositCents,
    first_name,
    last_name,
    email,
    phone,
    preferred_date: String(body.preferred_date || "").trim() || undefined,
    preferred_time: String(body.preferred_time || "").trim() || undefined,
    guest_count: String(body.guest_count || "").trim() || undefined,
    occasion: String(body.occasion || "").trim() || undefined,
    dance_style: String(body.dance_style || "").trim() || undefined,
    notes: String(body.notes || "").trim() || undefined,
    sms_consent: true,
  };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const result = await submitToPortal(submission, {
    pageUrl: req.headers.get("referer") || siteUrl,
    siteUrl,
  });

  if (!result.ok) return bad(result.error || "Booking failed.", 502);

  return NextResponse.json({
    ok: true,
    checkoutUrl: result.checkoutUrl ?? null,
    bookingId: result.bookingId ?? null,
    demo: result.demo ?? false,
  });
}
