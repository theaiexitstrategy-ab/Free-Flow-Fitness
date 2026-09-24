// Re-extracts the Free Flow Fitness Google Form into data/intake-form.json —
// the single source of truth for the /intake agent, fallback form, API
// validation, and the responses dashboard/CSV.
//
//   node scripts/extract-intake-form.mjs
//
// Parses the FB_PUBLIC_LOAD_DATA_ blob embedded in the public form page. Only
// the manual `ROLES` / `FLOW_OVERRIDES` below are hand-authored; everything
// else (text, options, required flags, branching) comes from the live form.
import fs from "node:fs";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeXX_EOvTiblxH2RXlsxt2p_bytPmYYgbQc7UnjHPwESOs3Lw/viewform";

// Which question ids map to the top-level name/email/phone DB columns.
const ROLES = { "887150580": "name", "1263539387": "phone", "15836933": "email" };

// TODO(Aaron/Adrianne): on the live form, the "Fab Flow Party" section is set
// to "Continue to next section", so Fab Flow requesters fall through into the
// Ultimate Flow Party questions (dance style + headcount asked twice). That
// looks unintended, so the agent ends the request after Fab Flow instead.
// Delete this override to mirror the live form exactly.
const FLOW_OVERRIDES = { "2034118254": "submit" };

// Studio pricing that supersedes the (outdated) prices written on the Google
// Form — confirmed by Aaron 2026-09-24: base price covers up to 7 people,
// +$25 per extra person (caps unchanged); 1 hr $300 / 90 min $400 / 2 hr $500;
// deposit = 50%; Theme $100; Snacks/hors d'oeuvres $100. Body Painting pricing
// unchanged. Each [from, to] must match the live form text exactly, or the
// script fails so a form edit can't silently drop a price change.
const SECTION_TEXT_OVERRIDES = {
  "2034118254": [ // Fab Flow Party (90 min)
    ["$300 for up to 7 people.", "$400 for up to 7 people."],
    ["Non-Refundable deposit of $150.00", "Non-Refundable deposit of $200.00"],
  ],
  "1632364030": [ // Ultimate Flow Party (2 hr)
    ["$400 for 7 people.", "$500 for 7 people."],
    ["Non-Refundable deposit of $200.00", "Non-Refundable deposit of $250.00"],
  ],
  "477367235": [ // Private Group Class (1 hr)
    ["$225 for 7 people.", "$300 for 7 people."],
    ["Non-Refundable deposit of $112.50.", "Non-Refundable deposit of $150.00."],
  ],
};
const LABEL_OVERRIDES = [
  ["including decorations, for an additional $50?", "including decorations, for an additional $100?"],
  ["add light refreshments for an additional $20?", "add snacks/hors d'oeuvres for an additional $100?"],
];

function applyOverride(text, from, to, where) {
  if (!text?.includes(from)) throw new Error(`Price override not found in ${where}: "${from}" — has the form changed?`);
  return text.split(from).join(to);
}

const TYPES = {
  0: "short_text",
  1: "paragraph",
  2: "multiple_choice",
  3: "dropdown",
  4: "checkboxes",
  9: "date",
  10: "time",
};

const stripHtml = (s) =>
  (s || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>\s*<div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .trim();

const html = await (await fetch(FORM_URL)).text();
const m = html.match(/FB_PUBLIC_LOAD_DATA_ = (.*?);<\/script>/s);
if (!m) throw new Error("FB_PUBLIC_LOAD_DATA_ not found — form may require sign-in.");
const data = JSON.parse(m[1]);
const form = data[1];

const sections = [
  { id: "start", title: null, description: null, afterSection: "next", questions: [] },
];

for (const item of form[1]) {
  const [itemId, title, help, type] = item;
  if (type === 8) {
    const nav = item[5];
    const sid = String(itemId);
    sections.push({
      id: sid,
      title,
      description: help ? help.trim() : null,
      afterSection: FLOW_OVERRIDES[sid] ?? (nav === -3 ? "submit" : "next"),
      ...(FLOW_OVERRIDES[sid]
        ? { liveFormAfterSection: nav === -3 ? "submit" : "next", overrideNote: "TODO: confirm — see scripts/extract-intake-form.mjs" }
        : {}),
      questions: [],
    });
    continue;
  }
  const t = TYPES[type];
  if (!t) throw new Error(`Unsupported question type ${type} for "${title}"`);
  const entry = item[4][0];
  const id = String(entry[0]);
  const q = {
    id,
    label: title.trim(),
    help: help ? help.trim() : null,
    type: t,
    required: entry[2] === 1,
  };
  if (["multiple_choice", "dropdown", "checkboxes"].includes(t)) {
    q.options = entry[1].map((o) => o[0]);
    const branch = entry[1].filter((o) => o[2]).map((o) => [o[0], String(o[2])]);
    if (branch.length) q.branch = Object.fromEntries(branch);
  }
  if (t === "date") q.includeYear = entry[7]?.[1] === 1;
  if (ROLES[id]) q.role = ROLES[id];
  sections[sections.length - 1].questions.push(q);
}

for (const [sid, pairs] of Object.entries(SECTION_TEXT_OVERRIDES)) {
  const s = sections.find((x) => x.id === sid);
  if (!s) throw new Error(`Price override: section ${sid} not found — has the form changed?`);
  for (const [from, to] of pairs) s.description = applyOverride(s.description, from, to, `section "${s.title}"`);
}
for (const [from, to] of LABEL_OVERRIDES) {
  const qs = sections.flatMap((s) => s.questions).filter((q) => q.label.includes(from));
  if (!qs.length) applyOverride("", from, to, "question labels");
  for (const q of qs) q.label = applyOverride(q.label, from, to, `question ${q.id}`);
}

const out = {
  source: {
    formUrl: FORM_URL,
    extractedAt: new Date().toISOString(),
    note: "Generated by scripts/extract-intake-form.mjs — re-run to refresh; do not hand-edit questions. Prices are studio overrides of the Google Form text (see SECTION_TEXT_OVERRIDES / LABEL_OVERRIDES).",
  },
  title: form[8],
  description: stripHtml(form[0]),
  // The live form has no custom confirmation message (Google shows its default).
  confirmationMessage: form[2] || null,
  sections,
};

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/intake-form.json", JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote data/intake-form.json — ${sections.length} sections, ${sections.reduce((n, s) => n + s.questions.length, 0)} questions.`);
