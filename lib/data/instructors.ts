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
  /** optional CSS object-position for the card crop (e.g. "32% 30%") */
  focus?: string;
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
    id: "angelica",
    name: "Angelica “Jelli”",
    // pronouns: TODO
    title: "Instructor",
    photo: "/images/instructor-jelli.jpg",
    certifications: [],
    bio: "Angelica — “Jelli” to her students — began her pole journey in 2016, drawn in because it was unlike any fitness she'd tried before and eager to build her confidence while challenging herself both physically and mentally. In her classes you can expect thorough training, intentional growth, and a supportive environment built on trust and positivity. Her favorite move to teach is the Ayesha — a full-body strength move that's as powerful as it is beautiful to finally achieve. Off the pole, you'll catch her roller skating. Fun fact: she loves wedding planning, and has planned three weddings all on her own 💜",
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
    id: "ashley",
    name: "Ashley Nicole",
    // pronouns: TODO
    title: "Instructor",
    photo: "/images/instructor-ashley.jpg",
    certifications: [],
    bio: "Ashley began her pole journey in 2019 at Freeflow Fitness and fell in love quickly. She loves spin pole, training tricks and exploring creative pole combos and transitions. She has experience teaching students of all levels, from complete beginners to more experienced polers. Her teaching style places an emphasis on control and confidence. Ashley creates an encouraging environment where students can build on their strength, artistry and work on developing their own unique flow 💜",
  },
  {
    id: "imani",
    name: "Imani",
    // pronouns: TODO
    title: "Instructor",
    photo: "/images/instructor-imani.jpg",
    focus: "32% 30%", // landscape action shot — keep her face in the card crop
    certifications: [],
    bio: "TODO: Imani's bio — send a couple of sentences and I'll add them.",
  },
];
