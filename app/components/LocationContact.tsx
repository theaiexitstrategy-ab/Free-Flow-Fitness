const STUDIO_PHONE = "314-625-2323";
const ADDRESS = "11726 St Charles Rock Rd Ste A, Bridgeton, MO 63044";

export default function LocationContact() {
  return (
    <section className="location" id="visit">
      <div className="wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="brand-banner"
          src="/images/FFF-Banner-merp.png"
          alt="Free Flow Fitness"
        />
        <span className="eyebrow">Visit The Studio</span>
        <h2>Come See Us</h2>
        <p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(ADDRESS)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ADDRESS}
          </a>
        </p>
        <p>
          <a href={`tel:${STUDIO_PHONE.replace(/[^0-9]/g, "")}`}>
            {STUDIO_PHONE}
          </a>
        </p>
        <p style={{ maxWidth: 560, margin: "18px auto 0" }}>
          Our mission is to create a safe place to empower women, promote body
          confidence and self-care, and help you fall in love with fitness.
        </p>
      </div>
    </section>
  );
}
