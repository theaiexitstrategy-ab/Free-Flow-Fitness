import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/intake/admin-auth";
import { STATUSES, updateStatus, type SubmissionStatus } from "@/lib/intake/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const status = body?.status as SubmissionStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Bad status" }, { status: 400 });
  }
  try {
    await updateStatus(params.id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[intake] status update failed:", e);
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 502 });
  }
}
