"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ALL_QUESTIONS,
  activeQuestions,
  formatAnswer,
  type IntakeQuestion,
} from "@/lib/intake/form";

// Mirrors lib/intake/db.ts (which is server-only).
const STATUSES = ["new", "contacted", "done"] as const;
type Status = (typeof STATUSES)[number];
interface Row {
  id: string;
  created_at: string;
  answers: Record<string, string | string[]>;
  transcript: { role: "user" | "assistant"; content: string }[] | null;
  status: Status;
  source: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

const byType = (t: IntakeQuestion["type"]) => ALL_QUESTIONS.find((q) => q.type === t);
const BRANCH_Q = ALL_QUESTIONS.find((q) => q.branch); // "Type of party"
const DATE_Q = byType("date");

const fmtTs = (s: string) =>
  new Date(s).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function ResponsesDashboard({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );
  const open = rows.find((r) => r.id === openId) || null;

  async function setStatus(id: string, status: Status) {
    const prev = rows;
    setSaveError(null);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const res = await fetch(`/api/intake/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res?.ok) {
      setRows(prev);
      setSaveError(res?.status === 401 ? "Session expired — please log in again." : "Couldn't save status.");
    }
  }

  async function logout() {
    await fetch("/api/intake/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="responses">
      <div className="responses-bar">
        <label className="responses-filter">
          <span>Show</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Status | "all")}>
            <option value="all">All ({rows.length})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s} ({rows.filter((r) => r.status === s).length})
              </option>
            ))}
          </select>
        </label>
        <div className="responses-actions">
          <a className="btn btn-magenta btn-sm" href="/api/intake/admin/export">
            Export CSV
          </a>
          <button type="button" className="btn btn-outline btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
      {saveError && (
        <p className="form-msg error" role="alert">
          {saveError}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="page-note">No requests{filter !== "all" ? ` marked “${filter}”` : ""} yet.</p>
      ) : (
        <table className="responses-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Name</th>
              <th>{BRANCH_Q ? "Type" : "Contact"}</th>
              <th>{DATE_Q ? "Requested" : ""}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} onClick={() => setOpenId(r.id)} className={`st-${r.status}`}>
                <td data-label="Submitted">{fmtTs(r.created_at)}</td>
                <td data-label="Name">
                  <button type="button" className="link-button" onClick={() => setOpenId(r.id)}>
                    {r.name || "(no name)"}
                  </button>
                </td>
                <td data-label="Type">
                  {BRANCH_Q ? formatAnswer(BRANCH_Q, r.answers[BRANCH_Q.id]) : r.email || r.phone}
                </td>
                <td data-label="Requested">{DATE_Q ? formatAnswer(DATE_Q, r.answers[DATE_Q.id]) : ""}</td>
                <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                  <StatusSelect value={r.status} onChange={(s) => setStatus(r.id, s)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <div className="modal-overlay" onClick={() => setOpenId(null)}>
          <div
            className="modal responses-detail"
            role="dialog"
            aria-modal="true"
            aria-label={`Request from ${open.name || "unknown"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" aria-label="Close" onClick={() => setOpenId(null)}>
              ×
            </button>
            <h3>{open.name || "(no name)"}</h3>
            <p className="modal-sub">
              {fmtTs(open.created_at)} · via {open.source === "form" ? "form" : "chat"}
            </p>
            <div className="field">
              <label htmlFor="detail-status">Status</label>
              <StatusSelect id="detail-status" value={open.status} onChange={(s) => setStatus(open.id, s)} />
            </div>
            <dl className="responses-answers">
              {activeQuestions(open.answers).map((q) => (
                <div key={q.id}>
                  <dt>{q.label.split("\n")[0]}</dt>
                  <dd>{formatAnswer(q, open.answers[q.id]) || "—"}</dd>
                </div>
              ))}
            </dl>
            {open.transcript && open.transcript.length > 0 && (
              <details className="responses-transcript">
                <summary>Chat transcript ({open.transcript.length} messages)</summary>
                {open.transcript.map((m, i) => (
                  <div key={i} className={`bubble bubble-${m.role}`}>
                    {m.content}
                  </div>
                ))}
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: Status;
  onChange: (s: Status) => void;
}) {
  return (
    <select
      id={id}
      className={`status-select st-${value}`}
      value={value}
      aria-label={id ? undefined : "Status"}
      onChange={(e) => onChange(e.target.value as Status)}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
