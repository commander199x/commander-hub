"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { C } from "@/lib/theme";
import VideosGrid, { type Video } from "@/components/VideosGrid";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";

function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    let raf = 0;
    const start = performance.now();
    setShown(0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{String(shown).padStart(2, "0")}</>;
}

export default function VideosView({ videos }: { videos: Video[] }) {
  const { t, locale } = useLanguage();
  const yt = videos.filter((v) => v.platform === "YouTube").length;
  const tk = videos.filter((v) => v.platform === "TikTok").length;

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-10 pt-14 md:pt-20`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Radio size={14} className="cz-live" aria-hidden="true" />
            <span>{t("common.fieldComms")}</span>
          </div>
          <h1 className="cz-display mt-3 uppercase leading-[0.92]" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}>
            {t("videos.titleLine1")} <span style={{ color: C.amber }}>{t("videos.titleLine2")}</span>
          </h1>

          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-px border sm:grid-cols-4" style={{ background: C.line, borderColor: C.line }}>
            {[
              { label: t("videos.logEntriesLabel"), value: videos.length, color: C.amber },
              { label: "YouTube", value: yt, color: C.paper },
              { label: "TikTok", value: tk, color: C.paper },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4" style={{ background: C.panel }}>
                <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{s.label}</div>
                <div className="cz-display mt-1 text-4xl leading-none tabular-nums" style={{ color: s.color, fontWeight: 700 }}>
                  <CountUp value={s.value} />
                </div>
              </div>
            ))}
            <div className="px-5 py-4" style={{ background: C.panel }}>
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{t("videos.statusLabel")}</div>
              <div className="mt-2 flex items-center gap-2 text-sm uppercase tracking-widest" style={{ color: C.radar, fontWeight: 700 }}>
                <span className="relative inline-flex h-2 w-2">
                  <span className="cz-blink absolute inset-0 rounded-full" style={{ background: C.radar }} />
                  <span className="relative inline-block h-2 w-2 rounded-full" style={{ background: C.radar }} />
                </span>
                {t("videos.statusValue")}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={WRAP} key={locale}>
        <VideosGrid videos={videos} />
      </div>
    </main>
  );
}
