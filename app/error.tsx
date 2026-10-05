"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const TEXT = {
  en: { eyebrow: "System malfunction", title: "Something broke", text: "This page hit an unexpected error. Try again — if it keeps happening, tell us on Discord and include the code below.", retry: "Try again", home: "Back to base", code: "Error code" },
  ar: { eyebrow: "عطل في النظام", title: "حدث خطأ ما", text: "واجهت هذه الصفحة خطأً غير متوقع. حاول مجدداً، وإذا تكرر أخبرنا على ديسكورد مع الرمز أدناه.", retry: "حاول مجدداً", home: "العودة للقاعدة", code: "رمز الخطأ" },
};

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];

  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-var(--cz-header-h,64px))] w-full items-center justify-center px-6 py-16" style={{ background: C.void, color: C.paper }}>
      <div className="w-full max-w-xl border p-8 text-center" style={{ borderColor: "rgba(248,113,113,0.45)", background: "linear-gradient(160deg, rgba(248,113,113,0.08), #12150E 60%)" }}>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ border: "1px solid rgba(248,113,113,0.6)", color: "#F87171" }}>
          <AlertTriangle size={30} aria-hidden="true" />
        </span>
        <div className="mt-5 text-[11px] uppercase tracking-[0.24em]" style={{ color: "#F87171" }}>{tx.eyebrow}</div>
        <h1 className="cz-display mt-2 text-4xl uppercase" style={{ fontWeight: 700 }}>{tx.title}</h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: C.muted }}>{tx.text}</p>
        {error.digest && (
          <p className="mt-4 text-xs" style={{ color: C.muted }}>
            {tx.code}: <code dir="ltr" style={{ color: C.amber }}>{error.digest}</code>
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => reset()} className="inline-flex min-h-[52px] items-center gap-2 px-6 text-sm uppercase tracking-[0.12em]" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
            <RotateCcw size={16} aria-hidden="true" />
            {tx.retry}
          </button>
          <Link href="/" className="inline-flex min-h-[52px] items-center gap-2 border px-6 text-sm uppercase tracking-[0.12em] transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}>
            <Home size={16} aria-hidden="true" />
            {tx.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
