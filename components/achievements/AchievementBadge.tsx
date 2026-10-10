"use client";

import { Lock } from "lucide-react";
import { C } from "@/lib/theme";
import { TIER_COLORS, type AchievementDef } from "@/lib/achievements";

const CSS = `
@keyframes czach-shine { from { transform: translateX(-130%) skewX(-20deg); } to { transform: translateX(230%) skewX(-20deg); } }
@keyframes czach-spin { to { transform: rotate(360deg); } }
.czach { position: relative; overflow: hidden; transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
.czach.on:hover { transform: translateY(-3px); }
.czach.on::after { content: ""; position: absolute; inset: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent); transform: translateX(-130%) skewX(-20deg); }
.czach.on:hover::after { animation: czach-shine 0.9s ease; }
.czach-legend { animation: czach-spin 6s linear infinite; }
@media (prefers-reduced-motion: reduce) { .czach.on:hover { transform: none; } .czach.on:hover::after, .czach-legend { animation: none !important; } }
`;

// One achievement tile: shield emblem in the tier colour, name, rule, and progress or unlock date.
export default function AchievementBadge({ def, unlockedAt, have, rarity, lang }: { def: AchievementDef; unlockedAt: string | null; have: number; rarity: number | null; lang: "en" | "ar" }) {
  const on = unlockedAt !== null; // "" = unlocked but no saved date yet
  const t = TIER_COLORS[def.tier];
  const [name, desc] = def[lang];
  const Icon = def.icon;
  const pct = Math.min(1, have / def.need);
  return (
    <div className={`czach ${on ? "on" : ""} flex h-full flex-col border p-4`} style={{ background: on ? `linear-gradient(160deg, ${t.glow.replace(/[\d.]+\)$/, "0.14)")}, #12150E 62%)` : C.panel, borderColor: on ? t.main + "88" : C.line }}>
      <style>{CSS}</style>
      <div className="flex items-start justify-between gap-2">
        <span className="relative inline-flex h-14 w-12 shrink-0 items-center justify-center" aria-hidden="true">
          {def.tier === "legendary" && on && <span className="czach-legend absolute -inset-1.5 rounded-full" style={{ background: `conic-gradient(from 0deg, ${C.amber}, transparent 35%, ${C.radar} 55%, transparent 80%, ${C.amber})`, opacity: 0.55 }} />}
          <svg viewBox="0 0 48 56" className="absolute inset-0 h-full w-full">
            <path d="M24 2 L44 10 V28 C44 41 35 50 24 54 C13 50 4 41 4 28 V10 Z" fill={on ? t.main : "#1C2114"} stroke={on ? t.main : C.lineStrong} strokeWidth="2" opacity={on ? 0.22 : 1} />
            <path d="M24 2 L44 10 V28 C44 41 35 50 24 54 C13 50 4 41 4 28 V10 Z" fill="none" stroke={on ? t.main : C.lineStrong} strokeWidth="2" />
          </svg>
          {on ? <Icon size={20} style={{ color: t.main, position: "relative", filter: `drop-shadow(0 0 6px ${t.glow})` }} /> : <Lock size={16} style={{ color: C.muted, position: "relative" }} />}
        </span>
        <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: on ? t.main : C.muted, fontFamily: "var(--font-mono), monospace", fontWeight: 700 }}>{t[lang]}</span>
      </div>
      <div className="mt-3 text-sm leading-tight" style={{ color: on ? C.paper : C.muted, fontWeight: 700 }}>{name}</div>
      <div className="mt-1 flex-1 text-xs leading-snug" style={{ color: C.muted }}>{desc}</div>
      {on ? (
        <div className="mt-3 text-[11px]" style={{ color: t.main, fontFamily: "var(--font-mono), monospace" }}>
          ✓ {unlockedAt ? new Date(unlockedAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : lang === "ar" ? "مفتوح" : "Unlocked"}
        </div>
      ) : def.need > 1 ? (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] tabular-nums" style={{ color: C.muted }}><span>{Math.min(have, def.need)}/{def.need}</span><span>{Math.round(pct * 100)}%</span></div>
          <div className="mt-1 h-1" style={{ background: C.line }} dir="ltr"><div className="h-full" style={{ width: `${pct * 100}%`, background: t.main + "aa" }} /></div>
        </div>
      ) : null}
      {rarity !== null && (
        <div className="mt-2 text-[10px]" style={{ color: C.muted }}>{lang === "ar" ? `يملكه ${rarity}% من القادة` : `${rarity}% of commanders`}</div>
      )}
    </div>
  );
}
