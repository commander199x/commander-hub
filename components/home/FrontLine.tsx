"use client";

import { useState } from "react";
import Link from "next/link";
import { Medal, Trophy } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { HOME_TEXT } from "./homeText";
import type { HomeData, Leader } from "./useHomeData";
import "@/app/cinematic.css";

const METAL: Record<number, string> = { 1: "#E8A63D", 2: "#C0C0C0", 3: "#CD7F32" };

function PodiumCard({ leader, rank }: { leader: Leader; rank: 1 | 2 | 3 }) {
  const first = rank === 1;
  const color = METAL[rank];
  const Icon = first ? Trophy : Medal;
  const avatar = first ? 96 : 76;
  const orderClass = rank === 1 ? "order-1 md:order-2" : rank === 2 ? "order-2 md:order-1" : "order-3";

  return (
    <Link
      href={`/profile/${encodeURIComponent(leader.name)}`}
      className={`cz-podium-link relative flex flex-1 flex-col items-center justify-end overflow-hidden px-6 pb-8 pt-8 text-center ${orderClass} ${first ? "md:min-h-[580px]" : "md:min-h-[470px]"}`}
      style={{
        flexBasis: 300,
        background: first ? `linear-gradient(180deg, rgba(232,166,61,0.16), ${C.panel} 70%)` : C.panel,
        border: `1px solid ${first ? C.amber : C.line}`,
        boxShadow: first ? "0 0 60px rgba(232,166,61,0.14)" : undefined,
        color: C.paper,
      }}
    >
      <span
        aria-hidden="true"
        className="cz-display absolute inset-x-0"
        style={{ bottom: -30, fontSize: 300, fontWeight: 700, lineHeight: 1, color: "transparent", WebkitTextStroke: `2px ${color}`, opacity: 0.22 }}
      >
        {rank}
      </span>

      <div className="relative flex flex-col items-center gap-1.5">
        <span role="img" aria-label={`#${rank}`} style={{ color, display: "inline-flex" }}>
          <Icon size={first ? 44 : 36} strokeWidth={1.8} />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={leader.avatarUrl || "/default-avatar.svg"}
          alt=""
          className="rounded-full object-cover"
          style={{ width: avatar, height: avatar, border: `2px solid ${color}` }}
        />
        <div className="cz-display mt-2 uppercase" style={{ fontSize: first ? 46 : 38, fontWeight: 700, lineHeight: 1.05, color: C.paper }}>
          {leader.name}
        </div>
        <div className="cz-display" style={{ fontSize: first ? 104 : 80, fontWeight: 700, lineHeight: 1, color: C.amber }}>
          {leader.rating}
        </div>
        <div className="text-xs uppercase tracking-[0.14em]" style={{ color: C.muted }}>
          {leader.wins}W · {leader.losses}L
        </div>
      </div>
    </Link>
  );
}

export default function FrontLine({ data }: { data: HomeData }) {
  const { locale } = useLanguage();
  const text = HOME_TEXT[locale === "ar" ? "ar" : "en"];
  const [view, setView] = useState<"team" | "ffa">("team");

  // Nothing ranked anywhere yet (e.g. right after a season reset): skip the section entirely.
  if (!data.loaded || (data.teamTop.length === 0 && data.ffaTop.length === 0)) return null;

  const list = view === "team" ? data.teamTop : data.ffaTop;

  const tab = (active: boolean) => ({
    minHeight: 44,
    padding: "0 20px",
    background: active ? C.amber : "transparent",
    color: active ? C.void : C.paper,
    border: `1px solid ${active ? C.amber : C.amberDim}`,
    fontSize: 12,
    fontWeight: active ? 700 : 400,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  });

  return (
    <section className="px-6 pb-24 pt-16 md:px-16">
      <div className="mx-auto max-w-[1312px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              {text.frontEyebrow}
            </div>
            <h2 className="cz-display mb-9 mt-2 uppercase" style={{ fontSize: "clamp(48px, 6vw, 76px)", fontWeight: 700, lineHeight: 1, color: C.paper }}>
              {text.frontTitle1}{" "}
              <span style={{ color: "transparent", WebkitTextStroke: `2px ${C.amber}` }}>{text.frontTitle2}</span>
            </h2>
          </div>

          <div className="mb-9 flex flex-wrap items-center gap-2">
            <button type="button" aria-pressed={view === "team"} onClick={() => setView("team")} style={tab(view === "team")}>
              {text.team}
            </button>
            <button type="button" aria-pressed={view === "ffa"} onClick={() => setView("ffa")} style={tab(view === "ffa")}>
              {text.ffa}
            </button>
            <Link href="/leaderboard" className="inline-flex min-h-[44px] items-center px-3 text-xs uppercase tracking-[0.14em]" style={{ color: C.amber }}>
              {text.fullBoard} →
            </Link>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="py-10 text-sm" style={{ color: C.muted }}>
            {text.frontEmpty}
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-5">
            {list.map((leader, i) => (
              <PodiumCard key={leader.name} leader={leader} rank={(i + 1) as 1 | 2 | 3} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
