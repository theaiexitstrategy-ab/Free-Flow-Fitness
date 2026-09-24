import type { Metadata } from "next";
import { Suspense } from "react";
import BookFlow from "./_components/BookFlow";

export const metadata: Metadata = {
  title: "Book a Party — Free Flow Fitness",
  description: "Pick your party, date and time, and hold it with a deposit. Pole & dance parties in Bridgeton, MO.",
};

export default function BookPage() {
  return (
    <main className="page book-page">
      <div className="wrap book-wrap">
        <span className="eyebrow">Book a Party</span>
        <h1 className="page-title">Let&apos;s Get This Party Started</h1>
        <p className="page-note">
          Pick your package, grab an open date and time, and hold it with a deposit — all in a couple of minutes.
        </p>
        <Suspense fallback={null}>
          <BookFlow />
        </Suspense>
      </div>
    </main>
  );
}
