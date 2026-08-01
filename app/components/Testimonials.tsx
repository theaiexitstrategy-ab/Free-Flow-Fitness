import { TESTIMONIALS } from "@/lib/data/testimonials";

export default function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="section testimonials-section" id="testimonials">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Kind Words</span>
          <h2>What Our Students Say</h2>
        </div>
        <div className="testimonial-grid">
          {TESTIMONIALS.map((t) => (
            <blockquote className="testimonial" key={t.id}>
              <p>&ldquo;{t.quote}&rdquo;</p>
              <cite>
                — {t.author}
                {t.context && <span className="testimonial-context">, {t.context}</span>}
              </cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
