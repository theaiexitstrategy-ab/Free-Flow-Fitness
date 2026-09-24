import type { Metadata } from "next";
import Link from "next/link";
import IntakeFormFallback from "../_components/IntakeFormFallback";
import { INTAKE_FORM } from "@/lib/intake/form";

export const metadata: Metadata = { title: "Party Request Form — Free Flow Fitness" };

export default function IntakeFormPage() {
  return (
    <main className="page intake-page">
      <div className="wrap intake-wrap">
        <span className="eyebrow">Party Request</span>
        <h1 className="page-title">{INTAKE_FORM.title}</h1>
        <p className="intake-alt intake-alt-top">
          <Link href="/intake">← Prefer to chat instead?</Link>
        </p>
        <IntakeFormFallback />
      </div>
    </main>
  );
}
