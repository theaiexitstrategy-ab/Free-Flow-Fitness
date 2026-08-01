// Site-wide constants + navigation. Single source of truth for header/footer
// links and the external GloFox URLs. Fill the TODO env vars for production.

export const SITE = {
  name: "Free Flow Fitness",
  phone: "314-625-2323",
  address: "11726 St Charles Rock Rd Ste A, Bridgeton, MO 63044",

  // External GloFox links (env-overridable). TODO: set the real URLs.
  // NEXT_PUBLIC_GLOFOX_SIGNUP_URL   — "First time? Sign up here" destination
  // NEXT_PUBLIC_GLOFOX_SCHEDULE_URL — live class schedule
  // NEXT_PUBLIC_GLOFOX_CLASSPASS_URL— buy a class pass / credits
  signupUrl: process.env.NEXT_PUBLIC_GLOFOX_SIGNUP_URL || "#TODO-glofox-signup",
  scheduleUrl: process.env.NEXT_PUBLIC_GLOFOX_SCHEDULE_URL || "#TODO-glofox-schedule",
  classPassUrl: process.env.NEXT_PUBLIC_GLOFOX_CLASSPASS_URL || "#TODO-glofox-classpass",

  // Store shops (link-out). TODO: set the real hosted-storefront URLs.
  // NEXT_PUBLIC_PRINTIFY_URL — Printify Pop-Up Store URL
  // NEXT_PUBLIC_PRINTFUL_URL — Printful storefront URL
  printifyUrl: process.env.NEXT_PUBLIC_PRINTIFY_URL || "#TODO-printify-shop",
  printfulUrl: process.env.NEXT_PUBLIC_PRINTFUL_URL || "#TODO-printful-shop",
};

export interface NavItem {
  label: string;
  href: string;
}

// Primary navigation, in order. Used by the header (desktop + mobile) and footer.
export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Classes", href: "/classes" },
  { label: "Schedule", href: "/schedule" },
  { label: "Class Pass", href: "/class-pass" },
  { label: "Instructors", href: "/instructors" },
  { label: "Events", href: "/events" },
  { label: "Parties", href: "/parties" },
  { label: "Store", href: "/store" },
];
