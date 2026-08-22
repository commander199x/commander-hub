"use client";

import { Radio, ArrowUpRight } from "lucide-react";
import { C } from "@/lib/theme";
import { LIVE_STATUS } from "@/lib/news-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LiveBanner() {
  const { t } = useLanguage();
  if (!LIVE_STATUS.isLive) return null;

  return (
    <a
      href={LIVE_STATUS.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-4 p-4"
      style={{ background: `${C.radar}1A`, border: `1px solid ${C.radar}` }}
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="cz-live absolute inline-flex h-full w-full rounded-full"
            style={{ background: C.radar }}
          />
        </span>
        <div>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.radar }}>
            {t("common.liveNow")}
          </span>
          <p className="text-sm mt-0.5" style={{ color: C.paper, fontWeight: 500 }}>
            {LIVE_STATUS.title}
          </p>
        </div>
      </div>
      <ArrowUpRight size={16} style={{ color: C.radar }} />
    </a>
  );
}
