import type { Metadata } from "next";
import EventsList from "../components/EventsList";
import { EVENTS } from "@/lib/data/events";

export const metadata: Metadata = { title: "Upcoming Events — Free Flow Fitness" };

export default function EventsPage() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">What&apos;s Happening</span>
          <h1 className="page-title">Upcoming Events</h1>
          <p>
            Body painting, paint &amp; pole, tattoo nights, vendor pop-ups, photo
            shoots, and more. Filter by type and grab your spot.
          </p>
        </div>

        <EventsList events={EVENTS} />
      </div>
    </main>
  );
}
