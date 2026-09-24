"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ADD_ONS,
  BOOKABLE_PACKAGES,
  estimateTotal,
  formatCents,
  getPackage,
  type AddOnId,
  type PackageId,
} from "@/lib/packages";
import { to12h } from "@/lib/party-availability";
import { getQuestion } from "@/lib/intake/form";
import { SITE } from "@/lib/site";

// Option lists come from the studio's party request form (data/intake-form.json).
const OCCASIONS = getQuestion("298522647")?.options ?? [];
const SNACK_OPTIONS = getQuestion("753881960")?.options ?? [];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};
const shiftMonth = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};
const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

interface Availability {
  first: string;
  last: string;
  slots: Record<string, string[]>;
}

export default function BookFlow() {
  const params = useSearchParams();
  const initial = getPackage(params.get("package") as PackageId);
  const [pkgId, setPkgId] = useState<PackageId | null>(
    initial?.booking && !initial.draft ? initial.id : null
  );
  const pkg = pkgId ? getPackage(pkgId)! : null;
  const b = pkg?.booking;

  const [month, setMonth] = useState<string | null>(null);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [guests, setGuests] = useState(7);
  const [addOns, setAddOns] = useState<AddOnId[]>([]);
  const [themeIdea, setThemeIdea] = useState("");
  const [snacks, setSnacks] = useState<string[]>([]);
  const [dance, setDance] = useState("");
  const [occasion, setOccasion] = useState<string[]>([]);
  const [honoree, setHonoree] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const dateRef = useRef<HTMLElement>(null);
  const timeRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);

  const scrollTo = (r: React.RefObject<HTMLElement>) =>
    setTimeout(() => r.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  const load = useCallback(async (id: PackageId, ym: string | null) => {
    setLoading(true);
    setAvailError(null);
    try {
      // First load: ask for the current month to learn the bookable range.
      const q = ym ?? new Date().toISOString().slice(0, 7);
      const res = await fetch(`/api/book/availability?package=${id}&month=${q}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      if (!ym && data.first.slice(0, 7) !== q) {
        // Bookable window starts next month — jump there.
        setMonth(data.first.slice(0, 7));
        return;
      }
      setMonth(q);
      setAvail(data);
    } catch {
      setAvailError("Couldn't load open times. Please refresh, or call us.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pkgId) load(pkgId, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgId, month]);

  // Keep choices valid when the package changes.
  useEffect(() => {
    if (!b) return;
    setGuests((g) => Math.min(Math.max(g, 1), b.maxGuests));
    setAddOns((a) => a.filter((x) => b.addOns.includes(x)));
    if (pkg && dance && !pkg.danceStyles.includes(dance)) setDance("");
  }, [pkgId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drop a date/time that's no longer open (package switch or slot taken).
  useEffect(() => {
    if (!avail || !date) return;
    const open = avail.slots[date];
    if (!open) {
      setDate(null);
      setTime(null);
    } else if (time && !open.includes(time)) setTime(null);
  }, [avail]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = pkg ? estimateTotal(pkg, guests, addOns) : 0;
  const deposit = pkg?.depositCents ?? null;

  const cells = useMemo(() => {
    if (!month) return [];
    const [y, m] = month.split("-").map(Number);
    const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [
      ...Array<null>(firstDow).fill(null),
      ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
    ];
  }, [month]);

  function choosePackage(id: PackageId) {
    setPkgId(id);
    setMsg(null);
    const url = new URL(window.location.href);
    url.searchParams.set("package", id);
    window.history.replaceState(null, "", url);
    scrollTo(dateRef);
  }

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pkg || !date || !time) return;
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    if (!fd.get("sms_consent")) {
      setMsg({ type: "error", text: "Please agree to receive booking texts so we can confirm." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot: true,
          service_type: "party",
          package: pkg.id,
          preferred_date: date,
          preferred_time: time,
          guest_count: guests,
          add_ons: addOns,
          theme_idea: addOns.includes("theme") ? themeIdea : "",
          snack_choices: addOns.includes("snacks") ? snacks : [],
          dance_style: dance,
          occasion: occasion.join(", "),
          guest_of_honor: honoree,
          first_name: String(fd.get("first_name") || ""),
          last_name: String(fd.get("last_name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          notes: String(fd.get("notes") || ""),
          sms_consent: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.slotTaken) {
        setMsg({ type: "error", text: data.error });
        if (pkgId) load(pkgId, month);
        scrollTo(timeRef);
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error || "Submission failed");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setMsg({
        type: "success",
        text: `Request received for ${longDate(date)} at ${to12h(time)}! We'll text you to confirm your date and details. Get ready to flow. 💃`,
      });
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err instanceof Error && err.message && err.message !== "Submission failed"
            ? err.message
            : `We couldn't submit that. Please try again or call us at ${SITE.phone}.`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (msg?.type === "success") {
    return (
      <div className="book-step book-done" role="status">
        <h2>Request received!</h2>
        <p>{msg.text}</p>
      </div>
    );
  }

  return (
    <div className="book-flow">
      {/* 1 — package */}
      <section className="book-step" aria-labelledby="step-pkg">
        <h2 id="step-pkg">
          <span className="book-num">1</span> Choose your party
        </h2>
        <div className="book-pkgs" role="radiogroup" aria-labelledby="step-pkg">
          {BOOKABLE_PACKAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={pkgId === p.id}
              className={`book-pkg${pkgId === p.id ? " is-selected" : ""}`}
              onClick={() => choosePackage(p.id)}
            >
              {p.tag && <span className="tag">{p.tag}</span>}
              <span className="book-pkg-name">{p.name}</span>
              <span className="book-pkg-price">${p.price}</span>
              <span className="book-pkg-meta">
                {p.booking!.durationMin >= 90 && p.booking!.durationMin % 60
                  ? `${p.booking!.durationMin} min`
                  : `${p.booking!.durationMin / 60} hr`}{" "}
                · up to {p.booking!.includedGuests} people
              </span>
              <span className="book-pkg-meta">
                +${p.booking!.extraGuestPrice}/person after that (max {p.booking!.maxGuests})
              </span>
              <span className="book-pkg-dep">
                {p.depositCents !== null ? `${formatCents(p.depositCents)} deposit` : "Reserve by request"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 2 — date */}
      {pkg && (
        <section className="book-step" ref={dateRef} aria-labelledby="step-date">
          <h2 id="step-date">
            <span className="book-num">2</span> Pick a date
          </h2>
          {availError && <p className="form-msg error">{availError}</p>}
          {month && (
            <div className="book-cal" aria-busy={loading}>
              <div className="book-cal-head">
                <button
                  type="button"
                  className="book-cal-nav"
                  aria-label="Previous month"
                  disabled={!avail || month <= avail.first.slice(0, 7) || loading}
                  onClick={() => setMonth(shiftMonth(month, -1))}
                >
                  ‹
                </button>
                <span aria-live="polite">{monthLabel(month)}</span>
                <button
                  type="button"
                  className="book-cal-nav"
                  aria-label="Next month"
                  disabled={!avail || month >= avail.last.slice(0, 7) || loading}
                  onClick={() => setMonth(shiftMonth(month, 1))}
                >
                  ›
                </button>
              </div>
              <div className="book-cal-grid" role="grid">
                {WEEKDAYS.map((d) => (
                  <span key={d} className="book-cal-dow" aria-hidden="true">
                    {d}
                  </span>
                ))}
                {cells.map((iso, i) =>
                  iso ? (
                    <button
                      key={iso}
                      type="button"
                      className={`book-day${date === iso ? " is-selected" : ""}`}
                      disabled={loading || !avail?.slots[iso]}
                      aria-label={`${longDate(iso)}${avail?.slots[iso] ? "" : " — unavailable"}`}
                      aria-pressed={date === iso}
                      onClick={() => {
                        setDate(iso);
                        setTime(null);
                        scrollTo(timeRef);
                      }}
                    >
                      {Number(iso.slice(8))}
                    </button>
                  ) : (
                    <span key={`b${i}`} />
                  )
                )}
              </div>
              {!loading && avail && Object.keys(avail.slots).length === 0 && (
                <p className="book-hint">No open times this month — try the next one.</p>
              )}
            </div>
          )}
          {loading && !month && <p className="book-hint">Loading open times…</p>}
        </section>
      )}

      {/* 3 — time */}
      {pkg && date && avail?.slots[date] && (
        <section className="book-step" ref={timeRef} aria-labelledby="step-time">
          <h2 id="step-time">
            <span className="book-num">3</span> Pick a start time
          </h2>
          <p className="book-hint">{longDate(date)}</p>
          <div className="book-times">
            {avail.slots[date].map((t) => (
              <button
                key={t}
                type="button"
                className={`book-time${time === t ? " is-selected" : ""}`}
                aria-pressed={time === t}
                onClick={() => {
                  setTime(t);
                  setMsg(null);
                  scrollTo(detailsRef);
                }}
              >
                {to12h(t)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4 + 5 — details, contact, pay */}
      {pkg && b && date && time && (
        <form className="book-step" ref={detailsRef as React.RefObject<HTMLFormElement>} onSubmit={submit}>
          <h2>
            <span className="book-num">4</span> Party details
          </h2>

          <div className="field">
            <label htmlFor="guests">How many total in your party? (including you)</label>
            <div className="book-stepper">
              <button type="button" aria-label="Fewer people" disabled={guests <= 1} onClick={() => setGuests(guests - 1)}>
                −
              </button>
              <input
                id="guests"
                type="number"
                inputMode="numeric"
                min={1}
                max={b.maxGuests}
                value={guests}
                onChange={(e) => setGuests(Math.min(b.maxGuests, Math.max(1, Number(e.target.value) || 1)))}
              />
              <button
                type="button"
                aria-label="More people"
                disabled={guests >= b.maxGuests}
                onClick={() => setGuests(guests + 1)}
              >
                +
              </button>
            </div>
            <p className="book-hint">
              ${pkg.price} covers up to {b.includedGuests}; +${b.extraGuestPrice} each after that, up to {b.maxGuests}{" "}
              total.
            </p>
          </div>

          {b.addOns.length > 0 && (
            <fieldset className="field book-addons">
              <legend>Add-ons</legend>
              {b.addOns.map((a) => (
                <div key={a}>
                  <label className="intake-option">
                    <input
                      type="checkbox"
                      checked={addOns.includes(a)}
                      onChange={() => setAddOns(toggle(addOns, a))}
                    />
                    <span>
                      {ADD_ONS[a].label} <strong>+${ADD_ONS[a].price}</strong>
                    </span>
                  </label>
                  {a === "theme" && addOns.includes("theme") && (
                    <input
                      className="book-sub-input"
                      aria-label="Theme idea"
                      placeholder="Theme idea (e.g. glow party, beach party)"
                      value={themeIdea}
                      maxLength={300}
                      onChange={(e) => setThemeIdea(e.target.value)}
                    />
                  )}
                  {a === "snacks" && addOns.includes("snacks") && SNACK_OPTIONS.length > 0 && (
                    <div className="book-chips" role="group" aria-label="Snack choices">
                      {SNACK_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`book-chip${snacks.includes(s) ? " is-selected" : ""}`}
                          aria-pressed={snacks.includes(s)}
                          onClick={() => setSnacks(toggle(snacks, s))}
                        >
                          {s.replace(/ \(.*\)$/, "")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </fieldset>
          )}

          {pkg.danceStyles.length > 0 && (
            <div className="field">
              <label htmlFor="dance">Choice of dance</label>
              <select id="dance" value={dance} onChange={(e) => setDance(e.target.value)}>
                <option value="">Let us recommend</option>
                {pkg.danceStyles.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {OCCASIONS.length > 0 && (
            <fieldset className="field">
              <legend className="book-legend">What are we celebrating?</legend>
              <div className="book-chips">
                {OCCASIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={`book-chip${occasion.includes(o) ? " is-selected" : ""}`}
                    aria-pressed={occasion.includes(o)}
                    onClick={() => setOccasion(toggle(occasion, o))}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="field">
            <label htmlFor="honoree">Guest of honor (optional)</label>
            <input
              id="honoree"
              value={honoree}
              maxLength={120}
              placeholder="First and last name"
              onChange={(e) => setHonoree(e.target.value)}
            />
          </div>

          <h2 className="book-h2-gap">
            <span className="book-num">5</span> Your info
          </h2>
          <div className="field-row">
            <div className="field">
              <label htmlFor="first_name">
                First name <span className="req">*</span>
              </label>
              <input id="first_name" name="first_name" autoComplete="given-name" required />
            </div>
            <div className="field">
              <label htmlFor="last_name">
                Last name <span className="req">*</span>
              </label>
              <input id="last_name" name="last_name" autoComplete="family-name" required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="email">
                Email <span className="req">*</span>
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="phone">
                Mobile phone <span className="req">*</span>
              </label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Anything else?</label>
            <textarea id="notes" name="notes" maxLength={2000} placeholder="Questions, special requests…" />
          </div>

          <div className="book-summary" aria-live="polite">
            <div className="book-summary-row">
              <span>{pkg.name}</span>
              <span>${pkg.price}</span>
            </div>
            {guests > b.includedGuests && (
              <div className="book-summary-row">
                <span>
                  {guests - b.includedGuests} extra {guests - b.includedGuests === 1 ? "person" : "people"} × $
                  {b.extraGuestPrice}
                </span>
                <span>${(guests - b.includedGuests) * b.extraGuestPrice}</span>
              </div>
            )}
            {addOns.map((a) => (
              <div className="book-summary-row" key={a}>
                <span>{ADD_ONS[a].label}</span>
                <span>${ADD_ONS[a].price}</span>
              </div>
            ))}
            <div className="book-summary-row book-summary-total">
              <span>Estimated total</span>
              <span>${total}</span>
            </div>
            <p className="book-summary-when">
              {longDate(date)} at {to12h(time)} · {guests} {guests === 1 ? "person" : "people"}
            </p>
            {deposit !== null ? (
              <p className="book-summary-dep">
                <strong>{formatCents(deposit)}</strong> non-refundable deposit today holds your date. The balance is due
                at your party.
              </p>
            ) : (
              <p className="book-summary-dep">
                This one&apos;s <strong>reserve-by-request</strong> — no payment now. We&apos;ll reach out to lock in
                your date.
              </p>
            )}
          </div>

          <label className="consent">
            <input type="checkbox" name="sms_consent" value="yes" />
            <span>
              Text me booking updates at the number above. Msg &amp; data rates may apply. Reply STOP to opt out.
            </span>
          </label>
          <button type="submit" className="btn btn-magenta book-submit" disabled={submitting}>
            {submitting
              ? "Submitting…"
              : deposit !== null
                ? `Continue to ${formatCents(deposit)} Deposit`
                : "Send My Request"}
          </button>
          {msg && (
            <p className={`form-msg ${msg.type}`} role="alert">
              {msg.text}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
