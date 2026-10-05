"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Shared look for login / signup / edit profile.

const TEXT = {
  en: { tagline: "Report for duty, Commander.", sub: "Ranked ladders, tournaments, replays and a clan that plays every week.", show: "Show password", hide: "Hide password", or: "or" },
  ar: { tagline: "أبلغ عن جاهزيتك أيها القائد.", sub: "تصنيفات وبطولات وإعادات وكلان يلعب كل أسبوع.", show: "إظهار كلمة المرور", hide: "إخفاء كلمة المرور", or: "أو" },
};

export const AUTH_CSS = `
@keyframes czau-sweep { to { transform: rotate(360deg); } }
@keyframes czau-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes czau-shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
@keyframes czau-blip { 0%, 100% { opacity: 0; transform: scale(0.5); } 40% { opacity: 1; transform: scale(1); } }
@keyframes czau-pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.czau-sweep { animation: czau-sweep 5s linear infinite; }
.czau-in { animation: czau-in 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czau-shake { animation: czau-shake 0.45s ease both; }
.czau-blip { animation: czau-blip 3s ease-in-out infinite; }
.czau-pop { animation: czau-pop 0.3s ease-out both; }
.czau-input { min-height: 48px; width: 100%; border: 1px solid #8A6425; background: #0A0C08; color: #EDEAE0; padding: 0 14px; font-size: 15px; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
.czau-input:focus { border-color: #E8A63D; box-shadow: 0 0 0 3px rgba(232,166,61,0.15); }
.czau-input::placeholder { color: #83866F; }
textarea.czau-input { padding: 12px 14px; min-height: 110px; resize: vertical; }
.czau-btn { position: relative; overflow: hidden; transition: filter 0.2s ease, transform 0.15s ease; }
.czau-btn:hover:not(:disabled) { filter: brightness(1.08); }
.czau-btn:active:not(:disabled) { transform: translateY(1px); }
@media (prefers-reduced-motion: reduce) {
  .czau-sweep, .czau-in, .czau-shake, .czau-blip, .czau-pop { animation: none !important; }
  .czau-input, .czau-btn { transition: none !important; }
}
`;

export function AuthShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  return (
    <main className="min-h-[calc(100vh-var(--cz-header-h,64px))] w-full" style={{ background: C.void, color: C.paper }}>
      <style>{AUTH_CSS}</style>
      <div className="grid min-h-[inherit] lg:grid-cols-[1fr_minmax(460px,560px)]">
        {/* Visual side */}
        <aside className="relative hidden overflow-hidden border-e lg:flex lg:flex-col lg:justify-end" style={{ borderColor: C.line }} aria-hidden="true">
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(39,43,30,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(39,43,30,0.5) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(143,191,79,0.12), transparent 65%), radial-gradient(ellipse 50% 40% at 20% 90%, rgba(232,166,61,0.12), transparent 60%)" }} />
          <div className="absolute left-1/2 top-[40%] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ border: `1px solid rgba(143,191,79,0.35)` }}>
            {[18, 36].map((p) => <div key={p} className="absolute rounded-full" style={{ inset: `${p}%`, border: `1px solid ${C.line}` }} />)}
            <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: C.line }} />
            <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: C.line }} />
            <div className="czau-sweep absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 290deg, rgba(143,191,79,0.35) 360deg)" }} />
            {[["30%", "28%", "0s"], ["64%", "40%", "1s"], ["44%", "70%", "2s"], ["72%", "66%", "1.6s"]].map(([l, t, d], i) => (
              <span key={i} className="czau-blip absolute h-2.5 w-2.5 rounded-full" style={{ left: l, top: t, background: i === 0 ? C.amber : C.radar, boxShadow: `0 0 12px ${i === 0 ? C.amber : C.radar}`, animationDelay: d }} />
            ))}
          </div>
          <div className="relative p-12">
            <div className="cz-display text-5xl uppercase leading-[0.95]" style={{ fontWeight: 700 }}>{tx.tagline}</div>
            <p className="mt-4 max-w-md text-base" style={{ color: C.muted }}>{tx.sub}</p>
          </div>
        </aside>

        {/* Form side */}
        <div className="flex items-center justify-center px-6 py-12 md:px-12">
          <div className="czau-in w-full max-w-[440px]">
            <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>{eyebrow}</div>
            <h1 className="cz-display mt-2 text-5xl uppercase leading-none" style={{ fontWeight: 700 }}>{title}</h1>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-2 block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{label}</label>
      {children}
      {hint && <div className="mt-2 text-xs" style={{ color: C.muted }}>{hint}</div>}
    </div>
  );
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className="czau-input pe-12" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? tx.hide : tx.show}
        className="absolute top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center"
        style={{ insetInlineEnd: 4, color: C.muted }}
      >
        {show ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
      </button>
    </div>
  );
}

const DISCORD_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z" />
  </svg>
);

export function DiscordButton({ onClick, loading, label, loadingLabel }: { onClick: () => void; loading: boolean; label: string; loadingLabel: string }) {
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="czau-btn flex min-h-[52px] w-full items-center justify-center gap-2.5 text-sm disabled:opacity-70"
        style={{ background: "#5865F2", color: "#fff", fontWeight: 700 }}
      >
        {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : DISCORD_ICON}
        {loading ? loadingLabel : label}
      </button>
      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1" style={{ background: C.line }} />
        <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{tx.or}</span>
        <span className="h-px flex-1" style={{ background: C.line }} />
      </div>
    </>
  );
}

export function SubmitButton({ disabled, loading, label, loadingLabel }: { disabled?: boolean; loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="czau-btn flex min-h-[52px] w-full items-center justify-center gap-2 text-sm uppercase tracking-[0.14em] disabled:opacity-60"
      style={{ background: C.amber, color: C.void, fontWeight: 700, boxShadow: "0 0 26px rgba(232,166,61,0.25)" }}
    >
      {loading && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
      {loading ? loadingLabel : label}
    </button>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p key={message} role="alert" className="czau-shake mb-5 border px-4 py-3 text-sm" style={{ borderColor: "rgba(248,113,113,0.5)", background: "rgba(248,113,113,0.08)", color: "#F87171" }}>
      {message}
    </p>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="underline-offset-4 hover:underline" style={{ color: C.amber, fontWeight: 600 }}>
      {children}
    </Link>
  );
}
