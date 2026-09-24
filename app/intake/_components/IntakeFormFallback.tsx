"use client";

import Link from "next/link";
import { useState } from "react";
import {
  INTAKE_FORM,
  activeSections,
  type Answers,
  type IntakeQuestion,
  type ValidationError,
} from "@/lib/intake/form";

// Plain, accessible rendering of the same form (same JSON, same branching,
// same endpoint) for people who'd rather not chat.
export default function IntakeFormFallback() {
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const sections = activeSections(answers);
  const set = (id: string, v: string | string[]) => setAnswers((a) => ({ ...a, [id]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone(data.message);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (Array.isArray(data.errors)) {
        const map: Record<string, string> = {};
        (data.errors as ValidationError[]).forEach((er) => (map[er.id] = er.message));
        setErrors(map);
        setFormError("Please fix the highlighted questions.");
        const first = (data.errors as ValidationError[])[0];
        if (first) document.getElementById(`q-${first.id}`)?.focus();
      } else {
        setFormError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="intake-card" role="status">
        <h2 className="intake-section-title">Request sent!</h2>
        <p>{done}</p>
        <p className="intake-alt">
          <Link href="/">Back to home</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="intake-card intake-form" onSubmit={submit} noValidate>
      <p className="intake-desc">{INTAKE_FORM.description}</p>
      <p className="intake-required-note">
        <span className="req">*</span> Required
      </p>
      {sections.map((s) => (
        <section key={s.id} aria-labelledby={s.title ? `sec-${s.id}` : undefined}>
          {s.title && (
            <>
              <h2 className="intake-section-title" id={`sec-${s.id}`}>
                {s.title}
              </h2>
              {s.description && <p className="intake-desc">{s.description}</p>}
            </>
          )}
          {s.questions.map((q) => (
            <Question key={q.id} q={q} value={answers[q.id]} error={errors[q.id]} onChange={set} />
          ))}
        </section>
      ))}
      <button type="submit" className="btn btn-magenta" disabled={submitting}>
        {submitting ? "Sending…" : "Submit Request"}
      </button>
      {formError && (
        <p className="form-msg error" role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}

function Question({
  q,
  value,
  error,
  onChange,
}: {
  q: IntakeQuestion;
  value: string | string[] | undefined;
  error?: string;
  onChange: (id: string, v: string | string[]) => void;
}) {
  const id = `q-${q.id}`;
  const errId = `${id}-err`;
  const [first, ...rest] = q.label.split("\n");
  const label = (
    <>
      {first}
      {q.required && <span className="req"> *</span>}
      {rest.length > 0 && <span className="intake-q-sub">{rest.join(" ")}</span>}
    </>
  );
  const described = error ? errId : undefined;
  const err = error && (
    <p className="form-msg error intake-field-err" id={errId}>
      {error}
    </p>
  );

  if (q.type === "checkboxes" || q.type === "multiple_choice") {
    const multi = q.type === "checkboxes";
    const arr = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <fieldset className={`field intake-choice${error ? " has-error" : ""}`} aria-describedby={described}>
        <legend>{label}</legend>
        {q.options!.map((o, i) => (
          <label key={o} className="intake-option">
            <input
              id={i === 0 ? id : undefined}
              type={multi ? "checkbox" : "radio"}
              name={id}
              value={o}
              checked={arr.includes(o)}
              onChange={(e) =>
                onChange(
                  q.id,
                  multi ? (e.target.checked ? [...arr, o] : arr.filter((x) => x !== o)) : o
                )
              }
            />
            <span>{o}</span>
          </label>
        ))}
        {multi && !q.required && arr.length > 0 && (
          <button type="button" className="link-button intake-clear" onClick={() => onChange(q.id, [])}>
            Clear selection
          </button>
        )}
        {err}
      </fieldset>
    );
  }

  const common = {
    id,
    value: (value as string) ?? "",
    required: q.required,
    "aria-invalid": Boolean(error),
    "aria-describedby": described,
  };
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {q.type === "paragraph" ? (
        <textarea {...common} maxLength={2000} onChange={(e) => onChange(q.id, e.target.value)} />
      ) : (
        <input
          {...common}
          type={
            q.type === "date"
              ? "date"
              : q.type === "time"
                ? "time"
                : q.role === "email"
                  ? "email"
                  : q.role === "phone"
                    ? "tel"
                    : "text"
          }
          autoComplete={q.role === "name" ? "name" : q.role === "email" ? "email" : q.role === "phone" ? "tel" : "off"}
          maxLength={2000}
          onChange={(e) => onChange(q.id, e.target.value)}
        />
      )}
      {err}
    </div>
  );
}
