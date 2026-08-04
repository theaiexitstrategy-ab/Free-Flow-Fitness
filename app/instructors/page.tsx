import type { Metadata } from "next";
import { INSTRUCTORS } from "@/lib/data/instructors";

export const metadata: Metadata = { title: "Instructors — Free Flow Fitness" };

export default function InstructorsPage() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Meet The Team</span>
          <h1 className="page-title">Instructors</h1>
          <p>The women who&apos;ll help you find a strength you didn&apos;t know you had.</p>
        </div>

        <div className="instructor-grid">
          {INSTRUCTORS.map((i) => {
            const comingSoon = i.photo === "COMING_SOON";
            const hasPhoto = !comingSoon && !i.photo.includes("TODO");
            const isOwner = i.title.toLowerCase().includes("owner");
            return (
              <article className="instructor-card" key={i.id}>
                <div className="instructor-photo">
                  {hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.photo} alt={i.name} loading="lazy" />
                  ) : comingSoon ? (
                    <div className="coming-soon">
                      <span>Photo<br />Coming Soon</span>
                    </div>
                  ) : (
                    <div className="img-placeholder">Photo TODO · 800×1000</div>
                  )}
                </div>
                <div className="instructor-body">
                  <h3 className="instructor-name">
                    {i.name}
                    {i.pronouns && <span className="pronouns"> ({i.pronouns})</span>}
                    {isOwner && <span className="badge badge-owner">Owner</span>}
                  </h3>
                  <div className="instructor-title">{i.title}</div>
                  {i.certifications.length > 0 && (
                    <div className="cert-badges">
                      {i.certifications.map((c) => (
                        <span className="badge badge-cert" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="instructor-bio">{i.bio}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
