import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Store — Free Flow Fitness" };

const SHOPS = [
  {
    name: "Printify Shop",
    blurb: "Free Flow merch, apparel & accessories — printed on demand.",
    url: SITE.printifyUrl,
  },
  {
    name: "Printful Shop",
    blurb: "More custom pieces, fulfilled and shipped by Printful.",
    url: SITE.printfulUrl,
  },
];

export default function StorePage() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Shop</span>
          <h1 className="page-title">Free Flow Store</h1>
          <p>Rep the studio. Every order is fulfilled and shipped by our print partners.</p>
        </div>

        <div className="shop-grid">
          {SHOPS.map((s) => {
            const ready = !s.url.startsWith("#TODO");
            return (
              <div className="shop-card" key={s.name}>
                <h2>{s.name}</h2>
                <p>{s.blurb}</p>
                {ready ? (
                  <a
                    className="btn btn-magenta"
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Shop {s.name.replace(" Shop", "")}
                  </a>
                ) : (
                  <span className="btn btn-outline is-disabled" aria-disabled="true">
                    Link coming soon
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/*
          Phase 5 decision (link-out vs. custom API):
          - Link-out (this scaffold): set NEXT_PUBLIC_PRINTIFY_URL / NEXT_PUBLIC_PRINTFUL_URL
            to Adrianne's hosted storefronts (Printify Pop-Up Store URL + Printful store).
            Simplest; the shops handle payment + fulfillment. No auth needed.
          - Custom API: pull products via Printify/Printful API tokens and check out via
            Stripe here. More work — only if a fully on-site store is required.
        */}
        <p className="draft-note">
          Store links are placeholders — drop the two shop URLs into the env vars (see
          lib/site.ts) to go live, or tell me if you want a fully on-site store instead.
        </p>
      </div>
    </main>
  );
}
