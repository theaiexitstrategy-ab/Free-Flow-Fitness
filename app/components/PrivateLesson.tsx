export default function PrivateLesson({
  onBookLesson,
}: {
  onBookLesson: () => void;
}) {
  return (
    <section className="section" id="private">
      <div className="wrap">
        <div className="private-lesson">
          <div className="private-lesson-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/adrianne_pole.jpg"
              alt="A Free Flow Fitness instructor on the pole"
              loading="lazy"
            />
          </div>
          <div className="private-lesson-body">
            <span className="eyebrow">1-on-1 Instruction</span>
            <h2>Learn At Your Own Pace</h2>
            <p>
              Want individual attention on technique, tricks, or a routine
              you&apos;re working toward? Book a private lesson with one of our
              instructors — no group, no waiting your turn.
            </p>
            {/*
              ⚠️ PRICING NOT FINALIZED — DO NOT SHIP A PRICE HERE.
              Private-lesson pricing has not been confirmed. This section
              intentionally shows NO price and routes to an inquiry/hold flow
              (no card is charged). When a real price is confirmed by the studio,
              update this section AND wire the deposit in the portal — until then
              leave this as request-only.
            */}
            <button
              type="button"
              className="btn btn-magenta"
              onClick={onBookLesson}
            >
              Book Your Private Lesson
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
