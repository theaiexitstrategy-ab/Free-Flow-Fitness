import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Class Pass — Free Flow Fitness" };

export default function ClassPassPage() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Classes</span>
          <h1 className="page-title">Class Pass</h1>
        </div>

        {/* Booking + cancellation policy — pulled to the top and made prominent */}
        <div className="callout callout-important" role="note">
          <h2>How Booking &amp; Cancellations Work</h2>
          <ul>
            <li>
              <strong>Register at least 2 hours before</strong> a class starts —
              spots aren&apos;t held without registration.
            </li>
            <li>
              <strong>Cancel within 2 hours</strong> of class start and the
              class credit is <strong>forfeited.</strong>
            </li>
          </ul>
        </div>

        <p className="muted" style={{ maxWidth: 640, margin: "0 auto 28px", textAlign: "center" }}>
          Grab a class pass and book any class on the schedule. {/* TODO: pass tiers + pricing */}
        </p>

        <div style={{ textAlign: "center" }}>
          {/* TODO: point at the real GloFox class-pass URL (NEXT_PUBLIC_GLOFOX_CLASSPASS_URL) */}
          <a className="btn btn-magenta" href={SITE.classPassUrl}>
            Buy a Class Pass
          </a>
        </div>
      </div>
    </main>
  );
}
