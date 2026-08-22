"use client";

import { Radio } from "lucide-react";
import { C } from "@/lib/theme";
import LiveBanner from "@/components/LiveBanner";
import NewsFeed from "@/components/NewsFeed";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NewsView() {
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
          {t("news.titleLine1")}
          <br />
          <span style={{ color: C.amber }}>{t("news.titleLine2")}</span>
        </h1>

        <div className="mt-8">
          <LiveBanner />
        </div>

        <div className="mt-10">
          <NewsFeed />
        </div>
      </div>
    </main>
  );
}
