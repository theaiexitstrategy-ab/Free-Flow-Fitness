// Server-only: existing party bookings that occupy the studio, read from the
// portal's freeflow_bookings table (same GoElev8.AI Supabase project as the
// intake table). Read-only — writes still go through the portal API.
import "server-only";
import { getPackage, type PackageId } from "./packages";
import { toMin, type BusyBlock } from "./party-availability";

/** How long an unpaid checkout holds its slot before it's released. */
const CHECKOUT_HOLD_MIN = 30;
const DEFAULT_DURATION_MIN = 120;

interface Row {
  package_id: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  payment_status: string;
  booking_status: string;
  created_at: string;
}

/**
 * A party holds its slot when the deposit is paid or the studio confirmed it,
 * or while a deposit checkout / no-deposit request is under CHECKOUT_HOLD_MIN
 * old. Cancelled and refunded bookings never hold.
 */
function holdsSlot(r: Row, now: number): boolean {
  if (/cancel/i.test(r.booking_status) || r.payment_status === "refunded") return false;
  if (r.payment_status === "deposit_paid" || r.booking_status === "confirmed") return true;
  return now - new Date(r.created_at).getTime() < CHECKOUT_HOLD_MIN * 60000;
}

export async function fetchBusyBlocks(from: string, to: string): Promise<BusyBlock[]> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return []; // local/demo: nothing booked yet

  const qs = new URLSearchParams({
    select: "package_id,preferred_date,preferred_time,payment_status,booking_status,created_at",
    service_type: "eq.party",
    and: `(preferred_date.gte.${from},preferred_date.lte.${to})`,
  });
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${base}/rest/v1/freeflow_bookings?${qs}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const now = Date.now();
  const out: BusyBlock[] = [];
  for (const r of (await res.json()) as Row[]) {
    if (!r.preferred_date || !/^\d{2}:\d{2}$/.test(r.preferred_time ?? "") || !holdsSlot(r, now)) continue;
    const start = toMin(r.preferred_time!);
    const dur = getPackage(r.package_id as PackageId)?.booking?.durationMin ?? DEFAULT_DURATION_MIN;
    out.push({ dateISO: r.preferred_date, start, end: start + dur });
  }
  return out;
}
