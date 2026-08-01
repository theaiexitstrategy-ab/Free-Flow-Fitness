import type { Metadata } from "next";
import PageStub from "../components/PageStub";

export const metadata: Metadata = { title: "Class Schedule — Free Flow Fitness" };

export default function SchedulePage() {
  return (
    <PageStub
      eyebrow="Classes"
      title="Class Schedule"
      note="Coming in Phase 2 — live schedule (GloFox). TODO: schedule URL/embed."
    />
  );
}
