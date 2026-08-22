"use client";

import { Languages } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, toggleLocale } = useLanguage();

  return (
    <button
      onClick={toggleLocale}
      aria-label={locale === "en" ? "التبديل إلى العربية" : "Switch to English"}
      className={`flex items-center gap-1.5 text-xs uppercase tracking-widest px-3 py-2 transition-colors ${className}`}
      style={{ border: `1px solid ${C.lineStrong}`, color: C.paper }}
    >
      <Languages size={13} style={{ color: C.amber }} />
      {locale === "en" ? "العربية" : "English"}
    </button>
  );
}
