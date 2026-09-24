"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/intake/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) router.refresh();
    else setError(data?.error || "Login failed.");
  }

  return (
    <form className="intake-card intake-login" onSubmit={submit}>
      <div className="field">
        <label htmlFor="admin-pw">Password</label>
        <input
          id="admin-pw"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn btn-magenta" disabled={busy || !password}>
        {busy ? "Checking…" : "View Requests"}
      </button>
      {error && (
        <p className="form-msg error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
