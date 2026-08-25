import type { Metadata } from "next";
import { Newsreader, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ variable: "--font-sans", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const newsreader = Newsreader({ variable: "--font-serif", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "PARVYUKT — Healing The Healthy Way",
  description: "India’s vertically integrated medicinal mushroom wellness platform—from Himalayan farms to evidence-led daily wellbeing.",
  icons: { icon: "/pervyukt-emblem.png", shortcut: "/pervyukt-emblem.png" },
  openGraph: {
    title: "PARVYUKT — Healing The Healthy Way",
    description: "From Himalayan farms to your daily life.",
    type: "website",
    images: [{ url: "/og.png", width: 1729, height: 910, alt: "PARVYUKT — Healing The Healthy Way" }],
  },
  twitter: { card: "summary_large_image", title: "PARVYUKT — Healing The Healthy Way", description: "From Himalayan farms to your daily life.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${poppins.variable} ${newsreader.variable}`}>{children}</body></html>;
}
