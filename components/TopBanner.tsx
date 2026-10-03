"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// ---- Edit these to change the banner ---------------------------------
const BANNER_LINK = "https://www.youtube.com/@CommanderZH";
// Change this id whenever you want the banner to show again for people
// who already dismissed the old one (e.g. a new message or a new link).
const BANNER_ID = "youtube-2026-10";
const STORAGE_KEY = "commander-banner-dismissed";

const TEXT = {
  en: {
    message: "New videos on the Commander YouTube channel",
    cta: "Watch now",
    close: "Dismiss",
  },
  ar: {
    message: "فيديوهات جديدة على قناة كوماندر في يوتيوب",
    cta: "شاهد الآن",
    close: "إغلاق",
  },
} as const;
// ----------------------------------------------------------------------

export default function TopBanner() {
  const { locale } = useLanguage();
  const text = TEXT[locale === "ar" ? "ar" : "en"];
  const [visible, setVisible] = useState(true);

  // If this visitor already dismissed this exact banner, hide it.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === BANNER_ID) {
        setVisible(false);
      }
    } catch {
      // localStorage unavailable (private mode etc.) — just keep it visible
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, BANNER_ID);
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(255, 0, 0, 0.12)",
        borderBottom: "1px solid rgba(255, 0, 0, 0.35)",
        padding: "0.5rem 2.5rem",
        textAlign: "center",
      }}
    >
      <a
        href={BANNER_LINK}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
          color: C.paper,
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          textDecoration: "none",
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#ff0000",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Play size={10} fill="#fff" color="#fff" />
        </span>
        <span>{text.message}</span>
        <span
          style={{
            color: C.amber,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {text.cta} →
        </span>
      </a>

      <button
        type="button"
        onClick={dismiss}
        aria-label={text.close}
        title={text.close}
        style={{
          position: "absolute",
          top: "50%",
          insetInlineEnd: "0.75rem",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: C.muted,
          cursor: "pointer",
          display: "flex",
          padding: "0.25rem",
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
