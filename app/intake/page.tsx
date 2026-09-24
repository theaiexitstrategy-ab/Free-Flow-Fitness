import type { Metadata } from "next";
import IntakeChat from "./_components/IntakeChat";

export const metadata: Metadata = {
  title: "Party Request — Free Flow Fitness",
  description: "Request a party or private group class at Free Flow Fitness — chat with our front desk assistant.",
};

export default function IntakePage() {
  return (
    <main className="page intake-page">
      <div className="wrap intake-wrap">
        <span className="eyebrow">Party Request</span>
        <h1 className="page-title">Let&apos;s Plan Your Party</h1>
        <p className="page-note">
          Answer a few quick questions and we&apos;ll get back to you. Requests are answered in order,
          as soon as possible.
        </p>
        <IntakeChat />
      </div>
    </main>
  );
}
