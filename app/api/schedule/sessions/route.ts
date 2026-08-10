import { NextRequest, NextResponse } from "next/server";
import { CLASS_SERVICES, expandSessions } from "@/lib/schedule";

export const runtime = "nodejs";

// GET upcoming class sessions with remaining capacity.
// Demo mode (no portal Supabase env): expands the placeholder weekly schedule,
// 0 booked. Live mode: query the portal's booking_services (max_per_slot) +
// availability_templates + public.bookings counts for freeflow-fitness-stl.
export async function GET(req: NextRequest) {
  const days = Math.min(
    60,
    Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 30)
  );

  const sessions = expandSessions(new Date(), { days, minNoticeHours: 2 });

  // TODO(live): with PORTAL_SUPABASE_URL + PORTAL_SUPABASE_SERVICE_ROLE_KEY set,
  // pull booked counts per (service, date, time) from public.bookings and the
  // real weekly schedule from availability_templates; remaining = max_per_slot - booked.
  const withCounts = sessions.map((s) => ({ ...s, booked: 0, remaining: s.capacity }));

  return NextResponse.json({
    timezone: "America/Chicago",
    demo: !process.env.PORTAL_SUPABASE_URL,
    services: CLASS_SERVICES.map(({ key, name, level, capacity }) => ({
      key,
      name,
      level,
      capacity,
    })),
    sessions: withCounts,
  });
}
