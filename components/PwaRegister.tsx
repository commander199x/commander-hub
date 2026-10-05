"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, SquarePlus } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Registers the service worker (production only) and offers "Install the app"
// — a real install button on Android/desktop, short instructions on iPhone/iPad.

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "cz-install-dismissed-at";
const DISMISS_DAYS = 14;
const SHOW_AFTER_MS = 20_000;

const TEXT = {
  en: { title: "Install Commander", text: "Add the app to your home screen — opens full screen, one tap away.", install: "Install", later: "Not now", close: "Close", ios1: "Tap", ios2: "Share", ios3: "then", ios4: "Add to Home Screen" },
  ar: { title: "ثبّت تطبيق كوماندر", text: "أضف التطبيق إلى شاشتك الرئيسية — يفتح بملء الشاشة وبضغطة واحدة.", install: "تثبيت", later: "ليس الآن", close: "إغلاق", ios1: "اضغط", ios2: "مشاركة", ios3: "ثم", ios4: "إضافة إلى الشاشة الرئيسية" },
};

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

export default function PwaRegister() {
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"none" | "prompt" | "ios">("none");

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("[pwa] service worker failed:", err));
    }

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || recentlyDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const timer = setTimeout(() => setMode((m) => (m === "none" && isIos ? "ios" : m)), SHOW_AFTER_MS);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(timer);
    };
  }, []);

  // Android/desktop: show our card a little while after the browser says the app is installable
  useEffect(() => {
    if (!deferred) return;
    const timer = setTimeout(() => setMode("prompt"), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [deferred]);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setMode("none");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    setMode("none");
  }

  if (mode === "none") return null;

  return (
    <div
      role="dialog"
      aria-label={tx.title}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md border p-4 sm:inset-x-auto sm:end-6 sm:bottom-6"
      style={{ background: "rgba(18,21,14,0.97)", borderColor: C.amberDim, boxShadow: "0 18px 50px rgba(0,0,0,0.55)", animation: "czpwa-in 0.4s cubic-bezier(0.2,0.7,0.2,1) both" }}
    >
      <style>{`@keyframes czpwa-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { [aria-label="${tx.title}"] { animation: none !important; } }`}</style>
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={48} height={48} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="cz-display text-lg uppercase leading-tight" style={{ color: C.paper, fontWeight: 700 }}>{tx.title}</div>
          {mode === "prompt" ? (
            <p className="mt-1 text-sm" style={{ color: C.muted }}>{tx.text}</p>
          ) : (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm" style={{ color: C.muted }}>
              {tx.ios1} <Share size={15} style={{ color: C.amber }} aria-hidden="true" /> <b style={{ color: C.paper }}>{tx.ios2}</b> {tx.ios3}{" "}
              <SquarePlus size={15} style={{ color: C.amber }} aria-hidden="true" /> <b style={{ color: C.paper }}>{tx.ios4}</b>
            </p>
          )}
        </div>
        <button onClick={dismiss} aria-label={tx.close} className="inline-flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: C.muted }}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      {mode === "prompt" && (
        <div className="mt-4 flex gap-2">
          <button onClick={install} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 text-xs uppercase tracking-[0.14em]" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
            <Download size={15} aria-hidden="true" />
            {tx.install}
          </button>
          <button onClick={dismiss} className="inline-flex min-h-[44px] items-center justify-center border px-4 text-xs uppercase tracking-[0.14em]" style={{ borderColor: C.lineStrong, color: C.muted }}>
            {tx.later}
          </button>
        </div>
      )}
    </div>
  );
}
