import { STUDENT_OF_WEEK } from "@/lib/data/studentOfWeek";

export default function StudentOfWeek() {
  const s = STUDENT_OF_WEEK;
  const hasPhoto = !s.photo.includes("TODO");

  return (
    <section className="section" id="student-of-week">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">{s.weekOf}</span>
          <h2>Student Of The Week</h2>
        </div>
        <div className="sotw-card">
          <div className="sotw-photo">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photo} alt={s.name} loading="lazy" />
            ) : (
              <div className="img-placeholder">Photo TODO · 800×800</div>
            )}
          </div>
          <div className="sotw-body">
            <h3>{s.name}</h3>
            <p>{s.blurb}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
