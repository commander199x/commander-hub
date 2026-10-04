"use client";

import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { HOME_TEXT } from "./homeText";

export default function FactsStrip() {
  const { locale } = useLanguage();
  const text = HOME_TEXT[locale === "ar" ? "ar" : "en"];

  return (
    <div className="px-6 md:px-16" style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <ul
        className="mx-auto flex max-w-[1312px] flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-xs uppercase tracking-[0.16em]"
        style={{ color: C.paper, minHeight: 68 }}
      >
        {text.facts.map((fact) => (
          <li key={fact} className="inline-flex items-center gap-3.5 whitespace-nowrap">
            {fact}
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rotate-45" style={{ background: C.amber }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
