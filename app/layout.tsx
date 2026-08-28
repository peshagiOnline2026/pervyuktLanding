import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./redesign.css";

const poppins = Poppins({ variable: "--font-sans", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
// Script accent face, shared with the Peshagi landing page (self-hosted).
const shotflick = localFont({ src: "./fonts/ShotflickDemoRegular.ttf", variable: "--font-script", display: "swap" });

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
  return <html lang="en"><body className={`${poppins.variable} ${shotflick.variable}`}>{children}</body></html>;
}
