"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Map as MapIcon, Swords, BookOpen } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";

const TEXT = {
  en: { eyebrow: "War room", generals: "Generals meta", maps: "Maps", h2h: "Head-to-head", guides: "Guides" },
  ar: { eyebrow: "غرفة العمليات", generals: "ميتا الجنرالات", maps: "الخرائط", h2h: "مواجهة مباشرة", guides: "الأدلة" },
};

export const STATS_CSS = `
@keyframes czst-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes czst-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes czst-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.czst-in { animation: czst-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czst-bar { transform-origin: left; animation: czst-grow 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
[dir="rtl"] .czst-bar { transform-origin: right; }
.czst-line { stroke-dasharray: 1; animation: czst-draw 1.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
.czst-card { transition: transform 0.25s ease, border-color 0.25s ease; }
.czst-card:hover { transform: translateY(-4px); border-color: #8A6425 !important; }
.czst-cell { transition: transform 0.15s ease; }
.czst-cell:hover { transform: scale(1.15); position: relative; z-index: 2; }
@media (prefers-reduced-motion: reduce) {
  .czst-in, .czst-bar, .czst-line { animation: none !important; } .czst-line { stroke-dasharray: none; }
  .czst-card, .czst-cell { transition: none !important; } .czst-card:hover, .czst-cell:hover { transform: none !important; }
}
`;

export default function StatsShell({ title, sub, children, icon: Icon }: { title: string; sub: string; children: ReactNode; icon: typeof BarChart3 }) {
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  const path = usePathname() || "";
  const tabs = [
    { href: "/stats/generals", label: tx.generals, icon: BarChart3 },
    { href: "/stats/maps", label: tx.maps, icon: MapIcon },
    { href: "/stats/h2h", label: tx.h2h, icon: Swords },
    { href: "/guides", label: tx.guides, icon: BookOpen },
  ];
  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{STATS_CSS}</style>
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-8 pt-14 md:pt-20`}>
          <div className="czst-in flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Icon size={14} aria-hidden="true" />
            {tx.eyebrow}
          </div>
          <h1 className="czst-in cz-display mt-3 uppercase leading-[0.92]" style={{ fontSize: "clamp(2.6rem, 6.5vw, 5rem)", fontWeight: 700, animationDelay: "0.06s" }}>{title}</h1>
          <p className="czst-in mt-4 max-w-2xl text-base leading-relaxed" style={{ color: C.muted, animationDelay: "0.12s" }}>{sub}</p>
          <nav className="czst-in mt-8 flex gap-2 overflow-x-auto pb-1" aria-label={tx.eyebrow} style={{ animationDelay: "0.18s" }}>
            {tabs.map((t) => {
              const on = path.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]"
                  style={{ background: on ? C.amber : "transparent", color: on ? C.void : C.paper, borderColor: on ? C.amber : C.amberDim, fontWeight: on ? 700 : 500 }}
                >
                  <t.icon size={14} aria-hidden="true" />
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}

export function GeneralChip({ faction, label, color, size = "sm" }: { faction: string; label: string; color: string; size?: "sm" | "md" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border ${size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]"}`} style={{ borderColor: `${color}88`, color }}>
      <span className="font-bold tracking-widest">{faction}</span>
      <span style={{ color: C.paper }}>{label}</span>
    </span>
  );
}
