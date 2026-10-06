"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Swords, X, Loader2, Check } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PLAY_MODES, sendChallenge, type PlayMode } from "@/lib/play";

const TEXT = {
  en: { challenge: "Challenge", title: (n: string) => `Challenge ${n}`, mode: "Mode", msg: "Message (optional)", msgPh: "e.g. Tonight 9pm, Tournament Desert?", discord: "Also post it in Discord", send: "Send challenge", sending: "Sending…", sent: "Challenge sent!", close: "Close" },
  ar: { challenge: "تحدٍّ", title: (n: string) => `تحدّى ${n}`, mode: "النمط", msg: "رسالة (اختياري)", msgPh: "مثال: الليلة 9 مساءً؟", discord: "انشره أيضاً في ديسكورد", send: "أرسل التحدي", sending: "جارٍ الإرسال…", sent: "تم إرسال التحدي!", close: "إغلاق" },
};

// "Challenge" button + dialog. Use anywhere: <ChallengeButton username="Ace" />
export default function ChallengeButton({ username, compact = false, defaultMode = "2v2" }: { username: string; compact?: boolean; defaultMode?: PlayMode }) {
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PlayMode>(defaultMode);
  const [message, setMessage] = useState("");
  const [discord, setDiscord] = useState(true);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function send() {
    setError(null);
    setState("sending");
    const { error } = await sendChallenge(username, mode, message.trim(), discord);
    if (error) {
      setError(error);
      setState("idle");
      return;
    }
    setState("sent");
    setTimeout(() => {
      setOpen(false);
      setState("idle");
      setMessage("");
    }, 1400);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 text-xs uppercase tracking-widest transition-[filter] hover:brightness-110 ${compact ? "min-h-[36px] px-3" : "min-h-[44px] px-4"}`}
        style={{ background: "#DC2626", color: "#fff", fontWeight: 700 }}
      >
        <Swords size={compact ? 14 : 15} aria-hidden="true" />
        {tx.challenge}
      </button>
      {open && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={tx.title(username)}>
            <style>{`@keyframes czch-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } } .czch-up { animation: czch-up 0.3s cubic-bezier(0.2,0.7,0.2,1) both; } @media (prefers-reduced-motion: reduce) { .czch-up { animation: none !important; } }`}</style>
            <button className="absolute inset-0" style={{ background: "rgba(5,6,4,0.82)" }} onClick={() => setOpen(false)} aria-label={tx.close} />
            <div className="czch-up relative m-3 w-full max-w-md border p-6" style={{ background: C.panel, borderColor: "#DC2626", boxShadow: "0 0 50px rgba(220,38,38,0.25)" }}>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center" style={{ background: "#DC2626", color: "#fff" }}><Swords size={20} aria-hidden="true" /></span>
                <h2 className="cz-display min-w-0 flex-1 truncate text-2xl uppercase" style={{ fontWeight: 700, color: C.paper }}>{tx.title(username)}</h2>
                <button onClick={() => setOpen(false)} aria-label={tx.close} className="inline-flex h-9 w-9 items-center justify-center" style={{ color: C.muted }}><X size={18} aria-hidden="true" /></button>
              </div>
              <div className="mt-5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.mode}</div>
              <div className="mt-2 flex flex-wrap gap-2" role="group">
                {PLAY_MODES.map((m) => (
                  <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className="min-h-[42px] min-w-[58px] border px-3 text-sm uppercase tracking-widest" style={{ background: mode === m ? C.amber : "transparent", color: mode === m ? C.void : C.paper, borderColor: mode === m ? C.amber : C.amberDim, fontWeight: mode === m ? 700 : 500 }}>{m}</button>
                ))}
              </div>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.msg}</span>
                <input value={message} maxLength={200} onChange={(e) => setMessage(e.target.value)} placeholder={tx.msgPh} className="min-h-[44px] w-full border border-[#8A6425] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0]" />
              </label>
              <label className="mt-3 inline-flex min-h-[40px] items-center gap-2 text-sm" style={{ color: C.paper }}>
                <input type="checkbox" checked={discord} onChange={(e) => setDiscord(e.target.checked)} style={{ accentColor: C.amber, width: 16, height: 16 }} />
                {tx.discord}
              </label>
              {error && <p role="alert" className="mt-3 border px-3 py-2 text-sm" style={{ borderColor: "rgba(248,113,113,0.5)", color: "#F87171" }}>{error}</p>}
              <button type="button" onClick={send} disabled={state !== "idle"} className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 text-sm uppercase tracking-[0.14em] text-white disabled:opacity-80" style={{ background: state === "sent" ? C.radar : "#DC2626", fontWeight: 800 }}>
                {state === "sending" ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : state === "sent" ? <Check size={17} aria-hidden="true" /> : <Swords size={17} aria-hidden="true" />}
                {state === "sending" ? tx.sending : state === "sent" ? tx.sent : tx.send}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
