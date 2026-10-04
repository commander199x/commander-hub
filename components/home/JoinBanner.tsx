"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import RadarScope from "./RadarScope";
import { HOME_TEXT } from "./homeText";
import "@/app/cinematic.css";

export default function JoinBanner() {
  const { locale } = useLanguage();
  const text = HOME_TEXT[locale === "ar" ? "ar" : "en"];

  return (
    <section
      className="relative overflow-hidden px-6 py-24 md:px-16 md:py-32"
      style={{
        borderTop: `1px solid ${C.line}`,
        background: `radial-gradient(ellipse 60% 90% at 50% 100%, rgba(232,166,61,0.20), transparent 70%), ${C.panel}`,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{ width: "min(900px, 140vw)", transform: "translate(-50%, -50%)", opacity: 0.32 }}
      >
        <RadarScope uid="cta" decorative />
      </div>

      <div className="relative mx-auto max-w-[1000px] text-center">
        <div className="text-xs uppercase tracking-[0.24em]" style={{ color: C.radar }}>
          {text.joinEyebrow}
        </div>
        <h2 className="cz-display mt-3 uppercase" style={{ fontSize: "clamp(64px, 11vw, 150px)", fontWeight: 700, lineHeight: 0.9, color: C.paper }}>
          {text.joinTitle1}
          <br />
          <span style={{ color: C.amber }}>{text.joinTitle2}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[520px] text-base leading-relaxed" style={{ color: C.paper }}>
          {text.joinText}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Link
            href="/join"
            className="inline-flex min-h-[58px] items-center gap-2.5 px-9 text-sm font-bold uppercase tracking-[0.12em]"
            style={{ background: C.amber, color: C.void, boxShadow: "0 0 34px rgba(232,166,61,0.32)" }}
          >
            {text.apply}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </Link>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[58px] items-center px-8 text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ border: `1px solid ${C.amberDim}`, color: C.amber }}
          >
            {text.discord}
          </a>
        </div>
      </div>
    </section>
  );
}
