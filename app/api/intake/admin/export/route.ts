import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/intake/admin-auth";
import { listSubmissions } from "@/lib/intake/db";
import { ALL_QUESTIONS, columnLabel, formatAnswer } from "@/lib/intake/form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(v: string): string {
  // Neutralize spreadsheet formula injection, then CSV-quote.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

// Columns: Timestamp, then every question in the original form's order
// (same layout as the Google Sheet), then dashboard-only fields.
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const rows = await listSubmissions(10000);
  const header = ["Timestamp", ...ALL_QUESTIONS.map(columnLabel), "Status", "Source", "Submission ID"];
  const lines = [header.map(cell).join(",")];
  for (const r of [...rows].reverse()) {
    const ts = new Date(r.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" });
    lines.push(
      [ts, ...ALL_QUESTIONS.map((q) => formatAnswer(q, r.answers?.[q.id])), r.status, r.source ?? "", r.id]
        .map((v) => cell(String(v)))
        .join(",")
    );
  }
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="free-flow-party-requests-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
