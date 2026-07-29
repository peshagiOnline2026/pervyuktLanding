import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const manrope = Manrope({ variable: "--font-sans", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PARVYUKT — Healing The Healthy Way",
  description: "India’s vertically integrated medicinal mushroom wellness platform—from Himalayan farms to evidence-led daily wellbeing.",
  icons: { icon: "/pervyukt-emblem.png", shortcut: "/pervyukt-emblem.png" },
  openGraph: {
    title: "PARVYUKT — Healing The Healthy Way",
    description: "From Himalayan farms to your daily life.",
    type: "website",
    images: [{ url: "/hero.png", width: 1200, height: 630, alt: "PARVYUKT — Healing The Healthy Way" }],
  },
  twitter: { card: "summary_large_image", title: "PARVYUKT — Healing The Healthy Way", description: "From Himalayan farms to your daily life.", images: ["/hero.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${newsreader.variable}`}>
        {children}
        <Script src="https://supportly-delta.vercel.app/widget.js" data-workspace="testing" strategy="afterInteractive" />
      </body>
    </html>
  );
}
