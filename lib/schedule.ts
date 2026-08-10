// Class schedule model + session expansion for the booking calendar (Phase 1).
//
// ⚠️ PLACEHOLDER weekly schedule — replace `CLASS_SERVICES` with the real
// GloFox export (class name, day, time, capacity, instructor/level). Only
// "Twerk U — Mondays 8pm" is confirmed; the rest are reasonable stand-ins so
// the calendar is demonstrable. The portal's availability_templates become the
// source of truth once seeded (see docs/PORTAL-BOOKING-SEED-PROMPT.md).

export interface ClassSlot {
  /** 0 = Sunday … 6 = Saturday (America/Chicago) */
  day: number;
  /** 24h "HH:MM" wall-clock, America/Chicago */
  start: string;
  durationMin: number;
}

export interface ClassService {
  key: string;
  name: string;
  level?: string;
  /** max_per_slot — the "7 per pole" capacity */
  capacity: number;
  slots: ClassSlot[];
}

export const CLASS_CAPACITY = 7;

export const CLASS_SERVICES: ClassService[] = [
  {
    key: "level-1-pole",
    name: "Level 1 Pole",
    level: "Beginner",
    capacity: CLASS_CAPACITY,
    slots: [
      { day: 2, start: "18:00", durationMin: 60 }, // Tue 6:00pm (PLACEHOLDER)
      { day: 4, start: "18:00", durationMin: 60 }, // Thu 6:00pm (PLACEHOLDER)
    ],
  },
  {
    key: "level-234-pole",
    name: "Level 1.5 / 2 / 3 Pole",
    level: "Progressive",
    capacity: CLASS_CAPACITY,
    slots: [
      { day: 2, start: "19:15", durationMin: 60 }, // PLACEHOLDER
      { day: 4, start: "19:15", durationMin: 60 }, // PLACEHOLDER
    ],
  },
  {
    key: "hello-pole",
    name: "Hello, Pole!",
    level: "Intro",
    capacity: CLASS_CAPACITY,
    slots: [{ day: 6, start: "11:00", durationMin: 60 }], // Sat 11am (PLACEHOLDER)
  },
  {
    key: "twerk-u",
    name: "Twerk U",
    capacity: CLASS_CAPACITY,
    slots: [{ day: 1, start: "20:00", durationMin: 60 }], // Mon 8:00pm (CONFIRMED)
  },
  {
    key: "alter-ego",
    name: "Alter Ego / Choreography",
    capacity: CLASS_CAPACITY,
    slots: [{ day: 3, start: "19:00", durationMin: 60 }], // PLACEHOLDER
  },
  {
    key: "flex-conditioning",
    name: "Flexibility & Conditioning",
    capacity: CLASS_CAPACITY,
    slots: [{ day: 6, start: "12:30", durationMin: 60 }], // PLACEHOLDER
  },
];

export interface UpcomingSession {
  /** stable id: serviceKey + dateISO + start */
  id: string;
  serviceKey: string;
  name: string;
  level?: string;
  /** YYYY-MM-DD (America/Chicago) */
  dateISO: string;
  /** "HH:MM" 24h, America/Chicago */
  startTime: string;
  durationMin: number;
  displayDate: string; // "Tue, Aug 12"
  displayTime: string; // "6:00 PM"
  capacity: number;
}

const TZ = "America/Chicago";
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Chicago-local Y-M-D + weekday for a given instant. */
function chicagoParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    dateISO: `${get("year")}-${get("month")}-${get("day")}`,
    dow: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10),
  };
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function displayDateFromISO(iso: string): string {
  // iso is a Chicago wall-clock date; format without tz shifting.
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Expand the weekly schedule into concrete dated sessions for the next
 * `days` days, hiding sessions that start within `minNoticeHours` (the
 * 2-hour registration policy) — approximated in Chicago local time.
 */
export function expandSessions(
  now: Date,
  opts: { days: number; minNoticeHours: number }
): UpcomingSession[] {
  const today = chicagoParts(now);
  const out: UpcomingSession[] = [];

  for (let i = 0; i <= opts.days; i++) {
    const dayInstant = new Date(now.getTime() + i * 86400000);
    const { dateISO, dow } = chicagoParts(dayInstant);

    for (const svc of CLASS_SERVICES) {
      for (const slot of svc.slots) {
        if (slot.day !== dow) continue;
        const [sh, sm] = slot.start.split(":").map(Number);
        const startMinutes = sh * 60 + sm;

        // min-notice filter, only relevant for today
        if (dateISO === today.dateISO) {
          if (startMinutes < today.minutes + opts.minNoticeHours * 60) continue;
        }

        out.push({
          id: `${svc.key}__${dateISO}__${slot.start}`,
          serviceKey: svc.key,
          name: svc.name,
          level: svc.level,
          dateISO,
          startTime: slot.start,
          durationMin: slot.durationMin,
          displayDate: displayDateFromISO(dateISO),
          displayTime: to12h(slot.start),
          capacity: svc.capacity,
        });
      }
    }
  }

  out.sort((a, b) =>
    a.dateISO === b.dateISO
      ? a.startTime.localeCompare(b.startTime)
      : a.dateISO.localeCompare(b.dateISO)
  );
  return out;
}
