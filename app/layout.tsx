import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import BookingProvider from "./components/BookingProvider";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StatusBanner from "./components/StatusBanner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const FALLBACK_SITE_URL = "https://free-flow-fitness.vercel.app";

// Resolve a guaranteed-valid absolute URL. A malformed NEXT_PUBLIC_SITE_URL
// (e.g. missing the https:// scheme) must NOT crash the build via new URL(),
// so we normalize + guard and fall back if it can't be parsed.
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProto).toString().replace(/\/$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

const SITE_URL = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Free Flow Fitness — Pole Fitness Studio, Bridgeton MO",
  description:
    "Come experience the sexy, flirty side of fitness. Pole & dance parties, private lessons, and weekly classes in Bridgeton, MO. Everyone welcome.",
  openGraph: {
    title: "Free Flow Fitness — Pole Fitness Studio, Bridgeton MO",
    description:
      "Book a party or a private lesson. Small-group pole & dance classes in Bridgeton, MO.",
    type: "website",
    url: SITE_URL,
    siteName: "Free Flow Fitness",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Flow Fitness — Pole Fitness Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Flow Fitness — Pole Fitness Studio, Bridgeton MO",
    description:
      "Book a party or a private lesson. Small-group pole & dance classes in Bridgeton, MO.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body>
        <BookingProvider>
          <StatusBanner />
          <Header />
          {children}
          <Footer />
        </BookingProvider>
      </body>
    </html>
  );
}
