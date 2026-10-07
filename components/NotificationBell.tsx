"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, ChevronRight, Swords, Check, X as XIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { notifyServer } from "@/lib/play";

interface Notification {
  id: number;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TEXT = {
  en: { title: "Notifications", empty: "No notifications yet.", label: "Notifications", unread: (n: number) => `${n} unread`, accept: "Accept", decline: "Decline", view: "View", close: "Close", accepted: "Accepted — go play!", declined: "Declined", newChallenge: "New challenge" },
  ar: { title: "الإشعارات", empty: "لا توجد إشعارات بعد.", label: "الإشعارات", unread: (n: number) => `${n} غير مقروءة`, accept: "قبول", decline: "رفض", view: "عرض", close: "إغلاق", accepted: "تم القبول — العبوا!", declined: "تم الرفض", newChallenge: "تحدٍّ جديد" },
};

type Toast = {
  key: number;
  n: Notification;
  challenge: null | { id: string; from: string; mode: string; message: string | null; avatar: string | null };
  state: "idle" | "busy" | "accepted" | "declined";
};

const TOAST_CSS = `
@keyframes czto-down { from { opacity: 0; transform: translateY(-24px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes czto-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@keyframes czto-glow { 0%,100% { box-shadow: 0 18px 50px rgba(0,0,0,0.6), 0 0 0 0 rgba(220,38,38,0.0); } 50% { box-shadow: 0 18px 50px rgba(0,0,0,0.6), 0 0 26px 2px rgba(220,38,38,0.35); } }
.czto-down { animation: czto-down 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czto-bar { transform-origin: left; animation-name: czto-bar; animation-timing-function: linear; animation-fill-mode: both; }
[dir="rtl"] .czto-bar { transform-origin: right; }
.czto-glow { animation: czto-down 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both, czto-glow 2.2s ease-in-out 0.4s infinite; }
.czto-card:hover .czto-bar { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .czto-down, .czto-glow { animation: none !important; } }
`;

// Drop-down pop-ups under the header for new notifications (challenges get Accept / Decline).
function ToastStack({ toasts, tx, onClose, onAnswer }: {
  toasts: Toast[];
  tx: (typeof TEXT)["en"];
  onClose: (key: number) => void;
  onAnswer: (t: Toast, accept: boolean) => void;
}) {
  if (typeof document === "undefined" || toasts.length === 0) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 z-[90] flex flex-col items-center gap-3 px-3 sm:items-end sm:px-6" style={{ top: "calc(var(--cz-header-h, 64px) + 12px)" }} aria-live="polite">
      <style>{TOAST_CSS}</style>
      {toasts.map((t) => {
        const c = t.challenge;
        const life = c ? 20000 : 7000;
        return (
          <div key={t.key} role={c ? "alertdialog" : "status"} aria-label={c ? tx.newChallenge : undefined} className={`czto-card pointer-events-auto relative w-full max-w-[400px] overflow-hidden border ${c && t.state === "idle" ? "czto-glow" : "czto-down"}`} style={{ background: C.panel, borderColor: c ? "rgba(220,38,38,0.7)" : C.amberDim, borderInlineStartWidth: 4, borderInlineStartColor: c ? "#DC2626" : C.amber, boxShadow: "0 18px 50px rgba(0,0,0,0.6)" }}>
            <div className="flex items-start gap-3 p-4">
              {c ? (
                <span className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatar || "/default-avatar.svg"} alt="" className="h-11 w-11 rounded-full object-cover" style={{ border: "2px solid #DC2626" }} />
                  <span className="absolute -bottom-1 -end-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: "#DC2626" }}><Swords size={11} aria-hidden="true" /></span>
                </span>
              ) : (
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center" style={{ border: `1px solid ${C.amberDim}`, color: C.amber }}><Bell size={15} aria-hidden="true" /></span>
              )}
              <div className="min-w-0 flex-1">
                {c && <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "#F87171", fontWeight: 800 }}>{tx.newChallenge} · {c.mode.toUpperCase()}</div>}
                <div className="mt-0.5 text-sm leading-snug" style={{ color: C.paper, fontWeight: 600 }}>{c ? `${c.from}` : t.n.message}</div>
                {c && <div className="text-sm" style={{ color: C.muted }}>{t.n.message.replace(/^⚔️\s*/, "").replace(c.from, "").trim()}</div>}
                {c?.message && <div className="mt-1 text-sm italic" style={{ color: C.paper }}>“{c.message}”</div>}
                {c && t.state === "accepted" && <div className="mt-2 text-sm" style={{ color: C.radar, fontWeight: 700 }}>✅ {tx.accepted}</div>}
                {c && t.state === "declined" && <div className="mt-2 text-sm" style={{ color: C.muted }}>{tx.declined}</div>}
              </div>
              <button onClick={() => onClose(t.key)} aria-label={tx.close} className="-me-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center" style={{ color: C.muted }}><XIcon size={16} aria-hidden="true" /></button>
            </div>
            {c && (t.state === "idle" || t.state === "busy") ? (
              <div className="flex gap-2 px-4 pb-4">
                <button onClick={() => onAnswer(t, true)} disabled={t.state === "busy"} className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 text-xs uppercase tracking-widest disabled:opacity-60" style={{ background: C.radar, color: C.void, fontWeight: 800 }}>
                  {t.state === "busy" ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{tx.accept}
                </button>
                <button onClick={() => onAnswer(t, false)} disabled={t.state === "busy"} className="inline-flex min-h-[40px] items-center justify-center gap-1.5 border px-3 text-xs uppercase tracking-widest disabled:opacity-60" style={{ borderColor: "rgba(248,113,113,0.6)", color: "#F87171" }}>{tx.decline}</button>
                <Link href="/play" onClick={() => onClose(t.key)} className="inline-flex min-h-[40px] items-center justify-center border px-3 text-xs uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.paper }}>{tx.view}</Link>
              </div>
            ) : (
              !c && t.n.link && (
                <div className="px-4 pb-3">
                  <Link href={t.n.link} onClick={() => onClose(t.key)} className="inline-flex items-center gap-1 text-xs uppercase tracking-widest" style={{ color: C.amber }}>{tx.view}<ChevronRight size={13} className="rtl:-scale-x-100" aria-hidden="true" /></Link>
                </div>
              )
            )}
            <span className="czto-bar absolute bottom-0 start-0 h-[3px] w-full" style={{ background: c ? "#DC2626" : C.amber, animationDuration: `${life}ms` }} onAnimationEnd={() => onClose(t.key)} />
          </div>
        );
      })}
    </div>,
    document.body
  );
}

// The header bell. Rendered EXACTLY ONCE (two copies would clash on the realtime channel).
export default function NotificationBell() {
  const supabase = createClient();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function popToast(n: Notification, me: string) {
    let challenge: Toast["challenge"] = null;
    if (n.message.startsWith("⚔️")) {
      const { data } = await supabase.from("challenges").select("id, from_username, mode, message").eq("to_user", me).eq("status", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        const row = data as { id: string; from_username: string; mode: string; message: string | null };
        const { data: p } = await supabase.from("profiles").select("avatar_url").eq("username", row.from_username).maybeSingle();
        challenge = { id: row.id, from: row.from_username, mode: row.mode, message: row.message, avatar: (p as { avatar_url?: string | null } | null)?.avatar_url ?? null };
      }
    }
    setToasts((prev) => [...prev.slice(-2), { key: Date.now() + Math.random(), n, challenge, state: "idle" }]);
  }

  function closeToast(key: number) {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }

  async function answerToast(t: Toast, accept: boolean) {
    if (!t.challenge) return;
    setToasts((prev) => prev.map((x) => (x.key === t.key ? { ...x, state: "busy" } : x)));
    const { error } = await supabase.rpc("respond_challenge", { p_id: t.challenge.id, p_accept: accept });
    if (error) {
      setToasts((prev) => prev.map((x) => (x.key === t.key ? { ...x, state: "idle" } : x)));
      return;
    }
    void notifyServer("challenge", t.challenge.id, accept);
    setToasts((prev) => prev.map((x) => (x.key === t.key ? { ...x, state: accept ? "accepted" : "declined" } : x)));
    setTimeout(() => closeToast(t.key), 2500);
  }

  useEffect(() => {
    let userId: string | null = null;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      userId = user.id;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setNotifications(data ?? []);
    }

    load();

    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as Notification & { user_id: string };
          if (n.user_id === userId) {
            setNotifications((prev) => [n, ...prev]);
            setRing((r) => r + 1); // shake the bell
            void popToast(n, userId);
          }
        }
      )
      .subscribe();

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) markAllRead();
  }

  const ago = (iso: string) => {
    const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    if (s < 60) return rtf.format(0, "second");
    if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
    if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
    return rtf.format(-Math.round(s / 86400), "day");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <ToastStack toasts={toasts} tx={tx} onClose={closeToast} onAnswer={answerToast} />
      <style>{`@keyframes cznb-ring { 0%,100% { transform: rotate(0); } 15% { transform: rotate(14deg); } 30% { transform: rotate(-12deg); } 45% { transform: rotate(9deg); } 60% { transform: rotate(-6deg); } 75% { transform: rotate(3deg); } } .cznb-ring { animation: cznb-ring 0.9s ease both; transform-origin: 50% 10%; } @keyframes cznb-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } } .cznb-in { animation: cznb-in 0.18s ease-out both; } @media (prefers-reduced-motion: reduce) { .cznb-ring, .cznb-in { animation: none !important; } }`}</style>
      <button
        onClick={toggleOpen}
        aria-label={unreadCount ? `${tx.label} — ${tx.unread(unreadCount)}` : tx.label}
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 items-center justify-center transition-colors hover:bg-[#171B10]"
        style={{ color: unreadCount ? C.amber : C.paper }}
      >
        <Bell key={ring} size={20} className={ring ? "cznb-ring" : ""} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute end-1 top-1 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] leading-[18px] text-white tabular-nums" style={{ background: "#DC2626", fontWeight: 800 }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="cznb-in absolute end-0 top-full z-[60] mt-2 w-[360px] max-w-[calc(100vw-24px)] border" style={{ background: C.panel, borderColor: C.amberDim, boxShadow: "0 18px 50px rgba(0,0,0,0.6)" }}>
          <div className="border-b px-4 py-3 text-[11px] uppercase tracking-[0.2em]" style={{ borderColor: C.line, color: C.muted }}>{tx.title}</div>
          <ul className="max-h-[min(70vh,440px)] overflow-y-auto">
            {notifications.length === 0 && <li className="px-4 py-8 text-center text-sm" style={{ color: C.muted }}>{tx.empty}</li>}
            {notifications.map((n) => {
              const challenge = n.message.startsWith("⚔️");
              const body = (
                <>
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.read ? "transparent" : challenge ? "#DC2626" : C.amber }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug" style={{ color: C.paper, fontWeight: n.read ? 400 : 600 }}>{n.message}</span>
                    <span className="mt-1 block text-xs" style={{ color: C.muted }}>{ago(n.created_at)}</span>
                  </span>
                  {n.link && <ChevronRight size={15} className="mt-1 shrink-0 rtl:-scale-x-100" style={{ color: C.muted }} aria-hidden="true" />}
                </>
              );
              const cls = "flex items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-[#171B10]";
              const style = { borderColor: C.line, background: challenge && !n.read ? "rgba(220,38,38,0.08)" : undefined };
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)} className={cls} style={style}>{body}</Link>
                  ) : (
                    <div className={cls} style={style}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
