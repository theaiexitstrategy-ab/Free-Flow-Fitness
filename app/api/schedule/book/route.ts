import { NextRequest, NextResponse } from "next/server";
import { CLASS_SERVICES } from "@/lib/schedule";

export const runtime = "nodejs";

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

// Reserve a class spot. Phase 1: no payment/credits (that's Phase 3) — just a
// capacity-checked reservation with contact info + SMS confirm.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body.");
  }

  const svc = CLASS_SERVICES.find((s) => s.key === body.serviceKey);
  if (!svc) return bad("Unknown class.");
  const dateISO = String(body.dateISO || "");
  const startTime = String(body.startTime || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO) || !/^\d{2}:\d{2}$/.test(startTime)) {
    return bad("Invalid session.");
  }

  const first_name = String(body.first_name || "").trim();
  const last_name = String(body.last_name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();

  if (!first_name || !last_name) return bad("Please include your name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Please include a valid email.");
  if (phone.replace(/\D/g, "").length < 10) return bad("Please include a valid phone number.");
  if (body.sms_consent !== true) return bad("Please agree to receive class texts so we can confirm.");

  const payload = {
    tenant_slug: "freeflow_fitness_stl",
    service_key: svc.key,
    service_name: svc.name,
    date: dateISO,
    time: startTime,
    first_name,
    last_name,
    email,
    phone,
    sms_consent: true,
    source: "freeflow_schedule",
    submitted_at: new Date().toISOString(),
  };

  // TODO(live): against the portal Supabase (service-role), resolve
  // clients.id by slug 'freeflow-fitness-stl', re-check capacity
  // (count of public.bookings for this slot < booking_services.max_per_slot),
  // insert the booking (status 'Confirmed', starts_at Central->UTC), upsert the
  // lead, mark the time_slot, mirror to the portal lead webhook, and send the
  // confirmation SMS — mirroring the flex-booking-calendar /api/bookings flow.
  if (!process.env.PORTAL_SUPABASE_URL) {
    console.info("[freeflow schedule] class reservation (demo):", JSON.stringify(payload));
    return NextResponse.json({
      ok: true,
      demo: true,
      message: "You're on the list! (demo mode — connect the portal to make it live)",
    });
  }

  // Live path not yet wired — fail closed rather than pretend-confirm.
  return bad("Live booking isn't wired yet — connect the portal booking backend.", 503);
}
