// ─────────────────────────────────────────────────────────────
// INSTRUCTOR ROSTER — edit this file to add/update/remove an instructor.
// No layout or component changes needed; the /instructors page renders
// whatever is in this array. Photos go in /public/images/.
//
// Bios sourced from freeflowfitnessstl.com/instructors.
// Set photo to "COMING_SOON" to render the brand-themed placeholder.
// ─────────────────────────────────────────────────────────────

export interface Instructor {
  id: string;
  name: string;
  /** e.g. "she/her" — optional; omit if not provided */
  pronouns?: string;
  /** e.g. "Co-Owner & Instructor", "Instructor" */
  title: string;
  /** path under /public, or the literal "COMING_SOON" for a placeholder */
  photo: string;
  /** shown as badges next to the name */
  certifications: string[];
  bio: string;
}

export const INSTRUCTORS: Instructor[] = [
  {
    id: "adrianne-martin",
    name: "Adrianne Martin",
    pronouns: "she/her",
    title: "Co-Owner & Instructor",
    photo: "/images/adrianne_pole.jpg",
    certifications: ["Registered Therapist"],
    bio: "Co-owner of Free Flow Fitness since it began in 2018 (formerly Foxy Fitness) and a registered therapist. Adrianne is always looking for a new adventure, trying new tricks, and embracing unique ideas.",
  },
  {
    id: "clarissa-lewis",
    name: "Clarissa “Pride N’ Pole” Lewis",
    pronouns: "she/her",
    title: "Instructor",
    photo: "/images/instructor-clarissa.jpg",
    certifications: [
      "Certified Pole Fitness Instructor",
      "Certified Twerk Instructor",
    ],
    bio: "Clarissa started pole in August 2018 at Dollhouse Studios and is largely self-taught on her home pole. She teaches pole, twerk, and heels classes plus private lessons, and strives to help others feel the magical benefits of pole and dance fitness — physically, mentally, and spiritually.",
  },
  {
    id: "nici-worstell",
    name: "Nici (Nicole Worstell)",
    // pronouns: not listed — TODO confirm
    title: "Instructor",
    photo: "/images/instructor-nici.jpg",
    certifications: [],
    // Nici wasn't listed on the current site's instructors page.
    bio: "TODO: Nici's bio — send a couple of sentences and I'll add them.",
  },
  {
    id: "bex",
    name: "Bex",
    pronouns: "she/her",
    title: "Instructor",
    photo: "/images/instructor-bex.jpg",
    certifications: [],
    bio: "An exotic dancer for 15 years, Bex loves guiding non-performers toward empowerment through pole. Her motto: “Grace is just strength showing off.”",
  },
  {
    id: "lauren-meredith",
    name: "Lauren Meredith",
    pronouns: "she/her",
    title: "Instructor",
    photo: "COMING_SOON",
    certifications: [],
    bio: "A lifelong dancer who adapted her background to vertical pole. Taking life one step at a time and modeling on the side, Lauren is here to do cool things and look beautiful in the process.",
  },
  {
    id: "taylor-jennings",
    name: "Taylor Jennings",
    pronouns: "she/her",
    title: "Instructor",
    photo: "COMING_SOON",
    certifications: [],
    bio: "Taylor began pole in 2019 after her pregnancy. Her classes are a nice mix of chaos and structure, where students learn while hanging out together.",
  },
  {
    id: "yolanda-green",
    name: "Yolanda “Yo” Green",
    pronouns: "she/her",
    title: "Instructor",
    photo: "COMING_SOON",
    certifications: ["Certified Xtreme Hip Hop Instructor"],
    bio: "With 3.5 years of experience, Yo teaches high-energy cardio that blends step aerobics with hip hop. Her philosophy: exercise should not feel like a chore.",
  },
];
