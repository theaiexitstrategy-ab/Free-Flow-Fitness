// Weekly class catalog. `blurb` is the always-visible summary; `details` is the
// expanded accordion copy on /classes. Edit here — no layout changes needed.
export interface ClassItem {
  id: string;
  name: string;
  blurb: string;
  /** Longer description shown when the accordion item is expanded. */
  details?: string;
}

export const WEEKLY_CLASSES: ClassItem[] = [
  {
    id: "level-1-pole",
    name: "Level 1 Pole",
    blurb: "Foundational moves, spins, and sits — perfect for brand new students.",
    details:
      "TODO: full Level 1 description (what to expect, what to wear, prerequisites).",
  },
  {
    id: "level-234-pole",
    name: "Level 1.5 / 2 / 3 Pole",
    blurb:
      "Progressive skill-building for students ready to level up (instructor approval required).",
    details: "TODO: describe each level + how approval works.",
  },
  {
    id: "hello-pole",
    name: "Hello, Pole!",
    blurb: "A gentle $10 first step for anyone nervous to jump right in.",
    details: "TODO: what a first-timer can expect in Hello, Pole!",
  },
  {
    id: "twerk-u",
    name: "Twerk U",
    blurb: "Conditioning + control, for the culture. Mondays at 8pm.",
    details: "TODO: Twerk U details.",
  },
  {
    id: "alter-ego",
    name: "Alter Ego / Choreography",
    blurb: "Monthly choreographed routines, platform heels encouraged.",
    details: "TODO: Alter Ego / Choreography details.",
  },
  {
    id: "flex-conditioning",
    name: "Flexibility, Conditioning & More",
    blurb:
      "Free Flow Flexibility, Pole Conditioning, Xtreme Hip Hop, Fun & 40, and Pole Study Hall.",
    details: "TODO: break out each of these classes.",
  },
];
