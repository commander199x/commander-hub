"use client";

import { useEffect, useState } from "react";
import { Play, ArrowUpRight } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "@/app/animations.css";

const CHANNEL_URL = "https://www.youtube.com/@CommanderZH";

type Video = { id: string; title: string; published: string };

// Text lives here (instead of translations.ts) so this section works
// out of the box in both languages with no extra setup.
const TEXT = {
  en: {
    eyebrow: "Transmissions",
    title: "Latest on YouTube",
    subtitle: "Matches, tutorials and strategies from the Commander channel.",
    visit: "Visit channel",
    subscribe: "Subscribe",
    fallbackTitle: "Commander on YouTube",
    fallbackDesc:
      "Generals Zero Hour matches, tutorials, mods and strategies. Join the Commander army.",
    watch: "Watch",
  },
  ar: {
    eyebrow: "البثوث",
    title: "آخر ما نُشر على يوتيوب",
    subtitle: "مباريات وشروحات واستراتيجيات من قناة كوماندر.",
    visit: "زيارة القناة",
    subscribe: "اشترك",
    fallbackTitle: "كوماندر على يوتيوب",
    fallbackDesc: "مباريات جنرالات الساعة الصفر وشروحات وتعديلات واستراتيجيات. انضم إلى جيش كوماندر.",
    watch: "شاهد",
  },
} as const;

function timeAgo(dateStr: string, locale: string): string {
  const diffSeconds = Math.round((new Date(dateStr).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSeconds);
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeconds / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSeconds / (86400 * 30)), "month");
  return rtf.format(Math.round(diffSeconds / (86400 * 365)), "year");
}

export default function YouTubeSection() {
  const { locale } = useLanguage();
  const text = TEXT[locale === "ar" ? "ar" : "en"];
  const [videos, setVideos] = useState<Video[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/youtube-latest")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setVideos(data.videos ?? []);
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.radar }}>
            {text.eyebrow}
          </span>
          <h2 className="cz-display uppercase text-2xl mt-1" style={{ fontWeight: 600 }}>
            {text.title}
          </h2>
          <p className="text-xs mt-1" style={{ color: C.muted }}>
            {text.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-widest"
            style={{ color: C.amber }}
          >
            {text.visit}
          </a>
          <a
            href={`${CHANNEL_URL}?sub_confirmation=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="cz-cta-hover inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-4 py-2"
            style={{ background: "#ff0000", color: "#fff", fontWeight: 600 }}
          >
            <Play size={12} fill="#fff" />
            {text.subscribe}
          </a>
        </div>
      </div>

      {/* Loading: reserve space with placeholder cards so the page doesn't jump */}
      {videos === null && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: C.panel,
                border: `1px solid ${C.line}`,
                aspectRatio: "16 / 11",
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* Loaded with videos */}
      {videos !== null && videos.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((v) => (
            <a
              key={v.id}
              href={`https://www.youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cz-card cz-hover-lift group relative block"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden", background: "#000" }}>
                <img
                  src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                  alt={v.title}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div
                  className="opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.05))",
                  }}
                >
                  <span
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: "rgba(255,0,0,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Play size={20} fill="#fff" color="#fff" />
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3
                  className="text-sm"
                  style={{
                    color: C.paper,
                    fontWeight: 500,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.4,
                  }}
                >
                  {v.title}
                </h3>
                <p className="text-[11px] mt-2" style={{ color: C.muted }}>
                  {timeAgo(v.published, locale === "ar" ? "ar" : "en")}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Fallback: feed unavailable or channel has no public videos yet */}
      {videos !== null && videos.length === 0 && (
        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cz-card cz-hover-lift group relative block p-6"
          style={{ background: C.panel, border: `1px solid ${C.amber}` }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="cz-display uppercase text-xl" style={{ color: C.paper, fontWeight: 600 }}>
                {text.fallbackTitle}
              </h3>
              <p className="text-xs mt-2" style={{ color: C.muted, maxWidth: "480px" }}>
                {text.fallbackDesc}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-6 py-3 shrink-0"
              style={{ background: C.amber, color: C.void, fontWeight: 600 }}
            >
              {text.watch}
              <ArrowUpRight size={14} />
            </span>
          </div>
        </a>
      )}
    </section>
  );
}
