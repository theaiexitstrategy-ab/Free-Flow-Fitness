"use client";

import { useMemo, useState } from "react";
import type { StudioEvent, EventCategory } from "@/lib/data/events";
import { EVENT_CATEGORIES } from "@/lib/data/events";

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
function monthKey(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "Upcoming";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function catLabel(id: EventCategory): string {
  return EVENT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export default function EventsList({ events }: { events: StudioEvent[] }) {
  const [cat, setCat] = useState<EventCategory | "all">("all");

  const filtered = useMemo(
    () =>
      [...events]
        .filter((e) => cat === "all" || e.category === cat)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, cat]
  );

  // Group filtered events by month for a calendar-style listing.
  const groups = useMemo(() => {
    const map = new Map<string, StudioEvent[]>();
    for (const e of filtered) {
      const k = monthKey(e.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <>
      <div className="event-filters" role="tablist" aria-label="Event categories">
        <button
          type="button"
          className={`chip ${cat === "all" ? "active" : ""}`}
          onClick={() => setCat("all")}
        >
          All
        </button>
        {EVENT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${cat === c.id ? "active" : ""}`}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="muted" style={{ textAlign: "center" }}>
          No events in this category yet — check back soon!
        </p>
      )}

      {groups.map(([month, list]) => (
        <div className="event-month" key={month}>
          <h2 className="event-month-title">{month}</h2>
          <div className="event-grid">
            {list.map((e) => {
              const hasFlyer = !e.flyer.includes("TODO");
              const noLink = e.registrationUrl.startsWith("#TODO");
              return (
                <article className="event-card" key={e.id}>
                  <div className="event-flyer">
                    {hasFlyer ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.flyer} alt={e.title} loading="lazy" />
                    ) : (
                      <div className="img-placeholder">Flyer TODO · 1080×1350</div>
                    )}
                  </div>
                  <div className="event-body">
                    <span className="badge badge-cert">{catLabel(e.category)}</span>
                    <h3>{e.title}</h3>
                    <p className="event-date">{fmtDate(e.date)}</p>
                    {e.description && <p className="muted event-desc">{e.description}</p>}
                    {noLink ? (
                      <span className="btn btn-outline is-disabled" aria-disabled="true">
                        Registration TODO
                      </span>
                    ) : (
                      <a className="btn btn-magenta" href={e.registrationUrl}>
                        Register
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
