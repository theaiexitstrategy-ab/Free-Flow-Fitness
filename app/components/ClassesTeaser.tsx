import { WEEKLY_CLASSES } from "@/lib/classes";

// Weekly-class booking uses the studio's existing schedule system, which is a
// separate flow from party/private-lesson bookings. Point this at the real
// schedule URL when it's available; falls back to the Visit Us section.
const SCHEDULE_URL = process.env.NEXT_PUBLIC_CLASS_SCHEDULE_URL || "#visit";

export default function ClassesTeaser() {
  return (
    <section className="section" id="classes" style={{ background: "var(--charcoal)" }}>
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Weekly Classes</span>
          <h2>Your New Alternative To The Gym</h2>
          <p>
            Small group classes, talented instructors, real results. Sweat away
            the stress of your day, several times a week.
          </p>
        </div>

        <div className="class-grid">
          {WEEKLY_CLASSES.map((c) => (
            <div className="class-card" key={c.name}>
              <h4>{c.name}</h4>
              <p>{c.blurb}</p>
            </div>
          ))}
        </div>

        <div className="classes-cta">
          <a href={SCHEDULE_URL} className="btn btn-outline">
            See Full Schedule &amp; Book a Class
          </a>
        </div>
      </div>
    </section>
  );
}
