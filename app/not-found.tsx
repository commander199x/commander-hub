"use client";

import Link from "next/link";
import { Home, Trophy, Radio } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const TEXT = {
  en: { eyebrow: "Signal lost", title: "Target not found", text: "This page was moved, destroyed, or never existed. Fall back to a known position.", home: "Back to base", board: "Leaderboard" },
  ar: { eyebrow: "انقطعت الإشارة", title: "الهدف غير موجود", text: "هذه الصفحة نُقلت أو دُمّرت أو لم تكن موجودة أصلاً. عُد إلى موقع معروف.", home: "العودة للقاعدة", board: "لوحة الصدارة" },
};

const CSS = `
@keyframes cz404-sweep { to { transform: rotate(360deg); } }
@keyframes cz404-glitch { 0%, 92%, 100% { transform: none; text-shadow: none; } 93% { transform: translate(-3px, 1px); text-shadow: 3px 0 #8FBF4F, -3px 0 #E8A63D; } 95% { transform: translate(3px, -1px); text-shadow: -3px 0 #8FBF4F, 3px 0 #E8A63D; } 97% { transform: none; } }
@keyframes cz404-blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
.cz404-sweep { animation: cz404-sweep 3.5s linear infinite; }
.cz404-glitch { animation: cz404-glitch 4s steps(1) infinite; }
.cz404-blink { animation: cz404-blink 1.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .cz404-sweep, .cz404-glitch, .cz404-blink { animation: none !important; } }
`;

export default function NotFound() {
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  return (
    <main className="flex min-h-[calc(100vh-var(--cz-header-h,64px))] w-full items-center justify-center px-6 py-16" style={{ background: C.void, color: C.paper }}>
      <style>{CSS}</style>
      <div className="grid w-full max-w-5xl items-center gap-12 md:grid-cols-[auto_1fr]">
        <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-full" style={{ border: `1px solid rgba(143,191,79,0.45)` }} aria-hidden="true">
          {[20, 40].map((p) => <div key={p} className="absolute rounded-full" style={{ inset: `${p}%`, border: `1px solid ${C.line}` }} />)}
          <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: C.line }} />
          <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: C.line }} />
          <div className="cz404-sweep absolute inset-0" style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 290deg, rgba(143,191,79,0.4) 360deg)" }} />
          <span className="cz404-blink absolute h-3 w-3 rounded-full" style={{ left: "62%", top: "30%", background: "#F87171", boxShadow: "0 0 14px #F87171" }} />
        </div>
        <div className="text-center md:text-start">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: "#F87171" }}>
            <Radio size={14} aria-hidden="true" />
            {tx.eyebrow}
          </div>
          <div className="cz404-glitch cz-display mt-2 leading-none" style={{ fontSize: "clamp(6rem, 18vw, 11rem)", color: C.amber, fontWeight: 700 }} aria-hidden="true">404</div>
          <h1 className="cz-display text-4xl uppercase md:text-5xl" style={{ fontWeight: 700 }}>{tx.title}</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed md:mx-0 mx-auto" style={{ color: C.muted }}>{tx.text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href="/" className="inline-flex min-h-[52px] items-center gap-2 px-6 text-sm uppercase tracking-[0.12em]" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
              <Home size={16} aria-hidden="true" />
              {tx.home}
            </Link>
            <Link href="/leaderboard" className="inline-flex min-h-[52px] items-center gap-2 border px-6 text-sm uppercase tracking-[0.12em] transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}>
              <Trophy size={16} aria-hidden="true" />
              {tx.board}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
