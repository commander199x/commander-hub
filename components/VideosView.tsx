"use client";

import { Radio } from "lucide-react";
import { C } from "@/lib/theme";
import VideosGrid, { type Video } from "@/components/VideosGrid";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function VideosView({ videos }: { videos: Video[] }) {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: C.radar }}>
          <Radio size={13} className="cz-live" />
          <span>{t("common.fieldComms")}</span>
        </div>

        <h1
          className="cz-display uppercase mt-4 leading-[0.95]"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
        >
          {t("videos.titleLine1")}
          <br />
          <span style={{ color: C.amber }}>{t("videos.titleLine2")}</span>
        </h1>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 pt-6 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            {t("videos.logEntriesLabel")} <b style={{ color: C.paper }}>{String(videos.length).padStart(2, "0")}</b>
          </span>
          <span>
            {t("videos.statusLabel")} <b style={{ color: C.radar }}>{t("videos.statusValue")}</b>
          </span>
        </div>

        <VideosGrid videos={videos} />
      </div>
    </main>
  );
}
