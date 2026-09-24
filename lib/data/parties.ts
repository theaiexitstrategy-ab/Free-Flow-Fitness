// ─────────────────────────────────────────────────────────────
// PRIVATE PARTIES — party types, add-ons, and policies. Edit here.
// ─────────────────────────────────────────────────────────────

export interface PartyType {
  name: string;
  blurb: string;
}

export const PARTY_TYPES: PartyType[] = [
  { name: "Bachelorette", blurb: "Send her off in style — our #1 party." },
  { name: "Birthday Party", blurb: "Celebrate another trip around the sun on the pole." },
  { name: "Ladies Night", blurb: "Grab your girls for a night of confidence and fun." },
  { name: "Milestone", blurb: "Anniversaries, promotions, big wins — mark the moment." },
  { name: "Team Building", blurb: "A bold, bonding break from the usual work outing." },
  { name: "Divorce Party", blurb: "New chapter, new moves. Come celebrate you." },
];

export interface PartyAddon {
  label: string;
  detail: string;
}

export const PARTY_ADDONS: PartyAddon[] = [
  { label: "Themes", detail: "$100" },
  { label: "Snacks / hors d'oeuvres", detail: "$100" },
  { label: "Non-dance activities", detail: "additional fees — inquire within" },
  { label: "Sober / dry events", detail: "available, per instructor" },
  {
    label: "Gift add-ons",
    detail:
      "via vendor partnerships — soaps from Adewunmi, bag item from Cece (TODO: full vendor list)",
  },
];

// Verbatim policies from Adrianne.
export const PARTY_POLICIES: string[] = [
  "15 minutes max for setup and cleanup.",
  "Parties start no more than 15 minutes after the booking time. Regardless of late arrival, the party ends at its scheduled end time, out of respect for the hostess's time and the other classes rescheduled around the party.",
];
