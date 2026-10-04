"use client";

import { C, DISCORD_URL, SUPPORT_DISCORD_URL, YOUTUBE_URL, TIKTOK_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{ borderTop: `1px solid ${C.line}` }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs uppercase tracking-widest">
        <span style={{ color: C.muted }}>
          &copy; {new Date().getFullYear()} {t("footer.tagline")}
        </span>

        <div className="flex items-center gap-6">
          <a href="/donate" style={{ color: C.radar }}>
            {t("footer.donate")}
          </a>
          <a href={SUPPORT_DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.amber }}>
            {t("footer.support")}
          </a>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.paper }}>
            {t("footer.discord")}
          </a>
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.paper }}>
            {t("footer.youtube")}
          </a>
          <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.paper }}>
            {t("footer.tiktok")}
          </a>
        </div>
      </div>
    </footer>
  );
}
