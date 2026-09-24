// Party slot availability for /book. Pure + isomorphic: the server computes
// open slots with it, and re-checks a chosen slot at submit time.
//
// Party hours: "evenings and weekends" (Aaron, 2026-09-24). The exact clock
// times below are assumptions — adjust PARTY_HOURS if the studio's differ.
// MIN_NOTICE_DAYS, BOOKING_WINDOW_DAYS and BLACKOUT_DATES are still
// placeholders. SETUP_BUFFER_MIN is studio policy ("15 minutes max for setup
// and cleanup" — lib/data/parties.ts). The class schedule it avoids
// (lib/schedule.ts) is itself mostly placeholder.
import { CLASS_SERVICES } from "./schedule";

export const TZ = "America/Chicago";

const EVENINGS: [string, string][] = [["17:00", "22:00"]]; // assumed 5–10 PM
const WEEKENDS: [string, string][] = [["10:00", "22:00"]]; // assumed 10 AM–10 PM

/** Weekday (0 = Sun … 6 = Sat) → party windows as [open, close] "HH:MM". */
export const PARTY_HOURS: Record<number, [string, string][]> = {
  0: WEEKENDS,
  1: EVENINGS,
  2: EVENINGS,
  3: EVENINGS,
  4: EVENINGS,
  5: EVENINGS,
  6: WEEKENDS,
};
/** Earliest bookable day, counted from today (Chicago). PLACEHOLDER. */
export const MIN_NOTICE_DAYS = 3;
/** How far ahead people can book. PLACEHOLDER. */
export const BOOKING_WINDOW_DAYS = 180;
/** "YYYY-MM-DD" dates the studio is closed for parties. TODO. */
export const BLACKOUT_DATES: string[] = [];
/** Gap kept before/after every party and class (studio policy: 15 min setup/cleanup). */
export const SETUP_BUFFER_MIN = 15;
/** Start times are offered on this grid. */
export const SLOT_STEP_MIN = 30;

export interface BusyBlock {
  dateISO: string;
  start: number; // minutes from midnight
  end: number;
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const utc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
export const addDays = (iso: string, n: number) =>
  new Date(utc(iso).getTime() + n * 86400000).toISOString().slice(0, 10);
export const weekday = (iso: string) => utc(iso).getUTCDay();

/** Today's date in Chicago. */
export function chicagoToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** First and last bookable dates. */
export function bookableRange(now = new Date()) {
  const today = chicagoToday(now);
  return { first: addDays(today, MIN_NOTICE_DAYS), last: addDays(today, BOOKING_WINDOW_DAYS) };
}

/** Weekly classes on a date, as busy blocks (the studio has one room). */
function classBlocks(dateISO: string): BusyBlock[] {
  const dow = weekday(dateISO);
  return CLASS_SERVICES.flatMap((s) =>
    s.slots
      .filter((sl) => sl.day === dow)
      .map((sl) => ({ dateISO, start: toMin(sl.start), end: toMin(sl.start) + sl.durationMin }))
  );
}

/** Open start times ("HH:MM") on one date for a party of `durationMin`. */
export function openSlotsForDate(
  dateISO: string,
  durationMin: number,
  busy: BusyBlock[],
  now = new Date()
): string[] {
  const { first, last } = bookableRange(now);
  if (dateISO < first || dateISO > last || BLACKOUT_DATES.includes(dateISO)) return [];
  const windows = PARTY_HOURS[weekday(dateISO)] ?? [];
  const blocks = [...busy.filter((b) => b.dateISO === dateISO), ...classBlocks(dateISO)];
  const out: string[] = [];
  for (const [open, close] of windows) {
    for (let t = toMin(open); t + durationMin <= toMin(close); t += SLOT_STEP_MIN) {
      const s = t - SETUP_BUFFER_MIN;
      const e = t + durationMin + SETUP_BUFFER_MIN;
      if (!blocks.some((b) => b.start < e && b.end > s)) out.push(toHHMM(t));
    }
  }
  return out;
}

/** Open slots for every date in [from, to]. Dates with none are omitted. */
export function openSlotsInRange(
  from: string,
  to: string,
  durationMin: number,
  busy: BusyBlock[],
  now = new Date()
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const slots = openSlotsForDate(d, durationMin, busy, now);
    if (slots.length) out[d] = slots;
  }
  return out;
}
