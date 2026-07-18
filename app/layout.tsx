import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Free Flow Fitness — Pole Fitness Studio, Bridgeton MO",
  description:
    "Come experience the sexy, flirty side of fitness. Pole & dance parties, private lessons, and weekly classes in Bridgeton, MO. Everyone welcome.",
  openGraph: {
    title: "Free Flow Fitness — Pole Fitness Studio, Bridgeton MO",
    description:
      "Book a party or a private lesson. Small-group pole & dance classes in Bridgeton, MO.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body>{children}</body>
    </html>
  );
}
