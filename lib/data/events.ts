// ─────────────────────────────────────────────────────────────
// UPCOMING EVENTS — add an event object and it shows on /events with its
// flyer, category, and a link to its registration page. No layout changes.
// Flyers go in /public/images/.
// ─────────────────────────────────────────────────────────────

export type EventCategory =
  | "body-painting"
  | "paint-and-pole"
  | "tattoo"
  | "vendor"
  | "photo-shoot";

export const EVENT_CATEGORIES: { id: EventCategory; label: string }[] = [
  { id: "body-painting", label: "Body Painting" },
  { id: "paint-and-pole", label: "Paint & Pole" },
  { id: "tattoo", label: "Tattoo Events" },
  { id: "vendor", label: "Vendor Events" },
  { id: "photo-shoot", label: "Photo Shoots" },
];

export interface StudioEvent {
  id: string;
  title: string;
  /** ISO date string, e.g. "2026-08-15" */
  date: string;
  /** optional end date for multi-day events */
  endDate?: string;
  category: EventCategory;
  /** flyer/image path under /public, e.g. "/images/events/paint-and-pole-aug.jpg" */
  flyer: string;
  /** where "Register" links to (event registration page / GloFox / form) */
  registrationUrl: string;
  description?: string;
}

export const EVENTS: StudioEvent[] = [
  // TODO: replace with real events. Example shape below (safe placeholder).
  {
    id: "example-paint-and-pole",
    title: "TODO: Paint & Pole Night",
    date: "2026-09-01",
    category: "paint-and-pole",
    flyer: "/images/TODO-event-flyer.jpg",
    registrationUrl: "#TODO-registration-link",
    description: "TODO: short event description.",
  },
];
