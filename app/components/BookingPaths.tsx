export default function BookingPaths({
  onBookLesson,
}: {
  onBookLesson: () => void;
}) {
  return (
    <section className="paths">
      <div className="wrap paths-grid">
        <div className="path-card">
          <h3>Throwing a Party?</h3>
          <p>
            Birthdays, bachelorettes, bridal showers, girls&apos; nights — pick
            a package below and we&apos;ll handle the rest.
          </p>
          <a href="#parties" className="btn btn-magenta">
            See Party Packages
          </a>
        </div>
        <div className="path-card">
          <h3>Want 1-on-1 Time?</h3>
          <p>
            Private instruction at your own pace, on your own schedule — no
            strangers, no pressure.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onBookLesson}
          >
            Book Private Instruction
          </button>
        </div>
      </div>
    </section>
  );
}
