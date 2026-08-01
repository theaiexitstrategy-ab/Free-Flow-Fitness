// ─────────────────────────────────────────────────────────────
// STUDENT OF THE WEEK — update these fields each week. That's the only
// place to change it; the Home page reads straight from here.
// Put the photo in /public/images/.
// ─────────────────────────────────────────────────────────────

export interface StudentOfWeek {
  name: string;
  photo: string; // e.g. "/images/student-2026-07-28.jpg"
  blurb: string;
  /** free-text, e.g. "Week of July 28" */
  weekOf: string;
}

export const STUDENT_OF_WEEK: StudentOfWeek = {
  name: "TODO: student name",
  photo: "/images/TODO-student-of-week.jpg",
  blurb: "TODO: a sentence or two celebrating this week's student.",
  weekOf: "TODO: week of …",
};
