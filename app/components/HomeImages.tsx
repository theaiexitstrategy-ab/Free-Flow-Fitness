// Home image band — real studio photos.
const SLOTS = [
  { src: "/images/class-session.jpg", label: "Small-group classes", alt: "A Free Flow Fitness class in session" },
  { src: "/images/class-duo.jpg", label: "Find your flow", alt: "Two dancers on the pole at Free Flow Fitness" },
  { src: "/images/community-group.jpg", label: "Everyone's welcome", alt: "A Free Flow Fitness class group" },
];

export default function HomeImages() {
  return (
    <section className="section home-images">
      <div className="wrap">
        <div className="home-images-grid">
          {SLOTS.map((s) => (
            <figure className="home-image" key={s.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} loading="lazy" />
              <figcaption>{s.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
