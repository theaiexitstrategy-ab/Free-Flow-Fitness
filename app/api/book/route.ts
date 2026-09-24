import { NextRequest, NextResponse } from "next/server";
import { ADD_ONS, estimateTotal, getPackage, type AddOnId, type PackageId } from "@/lib/packages";
import { submitToPortal, type BookingSubmission } from "@/lib/portal";
import { openSlotsForDate, to12h } from "@/lib/party-availability";
import { fetchBusyBlocks } from "@/lib/party-bookings";

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

  // /book sends slot: true — the date/time must be a currently open slot and
  // the estimate is recomputed here from the catalog.
  let slotNotes: string | undefined;
  if (body.slot === true) {
    const b = pkg.booking;
    if (!b || pkg.draft) return bad("This package can't be booked online.");
    const date = String(body.preferred_date || "");
    const time = String(body.preferred_time || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return bad("Please pick a date and time.");
    const guests = Number(body.guest_count);
    if (!Number.isInteger(guests) || guests < 1 || guests > b.maxGuests) {
      return bad(`Group size must be between 1 and ${b.maxGuests}.`);
    }
    const addOns = (Array.isArray(body.add_ons) ? body.add_ons : []).filter((a): a is AddOnId =>
      b.addOns.includes(a as AddOnId)
    );
    try {
      const open = openSlotsForDate(date, b.durationMin, await fetchBusyBlocks(date, date));
      if (!open.includes(time)) {
        return NextResponse.json(
          { ok: false, error: "Sorry — that time was just taken. Please pick another.", slotTaken: true },
          { status: 409 }
        );
      }
    } catch (e) {
      console.error("[book] slot re-check failed:", e);
      return bad("We couldn't confirm that time. Please try again.", 502);
    }
    const total = estimateTotal(pkg, guests, addOns);
    const addOnLine = addOns.length
      ? addOns.map((a) => `${ADD_ONS[a].label} (+$${ADD_ONS[a].price})`).join(", ")
      : "none";
    slotNotes = [
      `Booked via /book for ${date} at ${to12h(time)} (${b.durationMin} min).`,
      `Guests: ${guests}. Add-ons: ${addOnLine}.`,
      body.theme_idea ? `Theme idea: ${String(body.theme_idea).trim().slice(0, 300)}` : "",
      Array.isArray(body.snack_choices) && body.snack_choices.length
        ? `Snacks: ${body.snack_choices.map(String).join(", ").slice(0, 300)}`
        : "",
      body.guest_of_honor ? `Guest of honor: ${String(body.guest_of_honor).trim().slice(0, 120)}` : "",
      `Estimated total: $${total}.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

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
    notes:
      [slotNotes, String(body.notes || "").trim().slice(0, 2000)].filter(Boolean).join("\n\n") || undefined,
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
