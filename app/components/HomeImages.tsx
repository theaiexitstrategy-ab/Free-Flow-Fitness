// Placeholder band for the refreshed Home images Adrianne will supply.
// Swap each placeholder for an <img> once files land in /public/images.
// Ideal dimensions noted on each tile.
const SLOTS = [
  { label: "Studio / class in action", dim: "1200×900" },
  { label: "Pole / dance moment", dim: "1200×900" },
  { label: "Community / group vibe", dim: "1200×900" },
];

export default function HomeImages() {
  return (
    <section className="section home-images">
      <div className="wrap">
        <div className="home-images-grid">
          {SLOTS.map((s) => (
            <div className="img-placeholder tall" key={s.label}>
              <span>{s.label}</span>
              <small>TODO image · {s.dim}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
