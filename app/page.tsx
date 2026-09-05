"use client";

import Link from "next/link";
import { Film, FolderOpen, Video, Trophy, Radio, ArrowUpRight } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import LiveBanner from "@/components/LiveBanner";
import NewsFeed from "@/components/NewsFeed";
import HomeLeaderboardPreview from "@/components/HomeLeaderboardPreview";
import FadeIn from "@/components/FadeIn";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "@/app/animations.css";

export default function Home() {
  const { t } = useLanguage();

  const OPS = [
    { icon: Film, title: t("home.opsReplayTitle"), description: t("home.opsReplayDesc"), href: "/replays", tag: t("home.opsReplayTag") },
    { icon: FolderOpen, title: t("home.opsDownloadsTitle"), description: t("home.opsDownloadsDesc"), href: "/downloads", tag: t("home.opsDownloadsTag") },
    { icon: Video, title: t("home.opsVideosTitle"), description: t("home.opsVideosDesc"), href: "/videos", tag: t("home.opsVideosTag") },
    { icon: Trophy, title: t("home.opsTournamentsTitle"), description: t("home.opsTournamentsDesc"), href: "/tournaments", tag: t("home.opsTournamentsTag") },
  ];

  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <section
        className="relative h-[520px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/images/banner.png')" }}
      >
        <div className="absolute inset-0" style={{ background: `${C.void}CC` }} />
        <div className="absolute inset-0 opacity-40 cz-grid-bg" />

        <div className="relative text-center px-6">
          <div
            className="cz-hero-anim flex items-center justify-center gap-2 text-xs tracking-widest uppercase mb-6"
            style={{ color: C.radar, animationDelay: "0ms" }}
          >
            <Radio size={13} className="cz-live" />
            <span>{t("common.fieldComms")}</span>
          </div>

          <img
            src="/images/commander-logo.png"
            alt="Commander logo"
            className="cz-hero-anim cz-logo-glow w-32 h-32 mx-auto object-cover rounded-full"
            style={{ border: `2px solid ${C.amber}`, animationDelay: "100ms" }}
          />

          <h1
            className="cz-hero-anim cz-display uppercase mt-6 leading-[0.95]"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em", animationDelay: "220ms" }}
          >
            {t("home.title")}
          </h1>

          <p
            className="cz-hero-anim text-sm md:text-base mt-3 uppercase tracking-widest"
            style={{ color: C.muted, animationDelay: "340ms" }}
          >
            {t("home.subtitle")}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
        <div className="text-center">
          <h2 className="cz-display uppercase text-3xl md:text-4xl" style={{ fontWeight: 600 }}>
            {t("home.heading")}
          </h2>

          <p className="text-xs md:text-sm mt-4 uppercase tracking-widest" style={{ color: C.muted }}>
            {t("home.tags")}
          </p>

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cz-cta-hover inline-flex items-center gap-2 mt-8 text-xs uppercase tracking-widest px-6 py-3"
            style={{ background: C.amber, color: C.void, fontWeight: 600 }}
          >
            {t("home.joinOurClan")}
            <ArrowUpRight size={14} />
          </a>
        </div>

        <div
          className="mt-6 pt-6 flex items-center justify-center gap-x-10 gap-y-2 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            {t("home.statusLabel")} <b style={{ color: C.radar }}>{t("home.statusValue")}</b>
          </span>
          <span>
            {t("home.sectorsLabel")} <b style={{ color: C.paper }}>{OPS.length}</b>
          </span>
        </div>

        <FadeIn>
          <a
            href="/join"
            className="cz-card cz-hover-lift group relative block p-6 mt-8"
            style={{ background: C.panel, border: `1px solid ${C.amber}` }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: C.radar }}>
                  {t("home.recruiting")}
                </span>
                <h3 className="cz-display uppercase text-xl mt-1" style={{ color: C.paper, fontWeight: 600 }}>
                  {t("home.joinTeamTitle")}
                </h3>
                <p className="text-xs mt-2" style={{ color: C.muted }}>
                  {t("home.joinTeamDesc")}
                </p>
              </div>

              <span
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-6 py-3 shrink-0"
                style={{ background: C.amber, color: C.void, fontWeight: 600 }}
              >
                {t("home.apply")}
                <ArrowUpRight size={14} />
              </span>
            </div>
          </a>
        </FadeIn>

        <FadeIn delay={80}>
          <a
            href="/donate"
            className="cz-card cz-hover-lift group relative block p-6 mt-4"
            style={{ background: C.panel, border: `1px solid ${C.radar}` }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: C.radar }}>
                  {t("home.supportUs")}
                </span>
                <h3 className="cz-display uppercase text-xl mt-1" style={{ color: C.paper, fontWeight: 600 }}>
                  {t("home.donateTitle")}
                </h3>
                <p className="text-xs mt-2" style={{ color: C.muted }}>
                  {t("home.donateDesc")}
                </p>
              </div>

              <span
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-6 py-3 shrink-0"
                style={{ border: `1px solid ${C.radar}`, color: C.radar }}
              >
                {t("home.donate")}
                <ArrowUpRight size={14} />
              </span>
            </div>
          </a>
        </FadeIn>

        <FadeIn delay={120}>
          <div className="mt-10">
            <LiveBanner />
          </div>
        </FadeIn>

        <FadeIn delay={160}>
          <HomeLeaderboardPreview />
        </FadeIn>

        <FadeIn>
          <div className="flex items-center justify-between mt-10 mb-4">
            <h2 className="cz-display uppercase text-2xl" style={{ fontWeight: 600 }}>
              {t("home.latest")}
            </h2>
            <Link
              href="/news"
              className="text-xs uppercase tracking-widest"
              style={{ color: C.amber }}
            >
              {t("home.viewAll")}
            </Link>
          </div>

          <NewsFeed limit={3} />
        </FadeIn>

        <FadeIn>
          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
            {OPS.map((op) => {
              const Icon = op.icon;
              return (
                <Link
                  key={op.title}
                  href={op.href}
                  className="cz-card cz-hover-lift group relative block p-5"
                  style={{ background: C.panel, border: `1px solid ${C.line}` }}
                >
                  {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map(
                    (pos) => (
                      <span
                        key={pos}
                        className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                        style={{ borderColor: C.amber }}
                      />
                    )
                  )}

                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest mb-5" style={{ color: C.muted }}>
                    <span>{op.tag}</span>
                  </div>

                  <Icon size={22} style={{ color: C.amber }} />

                  <h3 className="text-base mt-4" style={{ color: C.paper, fontWeight: 500 }}>
                    {op.title}
                  </h3>

                  <p className="text-xs mt-2" style={{ color: C.muted }}>
                    {op.description}
                  </p>

                  <div
                    className="flex items-center justify-between mt-5 pt-3 text-xs uppercase tracking-widest"
                    style={{ borderTop: `1px solid ${C.line}`, color: C.amber }}
                  >
                    <span>{t("common.enter")}</span>
                    <ArrowUpRight size={14} />
                  </div>
                </Link>
              );
            })}
          </section>
        </FadeIn>
      </div>
    </main>
  );
}
