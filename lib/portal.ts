// Server-only helper for talking to the GoElev8 portal backend.
// The portal owns the freeflow_bookings table, Stripe checkout, Twilio SMS,
// and Flow B metering. This app never touches those directly — it forwards
// validated submissions with the shared secret, which stays server-side.
import "server-only";
import type { PackageId } from "./packages";

export type ServiceType = "party" | "private_lesson";

export interface BookingSubmission {
  service_type: ServiceType;
  // party fields
  package?: PackageId;
  package_name?: string;
  preferred_date?: string;
  preferred_time?: string;
  guest_count?: string;
  occasion?: string;
  dance_style?: string;
  // private-lesson fields
  preferred_times?: string;
  goals?: string;
  experience_level?: string;
  // shared contact
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes?: string;
  sms_consent: boolean;
  // deposit intent: cents to charge, or null for inquiry/hold
  deposit_cents: number | null;
}

export interface PortalResponse {
  ok: boolean;
  /** Present only when the portal created a Stripe Checkout Session. */
  checkoutUrl?: string;
  /** Portal-side record id, if returned. */
  bookingId?: string;
  error?: string;
  /** True when the app is running without a configured portal (local dev). */
  demo?: boolean;
}

const TENANT_SLUG = process.env.FREEFLOW_TENANT_SLUG || "freeflow_fitness_stl";

/**
 * Forward a booking/inquiry to the portal.
 * Falls back to "demo mode" (no external call) when the portal isn't
 * configured, so the funnel can be run and tested locally with no secrets.
 */
export async function submitToPortal(
  submission: BookingSubmission,
  meta: { pageUrl: string; siteUrl: string }
): Promise<PortalResponse> {
  const base = process.env.PORTAL_API_URL?.replace(/\/$/, "");
  const secret = process.env.GOELEV8_WEBHOOK_SECRET;

  const payload = {
    tenant_slug: TENANT_SLUG,
    portal_pipeline: "bookings",
    portal_stage: "new_request",
    lead_source: "freeflow_funnel",
    submitted_at: new Date().toISOString(),
    page_url: meta.pageUrl,
    site_url: meta.siteUrl,
    ...submission,
  };

  // Local/demo fallback: no portal wired up yet.
  if (!base || !secret) {
    console.info(
      "[freeflow] PORTAL not configured — demo mode. Payload:",
      JSON.stringify(payload)
    );
    return { ok: true, demo: true };
  }

  try {
    const res = await fetch(`${base}/api/freeflow/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goelev8-secret": secret,
      },
      body: JSON.stringify(payload),
      // The portal sends the confirmation SMS inline (<60s) before responding,
      // so give it a little room but don't hang the user forever.
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[freeflow] portal returned ${res.status}: ${text}`);
      return { ok: false, error: `Portal error ${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as Partial<PortalResponse>;
    return {
      ok: true,
      checkoutUrl: data.checkoutUrl,
      bookingId: data.bookingId,
    };
  } catch (err) {
    console.error("[freeflow] portal request failed:", err);
    return { ok: false, error: "Could not reach the booking service." };
  }
}
