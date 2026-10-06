"use client";

import Link from "next/link";
import { useLive } from "@/lib/live";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Pulsing red LIVE pill for the header. Renders nothing while offline.
export default function LiveBadge() {
  const { live } = useLive();
  const { locale } = useLanguage();
  if (!live) return null;
  return (
    <Link
      href="/live"
      className="czlive-pill inline-flex min-h-[36px] shrink-0 items-center gap-2 px-3 text-[11px] uppercase tracking-[0.18em] text-white"
      style={{ background: "#DC2626", fontWeight: 800 }}
      aria-label={locale === "ar" ? "نحن في بث مباشر على تيك توك" : "We're live on TikTok"}
    >
      <style>{`@keyframes czlive-ring { 0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); } 100% { box-shadow: 0 0 0 12px rgba(220,38,38,0); } } @keyframes czlive-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } } .czlive-pill { animation: czlive-ring 1.6s ease-out infinite; } .czlive-dot { animation: czlive-dot 1s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .czlive-pill, .czlive-dot { animation: none !important; } }`}</style>
      <span className="czlive-dot inline-block h-2 w-2 rounded-full bg-white" aria-hidden="true" />
      {locale === "ar" ? "مباشر" : "Live"}
    </Link>
  );
}
