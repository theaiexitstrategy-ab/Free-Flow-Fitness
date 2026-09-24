"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { INTAKE_GREETING } from "@/lib/intake/form";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "ffs-intake-chat-v1";
const MAX_CHARS = 2000;

export default function IntakeChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore an in-progress conversation after a refresh (per-tab only).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.messages?.length) setMessages(saved.messages);
      if (saved?.done) setDone(saved.done);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, done }));
    } catch {}
  }, [messages, done]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, error, done]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || busy || done) return;
    setError(null);
    setDraft("");
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setBusy(true);
    setStreaming("");

    let reply = "";
    let failed: string | null = null;
    let submitted: string | null = null;
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "text") {
            reply += ev.text;
            setStreaming(reply);
          } else if (ev.type === "submitted") {
            submitted = ev.message;
          } else if (ev.type === "error") {
            failed = ev.error;
          }
        }
      }
    } catch (err) {
      failed = err instanceof Error ? err.message : "Something went wrong. Please try again.";
    }

    setStreaming(null);
    setBusy(false);
    if (reply.trim()) {
      setMessages([...history, { role: "assistant", content: reply.trim() }]);
    } else if (failed) {
      // Nothing came back — drop the unanswered message so they can resend it.
      setMessages(messages);
      setDraft(text);
    }
    if (submitted) setDone(submitted);
    if (failed) setError(failed);
    if (!submitted) setTimeout(() => inputRef.current?.focus(), 0);
  }

  function restart() {
    setMessages([]);
    setDone(null);
    setError(null);
    setDraft("");
  }

  return (
    <div className="intake-chat">
      <div className="intake-log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
        <div className="bubble bubble-assistant">{INTAKE_GREETING}</div>
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble-${m.role}`}>
            {m.content}
          </div>
        ))}
        {streaming !== null && (
          <div className="bubble bubble-assistant">
            {streaming || <span className="typing" aria-label="Assistant is typing"><i /><i /><i /></span>}
          </div>
        )}
        {done && (
          <div className="bubble bubble-done" role="status">
            <strong>Request sent!</strong>
            <br />
            {done}
          </div>
        )}
        {error && (
          <div className="bubble bubble-error" role="alert">
            {error}
          </div>
        )}
      </div>

      {done ? (
        <div className="intake-compose intake-compose-done">
          <button type="button" className="btn btn-outline" onClick={restart}>
            Start a new request
          </button>
        </div>
      ) : (
        <form className="intake-compose" onSubmit={send}>
          <label htmlFor="intake-input" className="sr-only">
            Your message
          </label>
          <textarea
            id="intake-input"
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MAX_CHARS}
            placeholder="Type your answer…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            disabled={busy}
            autoComplete="off"
          />
          <button type="submit" className="btn btn-magenta" disabled={busy || !draft.trim()}>
            Send
          </button>
        </form>
      )}

      <p className="intake-alt">
        <Link href="/intake/form">Prefer a regular form?</Link>
      </p>
    </div>
  );
}
