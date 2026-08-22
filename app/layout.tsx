import type { Metadata } from "next";
import { Oswald, JetBrains_Mono, Cairo, Tajawal } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { C } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";
import "./tactical.css";
import { Analytics } from "@vercel/analytics/next";

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

// Arabic-script fallbacks — swapped in via CSS ([dir="rtl"]) so both scripts
// look correct without a layout shift when toggling languages.
const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["500", "600", "700"],
  variable: "--font-display-ar",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-ar",
});

const SITE_URL = "https://commander.host";

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
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${oswald.variable} ${jetbrainsMono.variable} ${cairo.variable} ${tajawal.variable}`}
        style={{ background: C.void, color: C.paper, fontFamily: "var(--font-mono), monospace" }}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <Header />
          {children}
          <Analytics />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
