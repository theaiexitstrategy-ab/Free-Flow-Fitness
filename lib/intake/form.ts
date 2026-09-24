// Shared (client + server) helpers for the intake form. Everything here is
// driven by data/intake-form.json — the extracted Google Form — so questions,
// options, required flags and branching are never hardcoded.
import formJson from "@/data/intake-form.json";

export type QuestionType =
  | "short_text"
  | "paragraph"
  | "multiple_choice"
  | "dropdown"
  | "checkboxes"
  | "date"
  | "time";

export interface IntakeQuestion {
  id: string;
  label: string;
  help: string | null;
  type: QuestionType;
  required: boolean;
  options?: string[];
  /** option label → section id to jump to */
  branch?: Record<string, string>;
  includeYear?: boolean;
  role?: "name" | "email" | "phone";
}

export interface IntakeSection {
  id: string;
  title: string | null;
  description: string | null;
  afterSection: "next" | "submit";
  questions: IntakeQuestion[];
}

export interface IntakeForm {
  source: { formUrl: string; extractedAt: string };
  title: string;
  description: string;
  confirmationMessage: string | null;
  sections: IntakeSection[];
}

export const INTAKE_FORM = formJson as unknown as IntakeForm;

// TODO(Aaron/Adrianne): the live Google Form has no custom confirmation
// message, so this is Google's default text. Replace via the form (then re-run
// the extractor) or tell us the wording you want.
export const CONFIRMATION_MESSAGE =
  INTAKE_FORM.confirmationMessage ?? "Your response has been recorded.";

// Opening chat bubble (rendered client-side; the system prompt tells the model
// this was already said so the conversation continues from it).
export const INTAKE_GREETING =
  "Hi! I'm the Free Flow Fitness front desk assistant. I'll walk you through our party request — same questions as the form, a couple at a time. To start, what's the first and last name of the person requesting the party?";

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

export const ALL_QUESTIONS: IntakeQuestion[] = INTAKE_FORM.sections.flatMap((s) => s.questions);
const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
export const getQuestion = (id: string) => BY_ID.get(id);

export function isEmpty(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  return Array.isArray(v) ? v.length === 0 : String(v).trim() === "";
}

/**
 * The sections a respondent actually sees, following the form's branching
 * ("go to section based on answer") and each section's after-section rule.
 * Stops at an unanswered branch question.
 */
export function activeSections(answers: Answers): IntakeSection[] {
  const secs = INTAKE_FORM.sections;
  const path: IntakeSection[] = [];
  let i = 0;
  const seen = new Set<number>();
  while (i >= 0 && i < secs.length && !seen.has(i)) {
    seen.add(i);
    const s = secs[i];
    path.push(s);
    let next: number | "submit" | "stop" = s.afterSection === "submit" ? "submit" : i + 1;
    for (const q of s.questions) {
      if (!q.branch) continue;
      const a = answers[q.id];
      if (typeof a !== "string" || !q.branch[a]) {
        next = "stop";
        break;
      }
      next = secs.findIndex((x) => x.id === q.branch![a]);
    }
    if (next === "submit" || next === "stop") break;
    i = next;
  }
  return path;
}

export const activeQuestions = (answers: Answers) =>
  activeSections(answers).flatMap((s) => s.questions);

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_TEXT = 2000;

export interface ValidationError {
  id: string;
  label: string;
  message: string;
}

/**
 * Validate + normalize answers against the form. Answers to questions that are
 * not on the respondent's branch are dropped.
 */
export function validateAnswers(input: unknown): {
  ok: boolean;
  answers: Answers;
  errors: ValidationError[];
} {
  const raw: Answers = {};
  if (input && typeof input === "object" && !Array.isArray(input)) {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (!BY_ID.has(k)) continue;
      if (Array.isArray(v)) raw[k] = v.map((x) => String(x).trim()).filter(Boolean);
      else if (v !== null && v !== undefined) raw[k] = String(v).trim();
    }
  }

  const answers: Answers = {};
  const errors: ValidationError[] = [];
  const err = (q: IntakeQuestion, message: string) =>
    errors.push({ id: q.id, label: q.label, message });

  for (const q of activeQuestions(raw)) {
    let v = raw[q.id];
    if (isEmpty(v)) {
      if (q.required) err(q, "This question is required.");
      continue;
    }
    switch (q.type) {
      case "checkboxes": {
        const arr = Array.isArray(v) ? v : [v as string];
        const bad = arr.filter((x) => !q.options!.includes(x));
        if (bad.length) err(q, `Not a listed option: ${bad.join(", ")}. Options: ${q.options!.join(" | ")}`);
        else answers[q.id] = q.options!.filter((o) => arr.includes(o)); // keep form order
        continue;
      }
      case "multiple_choice":
      case "dropdown": {
        const s = Array.isArray(v) ? v[0] : v;
        if (!q.options!.includes(s)) err(q, `Must be one of: ${q.options!.join(" | ")}`);
        else answers[q.id] = s;
        continue;
      }
      case "date": {
        const s = String(v);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
        if (!m || !d || d.getUTCMonth() !== +m[2] - 1) err(q, "Use a real date in YYYY-MM-DD format.");
        else answers[q.id] = s;
        continue;
      }
      case "time": {
        const s = String(v);
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s)) err(q, "Use 24-hour HH:MM format (e.g. 18:30).");
        else answers[q.id] = s;
        continue;
      }
      default: {
        v = Array.isArray(v) ? v.join(", ") : v;
        if (v.length > MAX_TEXT) {
          err(q, `Please keep this under ${MAX_TEXT} characters.`);
          continue;
        }
        if (q.role === "email" && !EMAIL_RE.test(v)) {
          err(q, "Please enter a valid email address.");
          continue;
        }
        if (q.role === "phone" && v.replace(/\D/g, "").length < 10) {
          err(q, "Please enter a valid phone number with area code.");
          continue;
        }
        answers[q.id] = v;
      }
    }
  }
  return { ok: errors.length === 0, answers, errors };
}

/** Top-level name/email/phone columns, from whichever questions carry those roles. */
export function roleFields(answers: Answers) {
  const out: { name: string | null; email: string | null; phone: string | null } = {
    name: null,
    email: null,
    phone: null,
  };
  for (const q of ALL_QUESTIONS) {
    if (q.role && typeof answers[q.id] === "string") out[q.role] = answers[q.id] as string;
  }
  return out;
}

/** Human-readable answer for display/CSV. */
export function formatAnswer(q: IntakeQuestion, v: AnswerValue | undefined): string {
  if (v === undefined || isEmpty(v)) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (q.type === "date") {
    const [y, m, d] = v.split("-").map(Number);
    if (y && m && d)
      return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  }
  if (q.type === "time") {
    const [h, min] = v.split(":").map(Number);
    if (!Number.isNaN(h)) return `${((h + 11) % 12) + 1}:${String(min).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  }
  return v;
}

/** Column header for a question — branch sections are prefixed so repeated labels stay distinct. */
export function columnLabel(q: IntakeQuestion): string {
  const sec = INTAKE_FORM.sections.find((s) => s.questions.includes(q));
  const label = q.label.split("\n")[0].trim();
  return sec?.title ? `${sec.title}: ${label}` : label;
}
