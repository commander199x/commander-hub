"use client";

import { useRouter } from "next/navigation";
import { C } from "@/lib/theme";
import type { Locale } from "@/lib/i18n/dictionary";

export default function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();

  const switchTo = (next: Locale) => {
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex items-center text-[10px] uppercase tracking-widest" style={{ border: `1px solid ${C.line}` }}>
      <button
        onClick={() => switchTo("en")}
        className="px-2.5 py-1.5 transition-colors"
        style={{
          background: locale === "en" ? C.amber : "transparent",
          color: locale === "en" ? C.void : C.muted,
          fontWeight: locale === "en" ? 600 : 400,
        }}
      >
        EN
      </button>
      <button
        onClick={() => switchTo("ar")}
        className="px-2.5 py-1.5 transition-colors"
        style={{
          background: locale === "ar" ? C.amber : "transparent",
          color: locale === "ar" ? C.void : C.muted,
          fontWeight: locale === "ar" ? 600 : 400,
        }}
      >
        ع
      </button>
    </div>
  );
}