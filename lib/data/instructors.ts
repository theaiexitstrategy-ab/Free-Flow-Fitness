// ─────────────────────────────────────────────────────────────
// INSTRUCTOR ROSTER — edit this file to add/update/remove an instructor.
// No layout or component changes needed; the /instructors page renders
// whatever is in this array. Photos go in /public/images/.
// ─────────────────────────────────────────────────────────────

export interface Instructor {
  /** stable id used for keys/anchors */
  id: string;
  name: string;
  /** e.g. "she/her" — optional; omit if not provided */
  pronouns?: string;
  /** e.g. "Owner & Instructor", "Instructor" */
  title: string;
  /** path under /public, e.g. "/images/adrianne_pole.jpg" */
  photo: string;
  /** shown as badges next to the name */
  certifications: string[];
  bio: string;
}

export const INSTRUCTORS: Instructor[] = [
  {
    id: "adrianne",
    name: "Adrianne",
    // pronouns: "TODO",
    title: "Owner & Instructor",
    photo: "/images/adrianne_pole.jpg",
    certifications: [], // TODO: Adrianne's certifications
    bio: "TODO: Adrianne's bio — send me a few sentences and I'll drop them in.",
  },
  {
    id: "yolanda-green",
    name: "Yolanda “Yo” Green",
    // pronouns: "TODO",
    title: "Instructor",
    photo: "/images/TODO-yolanda.jpg", // TODO: add photo to /public/images
    certifications: ["Certified Xtreme Hip Hop Instructor"],
    bio: "TODO: Yo's bio.",
  },
  {
    id: "nici-worstell",
    name: "Nici (Nicole Worstell)",
    // pronouns: "TODO",
    title: "Instructor",
    // NOTE: this is the photo tagged "Instructor: Nici" on the studio mirror.
    // Swap for a face-forward headshot if Adrianne prefers.
    photo: "/images/instructor-nici.jpg",
    certifications: [], // TODO: Nici's certifications
    bio: "TODO: Nici's bio.",
  },
  // TODO: add the rest of the instructors here.
];
