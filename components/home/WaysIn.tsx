"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LadderArt, ReplayArt, BracketArt } from "./PosterArt";
import { HOME_TEXT } from "./homeText";
import "@/app/cinematic.css";

const CORNERS = [
  "top-2 left-2 border-t border-l",
  "top-2 right-2 border-t border-r",
  "bottom-2 left-2 border-b border-l",
  "bottom-2 right-2 border-b border-r",
];

export default function WaysIn() {
  const { locale } = useLanguage();
  const text = HOME_TEXT[locale === "ar" ? "ar" : "en"];

  const cards = [
    { href: "/leaderboard", art: <LadderArt />, ...text.ways[0] },
    { href: "/replays", art: <ReplayArt />, ...text.ways[1] },
    { href: "/tournaments", art: <BracketArt />, ...text.ways[2] },
  ];

  return (
    <section className="px-6 pb-10 pt-20 md:px-16 md:pt-24">
      <div className="mx-auto max-w-[1312px]">
        <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
          {text.waysEyebrow}
        </div>
        <h2 className="cz-display mb-9 mt-2 uppercase" style={{ fontSize: "clamp(48px, 6vw, 76px)", fontWeight: 700, lineHeight: 1, color: C.paper }}>
          {text.waysTitle}
        </h2>

        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" }}>
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="cz-card cz-poster group relative block"
              style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.paper }}
            >
              {CORNERS.map((pos) => (
                <span
                  key={pos}
                  aria-hidden="true"
                  className={`pointer-events-none absolute z-[2] h-3 w-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${pos}`}
                  style={{ borderColor: C.amber }}
                />
              ))}

              <div className="relative overflow-hidden" style={{ aspectRatio: "4 / 3", borderBottom: `1px solid ${C.line}` }}>
                <div className="cz-poster-art absolute inset-0">{card.art}</div>
                <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(18,21,14,0) 55%, ${C.panel} 100%)` }} />
                <span
                  aria-hidden="true"
                  className="cz-display absolute bottom-1 start-5"
                  style={{ fontSize: 84, fontWeight: 700, lineHeight: 1, color: C.amber }}
                >
                  {card.n}
                </span>
              </div>

              <div className="px-6 pb-7 pt-5">
                <h3 className="cz-display uppercase" style={{ fontSize: 32, fontWeight: 600, color: C.paper }}>
                  {card.title}
                </h3>
                <p className="mb-4 mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
                  {card.desc}
                </p>
                <span className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: C.amber }}>
                  {card.cta}
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
