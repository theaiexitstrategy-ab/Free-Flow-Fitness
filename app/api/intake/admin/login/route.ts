import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, adminConfigured, checkPassword } from "@/lib/intake/admin-auth";
import { clientIp, rateLimit } from "@/lib/intake/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "INTAKE_ADMIN_PASSWORD is not set." }, { status: 503 });
  }
  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many attempts — try again later." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const value = checkPassword(String(body?.password ?? ""));
  if (!value) return NextResponse.json({ ok: false, error: "Wrong password." }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  return res;
}
