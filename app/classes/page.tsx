import type { Metadata } from "next";
import Accordion, { type AccordionItem } from "../components/Accordion";
import BookLessonButton from "../components/BookLessonButton";
import { WEEKLY_CLASSES } from "@/lib/classes";

export const metadata: Metadata = { title: "Class Descriptions — Free Flow Fitness" };

export default function ClassesPage() {
  const items: AccordionItem[] = WEEKLY_CLASSES.map((c) => ({
    id: c.id,
    title: c.name,
    content: (
      <>
        <p>{c.blurb}</p>
        {c.details && <p className="muted">{c.details}</p>}
      </>
    ),
  }));

  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Classes</span>
          <h1 className="page-title">Class Descriptions</h1>
          <p>Tap any class to see the details, then head to the schedule to book.</p>
        </div>

        <Accordion items={items} />

        <div className="private-class-cta">
          <div>
            <h3>Want the studio to yourselves?</h3>
            <p>
              Book a <strong>private class</strong> for your group — same great
              instruction, just your crew. (Looking to throw a party instead?{" "}
              <a href="/parties">See private parties.</a>)
            </p>
          </div>
          <BookLessonButton label="Book a Private Class" />
        </div>
      </div>
    </main>
  );
}
