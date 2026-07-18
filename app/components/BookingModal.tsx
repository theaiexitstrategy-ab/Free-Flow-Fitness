"use client";

import { useState } from "react";
import {
  PARTY_PACKAGES,
  getPackage,
  formatCents,
  type PackageId,
} from "@/lib/packages";

export default function BookingModal({
  initialPackage,
  onClose,
}: {
  initialPackage: PackageId;
  onClose: () => void;
}) {
  const [packageId, setPackageId] = useState<PackageId>(initialPackage);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

  const pkg = getPackage(packageId)!;
  const isDeposit = pkg.depositCents !== null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);

    if (!fd.get("sms_consent")) {
      setMsg({ type: "error", text: "Please agree to receive booking texts so we can confirm." });
      return;
    }

    setSubmitting(true);
    const body = {
      service_type: "party" as const,
      package: packageId,
      package_name: pkg.name,
      deposit_cents: pkg.depositCents,
      first_name: String(fd.get("first_name") || ""),
      last_name: String(fd.get("last_name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      preferred_date: String(fd.get("preferred_date") || ""),
      preferred_time: String(fd.get("preferred_time") || ""),
      guest_count: String(fd.get("guest_count") || ""),
      occasion: String(fd.get("occasion") || ""),
      dance_style: String(fd.get("dance_style") || ""),
      notes: String(fd.get("notes") || ""),
      sms_consent: true,
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Submission failed");
      }
      if (data.checkoutUrl) {
        // Deposit package → hand off to Stripe Checkout.
        window.location.href = data.checkoutUrl;
        return;
      }
      // Inquiry / hold (e.g. Body Painting) → confirm on-page.
      setMsg({
        type: "success",
        text: "Request received! We'll text you to confirm your date and details. Get ready to flow. 💃",
      });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      setMsg({
        type: "error",
        text: "We couldn't submit that. Please try again or call us at 314-625-2323.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h3>Book Your Party</h3>
        <p className="modal-sub">
          Tell us what you&apos;re dreaming up and we&apos;ll handle the rest.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="package">
              Package <span className="req">*</span>
            </label>
            <select
              id="package"
              name="package_select"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value as PackageId)}
            >
              {PARTY_PACKAGES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price}
                </option>
              ))}
            </select>
          </div>

          <div className="deposit-callout">
            {isDeposit ? (
              <>
                A <strong>{formatCents(pkg.depositCents!)}</strong> deposit holds
                your date. You&apos;ll be sent to secure checkout after this step;
                the balance is due at your party.
              </>
            ) : (
              <>
                This one&apos;s <strong>reserve-by-request</strong> — no payment
                now. We&apos;ll reach out to lock in your date and details.
              </>
            )}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="first_name">
                First name <span className="req">*</span>
              </label>
              <input id="first_name" name="first_name" required />
            </div>
            <div className="field">
              <label htmlFor="last_name">
                Last name <span className="req">*</span>
              </label>
              <input id="last_name" name="last_name" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="email">
                Email <span className="req">*</span>
              </label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="phone">
                Mobile phone <span className="req">*</span>
              </label>
              <input id="phone" name="phone" type="tel" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="preferred_date">Preferred date</label>
              <input id="preferred_date" name="preferred_date" type="date" />
            </div>
            <div className="field">
              <label htmlFor="guest_count">Headcount</label>
              <input
                id="guest_count"
                name="guest_count"
                type="number"
                min={1}
                placeholder="e.g. 9"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="preferred_time">Preferred time</label>
              <select id="preferred_time" name="preferred_time" defaultValue="">
                <option value="">No preference</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="occasion">Occasion</label>
              <input
                id="occasion"
                name="occasion"
                placeholder="Birthday, bachelorette…"
              />
            </div>
          </div>

          {pkg.danceStyles.length > 0 && (
            <div className="field">
              <label htmlFor="dance_style">Choice of dance</label>
              <select id="dance_style" name="dance_style" defaultValue="">
                <option value="">Let us recommend</option>
                {pkg.danceStyles.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="notes">Anything else?</label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Themes, add-ons (decorations, BYOB, raunchy bingo), questions…"
            />
          </div>

          <label className="consent">
            <input type="checkbox" name="sms_consent" value="yes" />
            <span>
              Text me booking updates at the number above. Msg &amp; data rates
              may apply. Reply STOP to opt out.
            </span>
          </label>

          <button type="submit" className="btn btn-magenta" disabled={submitting}>
            {submitting
              ? "Submitting…"
              : isDeposit
                ? `Continue to ${formatCents(pkg.depositCents!)} Deposit`
                : "Send My Request"}
          </button>

          {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
        </form>
      </div>
    </div>
  );
}
