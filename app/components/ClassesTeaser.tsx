import Link from "next/link";
import { WEEKLY_CLASSES } from "@/lib/classes";

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
          <Link href="/schedule" className="btn btn-outline">
            Check out our schedule
          </Link>
        </div>
      </div>
    </section>
  );
}
