import type { Metadata } from "next";
import Link from "next/link";
import PartyRequestButton from "../components/PartyRequestButton";
import { PARTY_PACKAGES, formatCents } from "@/lib/packages";
import { PARTY_TYPES, PARTY_ADDONS, PARTY_POLICIES } from "@/lib/data/parties";

export const metadata: Metadata = { title: "Private Parties — Free Flow Fitness" };

export default function PartiesPage() {
  return (
    <main>
      {/* ── redesigned banner (real photo background + overlay) ── */}
      <section className="party-banner has-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="party-banner-bg" src="/images/group-banner-wide.jpg" alt="" aria-hidden="true" />
        <div className="wrap party-banner-inner">
          <span className="eyebrow">Private Parties</span>
          <h1>Come Party With Us</h1>
          <p>
            Birthdays, bachelorettes, ladies&apos; nights, and every reason to
            celebrate — pick a package and we&apos;ll handle the rest.
          </p>
          <PartyRequestButton label="Request a Party" className="btn btn-magenta btn-lg" />
        </div>
      </section>

      {/* ── party types ───────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">No Matter The Occasion</span>
            <h2>We&apos;ve Got You</h2>
          </div>
          <div className="party-type-grid">
            {PARTY_TYPES.map((t) => (
              <div className="party-type" key={t.name}>
                <h3>{t.name}</h3>
                <p>{t.blurb}</p>
              </div>
            ))}
          </div>

          <div className="party-gallery" style={{ marginTop: 44, marginBottom: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/party-group.jpg" alt="A party group celebrating at Free Flow Fitness" loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/studio-interior.jpg" alt="Inside the Free Flow Fitness studio" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ── packages ──────────────────────────────────────── */}
      <section className="section" id="packages" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Party Packages</span>
            <h2>Pick Your Package</h2>
            <p>Every package books with a quick request — we confirm your date and deposit.</p>
          </div>

          <div className="package-grid">
            {PARTY_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`package-card${pkg.featured ? " featured" : ""}${pkg.draft ? " draft" : ""}`}
              >
                {pkg.tag && (
                  <span className={`tag${pkg.draft ? " tag-draft" : ""}`}>{pkg.tag}</span>
                )}
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
                      <strong>{formatCents(pkg.depositCents)} deposit</strong> holds your date
                    </>
                  ) : (
                    <strong>Reserve by request</strong>
                  )}
                </div>
                <PartyRequestButton
                  pkg={pkg.id}
                  label={pkg.draft ? "Request This Party" : pkg.ctaLabel}
                  className="btn btn-magenta"
                />
              </div>
            ))}
          </div>
          <p className="draft-note">
            Tiers marked <span className="tag tag-draft">Draft</span> are proposals awaiting
            Adrianne&apos;s approval — details/pricing are placeholders (see lib/packages.ts).
          </p>
        </div>
      </section>

      {/* ── add-ons + policies ────────────────────────────── */}
      <section className="section" style={{ background: "var(--charcoal)", paddingTop: 60 }}>
        <div className="wrap party-details">
          <div>
            <h2 className="details-title">Add-Ons</h2>
            <ul className="details-list">
              {PARTY_ADDONS.map((a) => (
                <li key={a.label}>
                  <strong>{a.label}:</strong> {a.detail}
                </li>
              ))}
              <li className="muted">Ask about anything not listed here.</li>
            </ul>
          </div>
          <div>
            <h2 className="details-title">Good To Know</h2>
            <ul className="details-list">
              {PARTY_POLICIES.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── how to book (links "Party Packages" to the request form) ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">How To Book</span>
            <h2>Three Easy Steps</h2>
          </div>
          <ol className="steps">
            <li>
              Choose your{" "}
              <PartyRequestButton label="Party Package" className="link-button" /> above.
            </li>
            <li>Send your request with your date, headcount, and details.</li>
            <li>We confirm availability and your deposit — then it&apos;s party time.</li>
          </ol>
        </div>
      </section>

      {/* ── party vs private class ─────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="private-class-cta">
            <div>
              <h3>Looking for a private class, not a party?</h3>
              <p>
                A <strong>private class</strong> is just your group in a regular
                class format — no party extras. Those book on the class page.
              </p>
            </div>
            <Link href="/classes" className="btn btn-outline">
              Book a Private Class
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
