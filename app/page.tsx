"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FolderOpen, Video, Info, Mail, ArrowUpRight, Heart } from "lucide-react";
import { C } from "@/lib/theme";
import LiveBanner from "@/components/LiveBanner";
import NewsFeed from "@/components/NewsFeed";
import YouTubeSection from "@/components/YouTubeSection";
import FadeIn from "@/components/FadeIn";
import CinematicHero from "@/components/home/CinematicHero";
import FactsStrip from "@/components/home/FactsStrip";
import WaysIn from "@/components/home/WaysIn";
import FrontLine from "@/components/home/FrontLine";
import JoinBanner from "@/components/home/JoinBanner";
import { useHomeData } from "@/components/home/useHomeData";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { HOME_TEXT } from "@/components/home/homeText";
import "@/app/animations.css";

// One container for every section below the hero, matched to the cinematic
// sections (detected by install-home-v2.js) so all left edges line up.
const WRAP = "mx-auto max-w-[1312px]";

// New copy for this layout. Arabic needs a native review.
const LOCAL = {
  en: { latestEyebrow: "Clan news", moreTitle: "More of the hub" },
  ar: { latestEyebrow: "أخبار الكلان", moreTitle: "المزيد في الموقع" },
} as const;

function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
          {eyebrow}
        </div>
        <h2
          className="cz-display mt-2 text-3xl uppercase leading-none md:text-5xl"
          style={{ color: C.paper, fontWeight: 600 }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  const { t, locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const text = HOME_TEXT[lang];
  const local = LOCAL[lang];
  const data = useHomeData(); // one shared fetch for the hero, the radar and the podium

  // The ladder, replays and tournaments are covered by "Three ways in";
  // these are lighter secondary links, so they get a quiet strip, not a second card grid.
  const MORE = [
    { icon: FolderOpen, title: t("home.opsDownloadsTitle"), description: t("home.opsDownloadsDesc"), href: "/downloads" },
    { icon: Video, title: t("home.opsVideosTitle"), description: t("home.opsVideosDesc"), href: "/videos" },
    { icon: Info, title: t("home.opsAboutTitle"), description: t("home.opsAboutDesc"), href: "/about" },
    { icon: Mail, title: t("home.opsContactTitle"), description: t("home.opsContactDesc"), href: "/contact" },
  ];

  return (
    <main className="min-h-screen w-full" style={{ background: C.void }}>
      <CinematicHero data={data} />
      <FactsStrip />

      <div className={WRAP}>
        <FadeIn>
          <div className="mt-10 empty:hidden">
            <LiveBanner />
          </div>
        </FadeIn>
      </div>

      <WaysIn />
      <FrontLine data={data} />

      <div className={WRAP}>
        {/* LATEST */}
        <section className="py-14 md:py-20">
          <FadeIn>
            <SectionHead
              eyebrow={local.latestEyebrow}
              title={t("home.latest")}
              action={
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 py-2 text-sm uppercase tracking-widest"
                  style={{ color: C.amber }}
                >
                  {t("home.viewAll")}
                  <ArrowUpRight size={16} className="rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              }
            />
            <NewsFeed limit={3} />
          </FadeIn>
        </section>

        {/* YOUTUBE (has its own heading) */}
        <section className="py-14 md:py-20" style={{ borderTop: `1px solid ${C.line}` }}>
          <FadeIn>
            <YouTubeSection />
          </FadeIn>
        </section>

        {/* MORE — one quiet strip; 1px gaps over a line-coloured background draw the dividers (RTL-safe) */}
        <section className="py-14 md:py-20" style={{ borderTop: `1px solid ${C.line}` }}>
          <FadeIn>
            <SectionHead eyebrow={text.exploreEyebrow} title={local.moreTitle} />
            <nav
              aria-label={local.moreTitle}
              className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
              style={{ background: C.line, border: `1px solid ${C.line}` }}
            >
              {MORE.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-4 p-6 transition-colors"
                    style={{ background: C.panel }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.panelHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = C.panel)}
                  >
                    <Icon size={22} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base" style={{ color: C.paper, fontWeight: 500 }}>
                          {item.title}
                        </h3>
                        <ArrowUpRight
                          size={16}
                          aria-hidden="true"
                          className="shrink-0 transition-transform group-hover:-translate-y-0.5 rtl:-scale-x-100"
                          style={{ color: C.amberDim }}
                        />
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.muted }}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </FadeIn>
        </section>

        {/* SUPPORT — amber like every other action; green stays reserved for "live" */}
        <section className="pb-16 md:pb-24">
          <FadeIn>
            <Link
              href="/donate"
              className="group flex flex-col gap-6 p-6 transition-colors md:flex-row md:items-center md:justify-between md:p-8"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.amberDim)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
            >
              <div className="flex items-start gap-4">
                <Heart size={24} className="mt-1 shrink-0" style={{ color: C.amber }} aria-hidden="true" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.muted }}>
                    {t("home.supportUs")}
                  </div>
                  <h3
                    className="cz-display mt-1 text-2xl uppercase md:text-3xl"
                    style={{ color: C.paper, fontWeight: 600 }}
                  >
                    {t("home.donateTitle")}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: C.muted }}>
                    {t("home.donateDesc")}
                  </p>
                </div>
              </div>
              <span
                className="inline-flex shrink-0 items-center justify-center gap-2 border border-[#E8A63D] px-6 py-3 text-sm uppercase tracking-widest text-[#E8A63D] transition-colors group-hover:bg-[#E8A63D] group-hover:text-[#0A0C08]"
              >
                {t("home.donate")}
                <ArrowUpRight size={16} className="rtl:-scale-x-100" aria-hidden="true" />
              </span>
            </Link>
          </FadeIn>
        </section>
      </div>

      <JoinBanner />
    </main>
  );
}
