"use client";

import { useState } from "react";

export default function PrivateLessonModal({ onClose }: { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);

    if (!fd.get("sms_consent")) {
      setMsg({ type: "error", text: "Please agree to receive texts so an instructor can reach you." });
      return;
    }

    setSubmitting(true);
    const body = {
      service_type: "private_lesson" as const,
      // Inquiry/hold only — pricing is not finalized, so NO deposit is charged.
      deposit_cents: null,
      first_name: String(fd.get("first_name") || ""),
      last_name: String(fd.get("last_name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      preferred_times: String(fd.get("preferred_times") || ""),
      goals: String(fd.get("goals") || ""),
      experience_level: String(fd.get("experience_level") || ""),
      notes: String(fd.get("notes") || ""),
      sms_consent: true,
    };

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Submission failed");
      setMsg({
        type: "success",
        text: "Got it! An instructor will reach out to set your time and goals — no group, no pressure, all you. 🔥",
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
        <h3>Book A Private Lesson</h3>
        <p className="modal-sub">
          Tell us your goals and when you&apos;re free. We&apos;ll follow up to
          set it up — no payment now.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="pl_first">
                First name <span className="req">*</span>
              </label>
              <input id="pl_first" name="first_name" required />
            </div>
            <div className="field">
              <label htmlFor="pl_last">
                Last name <span className="req">*</span>
              </label>
              <input id="pl_last" name="last_name" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="pl_email">
                Email <span className="req">*</span>
              </label>
              <input id="pl_email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="pl_phone">
                Mobile phone <span className="req">*</span>
              </label>
              <input id="pl_phone" name="phone" type="tel" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="pl_times">Preferred days / times</label>
            <input
              id="pl_times"
              name="preferred_times"
              placeholder="e.g. weekday evenings, Saturday mornings"
            />
          </div>

          <div className="field">
            <label htmlFor="pl_exp">Experience level</label>
            <select id="pl_exp" name="experience_level" defaultValue="">
              <option value="">Select one</option>
              <option>Brand new</option>
              <option>Some experience</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="pl_goals">What do you want to work on?</label>
            <textarea
              id="pl_goals"
              name="goals"
              placeholder="Technique, a specific trick, a routine, flexibility, confidence…"
            />
          </div>

          <div className="field">
            <label htmlFor="pl_notes">Anything else?</label>
            <textarea id="pl_notes" name="notes" placeholder="Optional" />
          </div>

          <label className="consent">
            <input type="checkbox" name="sms_consent" value="yes" />
            <span>
              Text me about my lesson at the number above. Msg &amp; data rates
              may apply. Reply STOP to opt out.
            </span>
          </label>

          <button type="submit" className="btn btn-magenta" disabled={submitting}>
            {submitting ? "Submitting…" : "Send My Request"}
          </button>

          {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
        </form>
      </div>
    </div>
  );
}
