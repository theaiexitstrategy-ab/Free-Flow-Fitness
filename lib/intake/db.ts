// Server-only Supabase access for intake submissions (PostgREST over fetch).
// Uses the service-role key, which never leaves the server. The table has RLS
// enabled with no policies, so the anon/publishable key can't read or write it.
import "server-only";
import type { Answers } from "./form";

const TABLE = "ffs_intake_submissions";
export const STATUSES = ["new", "contacted", "done"] as const;
export type SubmissionStatus = (typeof STATUSES)[number];

export interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Submission {
  id: string;
  created_at: string;
  answers: Answers;
  transcript: TranscriptMessage[] | null;
  status: SubmissionStatus;
  source: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export function dbConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function rest(path: string, init: RequestInit = {}) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  // Legacy service_role keys are JWTs and go in Authorization too; new
  // sb_secret_ keys are sent via the apikey header only.
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${base}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

export async function insertSubmission(row: {
  answers: Answers;
  transcript: TranscriptMessage[] | null;
  source: "chat" | "form";
  name: string | null;
  email: string | null;
  phone: string | null;
}): Promise<string> {
  const res = await rest(TABLE, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  const [created] = (await res.json()) as { id: string }[];
  return created.id;
}

export async function listSubmissions(limit = 1000): Promise<Submission[]> {
  const res = await rest(`${TABLE}?select=*&order=created_at.desc&limit=${limit}`);
  return (await res.json()) as Submission[];
}

export async function updateStatus(id: string, status: SubmissionStatus) {
  await rest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status }),
  });
}
