"use client";

import { useEffect, useState } from "react";

// Shows a confirmation/cancel banner when the customer returns from Stripe
// Checkout. The portal sets success_url / cancel_url to:
//   {site}/?booking=success   and   {site}/?booking=cancelled
export default function StatusBanner() {
  const [status, setStatus] = useState<"success" | "cancelled" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b = params.get("booking");
    if (b === "success" || b === "cancelled") {
      setStatus(b);
      // Clean the URL so a refresh doesn't re-show it.
      const url = new URL(window.location.href);
      url.searchParams.delete("booking");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  if (!status) return null;

  const isSuccess = status === "success";
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 76,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        maxWidth: 560,
        width: "calc(100% - 32px)",
        padding: "14px 18px",
        borderRadius: 8,
        fontSize: "0.92rem",
        border: `1px solid ${isSuccess ? "rgba(127,227,176,0.5)" : "var(--line)"}`,
        background: isSuccess ? "rgba(127,227,176,0.12)" : "var(--charcoal-2)",
        color: isSuccess ? "#c8f7df" : "var(--muted)",
      }}
      onClick={() => setStatus(null)}
    >
      {isSuccess
        ? "🎉 Deposit received — your date is locked! Watch your phone for a confirmation text from Free Flow Fitness."
        : "No worries — your deposit wasn't charged. Pick up where you left off whenever you're ready."}
    </div>
  );
}
