"use client";

import { ArrowUpRight, Play, Radio } from "lucide-react";
import { C, DISCORD_URL, YOUTUBE_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import RadarScope from "./RadarScope";
import { HOME_TEXT } from "./homeText";
import type { HomeData } from "./useHomeData";
import "@/app/cinematic.css";

const GRID = "linear-gradient(rgba(39,43,30,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(39,43,30,0.55) 1px, transparent 1px)";

// Where the banner image sits in its frame. If the important part of your
// banner is cut off, change this (e.g. "left center", "center top", "30% 50%").
const BANNER_POSITION = "center center";

const CORNERS = [
  "top-2 left-2 border-t border-l",
  "top-2 right-2 border-t border-r",
  "bottom-2 left-2 border-b border-l",
  "bottom-2 right-2 border-b border-r",
];

export default function CinematicHero({ data }: { data: HomeData }) {
  const { locale } = useLanguage();
  const text = HOME_TEXT[locale === "ar" ? "ar" : "en"];
  const rtl = locale === "ar";

  const leaders = data.teamTop.map((l) => ({ name: l.name, rating: l.rating }));

  // Only show a stat once it has something to show — "0 matches" would hurt more than it helps.
  const stats = [
    { value: data.members, label: text.statPlayers },
    { value: data.matches, label: text.statMatches },
    { value: data.replays, label: text.statReplays },
  ].filter((s) => s.value > 0);

  const barStyle = {
    background: "#000",
    color: C.muted,
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: C.void,
        backgroundImage: `radial-gradient(ellipse 60% 70% at ${rtl ? "22%" : "78%"} 45%, rgba(143,191,79,0.13), transparent 62%), radial-gradient(ellipse 50% 50% at ${rtl ? "10%" : "90%"} 10%, rgba(232,166,61,0.14), transparent 60%), ${GRID}`,
        backgroundSize: "100% 100%, 100% 100%, 56px 56px, 56px 56px",
      }}
    >
      {/* Radar — on the right, large and cropped (large screens) */}
      <div
        className="pointer-events-none absolute hidden lg:block"
        style={{ insetInlineEnd: "-14%", top: 92, width: "min(52vw, 760px)", zIndex: 1 }}
      >
        <RadarScope uid="hero" leaders={leaders} />
      </div>

      {/* Keeps the text readable where it meets the radar */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background: `linear-gradient(${rtl ? "270deg" : "90deg"}, ${C.void} 0%, rgba(10,12,8,0.7) 45%, rgba(10,12,8,0) 72%), linear-gradient(0deg, ${C.void} 0%, rgba(10,12,8,0) 30%)`,
        }}
      />

      {/* Cinematic letterbox bars */}
      <div className="absolute inset-x-0 top-0 flex h-[38px] items-center justify-between px-6 md:px-16" style={{ ...barStyle, zIndex: 3 }}>
        <span>{text.barLeft}</span>
        <span className="inline-flex items-center gap-2">
          <span className="cz-blink inline-block h-1.5 w-1.5 rounded-full" style={{ background: C.radar }} />
          {text.barRight}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-[38px] items-center justify-between px-6 md:px-16" style={{ ...barStyle, zIndex: 3 }}>
        <span>{text.barScroll}</span>
        <span>{text.barLangs}</span>
      </div>

      <div className="relative mx-auto max-w-[1312px] px-6 pb-24 pt-[64px] md:px-16 md:pt-[110px]" style={{ zIndex: 2, minHeight: 760 }}>
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          {/* Banner image — on the left */}
          <figure
            className="cz-rise cz-d1 relative m-0 w-full shrink-0 overflow-hidden md:w-[280px] lg:w-[340px]"
            style={{ border: `1px solid ${C.lineStrong}`, background: C.panel }}
          >
            <div className="aspect-[16/9] md:aspect-[3/4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/banner.png"
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: BANNER_POSITION }}
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(10,12,8,0.15) 0%, rgba(10,12,8,0) 40%, rgba(10,12,8,0.7) 100%)" }}
            />
            {CORNERS.map((pos) => (
              <span key={pos} aria-hidden="true" className={`pointer-events-none absolute h-3 w-3 ${pos}`} style={{ borderColor: C.amber }} />
            ))}
          </figure>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="cz-rise cz-d1 flex items-center gap-2.5 text-xs uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <Radio size={14} />
              <span>{text.heroEyebrow}</span>
            </div>

            <h1 className="cz-display mt-5 uppercase" style={{ fontWeight: 700, lineHeight: 0.9 }}>
              <span className="cz-rise cz-d2 block" style={{ fontSize: "clamp(56px, 8.6vw, 124px)", color: C.paper }}>
                {text.heroLine1}
              </span>
              <span
                className="cz-rise cz-d3 mt-3 block"
                style={{ fontSize: "clamp(28px, 4.4vw, 64px)", lineHeight: 1, letterSpacing: "0.01em", color: C.amber }}
              >
                {text.heroJoin} <bdi dir="ltr">{text.heroTag}</bdi>
              </span>
            </h1>

            <p className="cz-rise cz-d4 mt-7 max-w-[500px] text-base leading-relaxed md:text-lg" style={{ color: C.paper }}>
              {text.heroSub}
            </p>

            <div className="cz-rise cz-d5 mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[58px] items-center gap-2.5 px-8 text-sm font-bold uppercase tracking-[0.12em]"
                style={{ background: C.amber, color: C.void, boxShadow: "0 0 34px rgba(232,166,61,0.32)" }}
              >
                {text.joinClan}
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.paper }}
              >
                <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full" style={{ background: "#CC0000" }}>
                  <Play size={14} color="#fff" fill="#fff" />
                </span>
                {text.watchLatest}
              </a>
            </div>

            {stats.length > 0 && (
              <div
                className="cz-rise cz-d5 mt-14 flex max-w-[640px] flex-wrap gap-x-0 gap-y-4 pt-6 md:mt-16"
                style={{ borderTop: `1px solid ${C.lineStrong}` }}
              >
                {stats.map((s) => (
                  <div key={s.label} className="flex-1" style={{ minWidth: 110, paddingInlineEnd: 24 }}>
                    <div className="cz-display" style={{ fontSize: "clamp(40px, 5vw, 60px)", fontWeight: 700, lineHeight: 1, color: C.amber }}>
                      {s.value.toLocaleString("en")}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Radar in the flow on tablets and phones */}
        <div className="mx-auto mt-12 w-[300px] lg:hidden" style={{ pointerEvents: "none" }}>
          <RadarScope uid="hero-m" leaders={leaders} decorative />
        </div>
      </div>
    </section>
  );
}
