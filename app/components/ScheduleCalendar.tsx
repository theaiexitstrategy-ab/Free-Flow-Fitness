"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ServiceLite {
  key: string;
  name: string;
  level?: string;
  capacity: number;
}
interface Session {
  id: string;
  serviceKey: string;
  name: string;
  level?: string;
  dateISO: string;
  startTime: string;
  displayDate: string;
  displayTime: string;
  capacity: number;
  booked: number;
  remaining: number;
}

export default function ScheduleCalendar() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<Session | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/schedule/sessions?days=30");
        const data = await res.json();
        if (!res.ok) throw new Error("load failed");
        setServices(data.services || []);
        setSessions(data.sessions || []);
      } catch {
        setError("Couldn't load the schedule. Please refresh or call 314-625-2323.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = sessions.filter((s) => filter === "all" || s.serviceKey === filter);
  const groups: { date: string; items: Session[] }[] = [];
  for (const s of filtered) {
    const existing = groups.find((x) => x.date === s.displayDate);
    if (existing) existing.items.push(s);
    else groups.push({ date: s.displayDate, items: [s] });
  }

  return (
    <>
      <div className="callout callout-important" role="note" style={{ marginBottom: 32 }}>
        <h2>Reserve Your Spot</h2>
        <ul>
          <li>
            <strong>Register at least 2 hours before</strong> class — spots aren&apos;t held
            without registration (max <strong>7 per pole</strong>).
          </li>
          <li>
            <strong>Cancel within 2 hours</strong> of class start and the class credit is
            forfeited.
          </li>
        </ul>
      </div>

      <div className="event-filters" role="tablist" aria-label="Class filter">
        <button
          type="button"
          className={`chip ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Classes
        </button>
        {services.map((svc) => (
          <button
            key={svc.key}
            type="button"
            className={`chip ${filter === svc.key ? "active" : ""}`}
            onClick={() => setFilter(svc.key)}
          >
            {svc.name}
          </button>
        ))}
      </div>

      {loading && <p className="muted" style={{ textAlign: "center" }}>Loading the schedule…</p>}
      {error && <p className="form-msg error" style={{ textAlign: "center" }}>{error}</p>}
      {!loading && !error && groups.length === 0 && (
        <p className="muted" style={{ textAlign: "center" }}>
          No upcoming classes in this filter — check back soon!
        </p>
      )}

      {groups.map((g) => (
        <div className="sched-day" key={g.date}>
          <h3 className="sched-day-title">{g.date}</h3>
          <div className="sched-rows">
            {g.items.map((s) => {
              const full = s.remaining <= 0;
              return (
                <div className={`sched-row${full ? " full" : ""}`} key={s.id}>
                  <div className="sched-time">{s.displayTime}</div>
                  <div className="sched-info">
                    <span className="sched-name">{s.name}</span>
                    {s.level && <span className="sched-level">{s.level}</span>}
                  </div>
                  <div className="sched-spots">
                    {full ? "Full" : `${s.remaining} spot${s.remaining === 1 ? "" : "s"} left`}
                  </div>
                  <button
                    type="button"
                    className="btn btn-magenta sched-book"
                    disabled={full}
                    onClick={() => setActive(s)}
                  >
                    Reserve
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="sched-alt">
        <p>
          Looking for something else? <Link href="/parties">Book a private party</Link> · 1-on-1
          private sessions with each instructor are coming soon.
        </p>
      </div>

      {active && <ReserveModal session={active} onClose={() => setActive(null)} />}
    </>
  );
}

function ReserveModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    if (!fd.get("sms_consent")) {
      setMsg({ type: "error", text: "Please agree to receive class texts so we can confirm." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/schedule/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceKey: session.serviceKey,
          dateISO: session.dateISO,
          startTime: session.startTime,
          first_name: String(fd.get("first_name") || ""),
          last_name: String(fd.get("last_name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          sms_consent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Reservation failed");
      setMsg({
        type: "success",
        text: "You're booked! Watch your phone for a confirmation text. See you on the pole. 💜",
      });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong — please try again.",
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
        <h3>Reserve Your Spot</h3>
        <p className="modal-sub">
          {session.name} — {session.displayDate} at {session.displayTime}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="s_first">First name <span className="req">*</span></label>
              <input id="s_first" name="first_name" required />
            </div>
            <div className="field">
              <label htmlFor="s_last">Last name <span className="req">*</span></label>
              <input id="s_last" name="last_name" required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="s_email">Email <span className="req">*</span></label>
              <input id="s_email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="s_phone">Mobile phone <span className="req">*</span></label>
              <input id="s_phone" name="phone" type="tel" required />
            </div>
          </div>
          <label className="consent">
            <input type="checkbox" name="sms_consent" value="yes" />
            <span>
              Text me class reminders + updates. Msg &amp; data rates may apply. Reply STOP to opt
              out.
            </span>
          </label>
          <button type="submit" className="btn btn-magenta" disabled={submitting}>
            {submitting ? "Reserving…" : "Confirm Reservation"}
          </button>
          {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
        </form>
      </div>
    </div>
  );
}
