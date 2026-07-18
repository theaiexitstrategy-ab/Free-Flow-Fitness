export default function Hero({
  onBookLesson,
}: {
  onBookLesson: () => void;
}) {
  return (
    <section className="hero">
      <div className="wrap">
        {/* cobalt-blue logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-logo"
          src="/logos/ff-cobalt.png"
          alt="Free Flow Pole Fitness Studio"
        />
        <h1>Come experience the sexy, flirty side of fitness.</h1>
        <p className="lede">
          Challenge yourself to find a strength you didn&apos;t know you had —
          small group pole and dance classes in Bridgeton, MO.
        </p>
        <div className="hero-ctas">
          <a href="#parties" className="btn btn-magenta">
            Book a Party
          </a>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onBookLesson}
          >
            Book a Private Lesson
          </button>
        </div>
        <p className="hero-inclusive">
          Everyone is welcome — no matter your shape, size, race, gender
          identity, or athletic ability.
        </p>
      </div>
    </section>
  );
}
