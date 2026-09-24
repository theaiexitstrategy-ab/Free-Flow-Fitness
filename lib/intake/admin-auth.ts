// Password gate for /intake/responses. The session cookie holds an HMAC
// derived from INTAKE_ADMIN_PASSWORD, so rotating the password logs everyone
// out and the password itself is never stored client-side.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ffs_intake_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function token(password: string) {
  return createHmac("sha256", password).update("ffs-intake-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function adminConfigured() {
  return Boolean(process.env.INTAKE_ADMIN_PASSWORD);
}

/** Returns the cookie value to set if the password is correct, else null. */
export function checkPassword(candidate: string): string | null {
  const pw = process.env.INTAKE_ADMIN_PASSWORD;
  if (!pw || !candidate) return null;
  return safeEqual(token(candidate), token(pw)) ? token(pw) : null;
}

export function isAdmin(): boolean {
  const pw = process.env.INTAKE_ADMIN_PASSWORD;
  const v = cookies().get(ADMIN_COOKIE)?.value;
  return Boolean(pw && v && safeEqual(v, token(pw)));
}
