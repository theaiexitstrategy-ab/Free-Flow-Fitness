import type { Metadata } from "next";
import ScheduleCalendar from "../components/ScheduleCalendar";

export const metadata: Metadata = { title: "Class Schedule — Free Flow Fitness" };

export default function SchedulePage() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Classes</span>
          <h1 className="page-title">Class Schedule</h1>
          <p>Reserve your spot — small classes, max 7 per pole.</p>
        </div>
        <ScheduleCalendar />
      </div>
    </main>
  );
}
