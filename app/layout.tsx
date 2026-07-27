import type { Metadata } from "next";
import { Oswald, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { C } from "@/lib/theme";
import "./globals.css";
import "./tactical.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

// TODO: replace with your real production domain once you have one
const SITE_URL = "https://your-domain.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Commander | Generals Zero Hour Community",
    template: "%s | Commander",
  },
  description:
    "Replays, maps, mods, videos and tournaments for the Generals Zero Hour community.",
  openGraph: {
    title: "Commander | Generals Zero Hour Community",
    description:
      "Replays, maps, mods, videos and tournaments for the Generals Zero Hour community.",
    images: ["/images/banner.png"],
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${oswald.variable} ${jetbrainsMono.variable}`}
        style={{ background: C.void, color: C.paper, fontFamily: "var(--font-mono), monospace" }}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}