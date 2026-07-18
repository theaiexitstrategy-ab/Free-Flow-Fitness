// Free Flow Fitness — party package catalog (source of truth for the funnel).
// Prices/deposits mirror the approved reference design.
//
// deposit flow (party customer -> studio):
//   fab-flow      $300  -> $150 deposit (50%)
//   ultimate-flow $400  -> $200 deposit (50%)
//   private-group $225  -> $112.50 deposit (50%)
//   body-painting $300  -> INQUIRY ONLY (no customer deposit listed / confirmed)
//
// NOTE: deposits are charged by the GoElev8 portal via Stripe Checkout, not here.
// This catalog only tells the frontend what to display and what to request.

export type PackageId =
  | "fab-flow"
  | "ultimate-flow"
  | "private-group"
  | "body-painting";

export interface PartyPackage {
  id: PackageId;
  name: string;
  /** Full session price, in whole dollars, for display. */
  price: number;
  /** Deposit charged to the customer at booking, in cents. null = inquiry only. */
  depositCents: number | null;
  /** Human label for the deposit line on the card. */
  depositLabel: string;
  featured?: boolean;
  tag?: string;
  duration: string;
  features: string[];
  /** Dance styles offered for this package (empty = not applicable). */
  danceStyles: string[];
  /** CTA copy from the reference. */
  ctaLabel: string;
}

export const PARTY_PACKAGES: PartyPackage[] = [
  {
    id: "fab-flow",
    name: "Fab Flow Party",
    price: 300,
    depositCents: 15000,
    depositLabel: "$150 deposit",
    duration: "90 minutes — 60 min dancing, 30 min mixing & mingling",
    features: [
      "90 minutes — 60 min dancing, 30 min mixing & mingling",
      "Up to 7 people ($25/each additional, up to 15 total)",
      "Gift for the guest of honor",
      "Choice of dance: Pole, Chair, or Twerk",
    ],
    danceStyles: ["Pole", "Chair", "Twerk"],
    ctaLabel: "Book This Party",
  },
  {
    id: "ultimate-flow",
    name: "Ultimate Flow Party",
    price: 400,
    depositCents: 20000,
    depositLabel: "$200 deposit",
    featured: true,
    tag: "Most Popular",
    duration: "2 hours — 90 min dancing, 30 min mixing & mingling",
    features: [
      "2 hours — 90 min dancing, 30 min mixing & mingling",
      "Up to 7 people ($25/each additional, up to 20 total)",
      "Gift for the guest of honor",
      "Choice of dance: Pole, Chair, Burlesque, Sexy Floorwork, or Twerk",
      "Refreshments included on request",
    ],
    danceStyles: ["Pole", "Chair", "Burlesque", "Sexy Floorwork", "Twerk"],
    ctaLabel: "Book This Party",
  },
  {
    id: "private-group",
    name: "Private Group Class",
    price: 225,
    depositCents: 11250,
    depositLabel: "$112.50 deposit",
    duration: "60 minutes, Level 1-style class",
    features: [
      "60 minutes, Level 1-style class",
      "Up to 7 people ($25/each additional, up to 14 total)",
      "Just your group — no strangers watching",
    ],
    danceStyles: [],
    ctaLabel: "Book This Class",
  },
  {
    id: "body-painting",
    name: "Body Painting",
    price: 300,
    // INQUIRY ONLY: no customer deposit is listed on the current site and the
    // amount is not yet confirmed. Do NOT wire a Stripe charge for this package
    // until a deposit is confirmed. This routes to the request/hold flow.
    depositCents: null,
    depositLabel: "Reserve by request",
    duration: "2 hours, extendable with more participants",
    features: [
      "2 hours, extendable with more participants",
      "Up to 4 people ($70/each additional, up to 10 total)",
      "Canvas, paints & brushes for everyone",
      "Refreshments +$20",
    ],
    danceStyles: [],
    ctaLabel: "Book This Party",
  },
];

export function getPackage(id: PackageId): PartyPackage | undefined {
  return PARTY_PACKAGES.find((p) => p.id === id);
}

/** Dollars display helper, e.g. 15000 -> "$150", 11250 -> "$112.50". */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars)
    ? `$${dollars}`
    : `$${dollars.toFixed(2)}`;
}
