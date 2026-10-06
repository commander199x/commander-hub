"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Notification {
  id: number;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TEXT = {
  en: { title: "Notifications", empty: "No notifications yet.", label: "Notifications", unread: (n: number) => `${n} unread` },
  ar: { title: "الإشعارات", empty: "لا توجد إشعارات بعد.", label: "الإشعارات", unread: (n: number) => `${n} غير مقروءة` },
};

// The header bell. Rendered EXACTLY ONCE (two copies would clash on the realtime channel).
export default function NotificationBell() {
  const supabase = createClient();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
