import { PARTY_PACKAGES, type PackageId } from "@/lib/packages";

export default function PartyPackages({
  onBookParty,
}: {
  onBookParty: (id: PackageId) => void;
}) {
  return (
    <section className="section" id="parties">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Private Parties</span>
          <h2>No Matter The Occasion, We&apos;ve Got You</h2>
          <p>
            Our most popular reasons to party: birthdays, bachelorette parties,
            bridal showers, and girls&apos; night out. (As if anyone needs a
            reason.)
          </p>
        </div>

        <div className="party-gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/fab_flow_6girls.jpg"
            alt="A birthday group celebrating at Free Flow Fitness"
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ultimate_flow_party_crew.jpg"
            alt="A bachelorette party crew at Free Flow Fitness"
            loading="lazy"
          />
        </div>

        <div className="package-grid">
          {PARTY_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`package-card${pkg.featured ? " featured" : ""}`}
            >
              {pkg.tag && <span className="tag">{pkg.tag}</span>}
              <h3>{pkg.name}</h3>
              <div className="price">${pkg.price}</div>
              <ul>
                {pkg.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="deposit">
                {pkg.depositCents !== null ? (
                  <>
                    <strong>{pkg.depositLabel}</strong> holds your date
                  </>
                ) : (
                  <strong>Reserve by request</strong>
                )}
              </div>
              <button
                type="button"
                className="btn btn-magenta"
                onClick={() => onBookParty(pkg.id)}
              >
                {pkg.ctaLabel}
              </button>
            </div>
          ))}
        </div>

        <div className="addon-note">
          <strong>Add-ons:</strong> theme decorations (+$50), non-dance
          activities like raunchy bingo or amateur photo shoots, and BYOB —
          bring your own wine, canned drinks, or jell-o shots. Ask about
          anything not listed here.
        </div>
      </div>
    </section>
  );
}
