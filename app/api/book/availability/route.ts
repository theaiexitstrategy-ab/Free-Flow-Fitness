import { NextRequest, NextResponse } from "next/server";
import { getPackage, type PackageId } from "@/lib/packages";
import { bookableRange, openSlotsInRange } from "@/lib/party-availability";
import { fetchBusyBlocks } from "@/lib/party-bookings";
import { clientIp, rateLimit } from "@/lib/intake/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/book/availability?package=fab-flow&month=2026-10
// → { first, last, slots: { "2026-10-03": ["17:00", ...] } }
export async function GET(req: NextRequest) {
  if (!rateLimit(`avail:${clientIp(req)}`, 120, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }
  const pkg = getPackage(req.nextUrl.searchParams.get("package") as PackageId);
  const month = req.nextUrl.searchParams.get("month") || "";
  if (!pkg?.booking || pkg.draft) return NextResponse.json({ ok: false, error: "Unknown package." }, { status: 400 });
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ ok: false, error: "Bad month." }, { status: 400 });
  }

  const { first, last } = bookableRange();
  const [y, m] = month.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const from = `${month}-01` < first ? first : `${month}-01`;
  const to = monthEnd > last ? last : monthEnd;

  let slots: Record<string, string[]> = {};
  if (from <= to) {
    try {
      slots = openSlotsInRange(from, to, pkg.booking.durationMin, await fetchBusyBlocks(from, to));
    } catch (e) {
      console.error("[book] availability lookup failed:", e);
      return NextResponse.json({ ok: false, error: "Couldn't load availability." }, { status: 502 });
    }
  }
  return NextResponse.json(
    { ok: true, first, last, slots },
    { headers: { "Cache-Control": "no-store" } }
  );
}
