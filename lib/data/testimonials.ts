// ─────────────────────────────────────────────────────────────
// TESTIMONIALS — add a new entry to the array and it appears on the site.
// No layout changes needed.
// ─────────────────────────────────────────────────────────────

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  /** optional context, e.g. "Bachelorette party, June 2026" */
  context?: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote: "TODO: paste a real review here.",
    author: "TODO: first name / initial",
    // context: "TODO",
  },
  // TODO: add more testimonials.
];
