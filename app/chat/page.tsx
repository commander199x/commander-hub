"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Send, Trash2, ArrowDown, Users, MessageSquare, LogIn, Ban, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "@/app/chat.css";

interface Message {
  id: number;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface ProfileInfo {
  is_team: boolean;
  is_admin: boolean;
  is_owner: boolean;
  avatar_url: string | null;
}

const MAX_LENGTH = 300;
const COOLDOWN_MS = 3000;
const GROUP_WINDOW_MS = 5 * 60 * 1000; // messages within 5 min from the same person group together
const TYPING_SHOW_MS = 3500;
const TYPING_SEND_EVERY_MS = 2000;
const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const LOSS_TEXT = "#F87171";

// Everything players see, in both languages. Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Comms channel",
    title: "Community chat",
    sub: "Talk tactics, find teammates and set up games in real time.",
    online: (n: number) => `${n} online`,
    onlineNow: "Online now",
    guests: (n: number) => `+ ${n} ${n === 1 ? "guest" : "guests"}`,
    rules: "Rules",
    rule1: "Be respectful to every commander.",
    rule2: `One message every ${COOLDOWN_MS / 1000} seconds.`,
    rule3: `Up to ${MAX_LENGTH} characters per message.`,
    loading: "Loading messages…",
    empty: "No messages yet. Be the first to say something.",
    signIn: "Sign in",
    signInRest: "to join the conversation.",
    banned: "You have been banned from chatting.",
    placeholder: "Message the community…",
    send: "Send",
    del: "Delete message",
    slowDown: "Slow down a little before sending another message.",
    tooLong: `Message is too long (max ${MAX_LENGTH} characters).`,
    newMessages: (n: number) => `${n} new ${n === 1 ? "message" : "messages"}`,
    typing1: (a: string) => `${a} is typing`,
    typing2: (a: string, b: string) => `${a} and ${b} are typing`,
    typingMany: "Several commanders are typing",
    owner: "Owner",
    admin: "Admin",
    team: "Team",
    charsLeft: (n: number) => `${n} characters left`,
  },
  ar: {
    eyebrow: "قناة الاتصال",
    title: "دردشة المجتمع",
    sub: "ناقش التكتيكات وابحث عن زملاء ونظّم المباريات مباشرة.",
    online: (n: number) => `${n} متصل`,
    onlineNow: "المتصلون الآن",
    guests: (n: number) => `+ ${n} زائر`,
    rules: "القواعد",
    rule1: "احترم جميع القادة.",
    rule2: `رسالة واحدة كل ${COOLDOWN_MS / 1000} ثوانٍ.`,
    rule3: `حتى ${MAX_LENGTH} حرف في الرسالة.`,
    loading: "جارٍ تحميل الرسائل…",
    empty: "لا توجد رسائل بعد. كن أول من يكتب.",
    signIn: "سجّل الدخول",
    signInRest: "للانضمام إلى المحادثة.",
    banned: "تم حظرك من الدردشة.",
    placeholder: "اكتب رسالة للمجتمع…",
    send: "إرسال",
    del: "حذف الرسالة",
    slowDown: "تمهّل قليلاً قبل إرسال رسالة أخرى.",
    tooLong: `الرسالة طويلة جداً (الحد الأقصى ${MAX_LENGTH} حرف).`,
    newMessages: (n: number) => `${n} رسائل جديدة`,
    typing1: (a: string) => `${a} يكتب`,
    typing2: (a: string, b: string) => `${a} و${b} يكتبان`,
    typingMany: "عدة قادة يكتبون",
    owner: "المالك",
    admin: "مشرف",
    team: "الفريق",
    charsLeft: (n: number) => `${n} حرف متبقٍ`,
  },
};

// Animations live here so this page needs no extra CSS file. All of them switch off for reduced motion.
const CHAT_CSS = `
@keyframes czc-in { from { opacity: 0; transform: translateY(10px) scale(0.985); } to { opacity: 1; transform: none; } }
@keyframes czc-flash { from { background: rgba(232,166,61,0.16); } to { background: transparent; } }
@keyframes czc-ping { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.6); opacity: 0; } }
@keyframes czc-dot { 0%, 80%, 100% { opacity: 0.25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
@keyframes czc-cool { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@keyframes czc-shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-3px); } 40%, 60% { transform: translateX(3px); } }
@keyframes czc-sweep { to { transform: rotate(360deg); } }
@keyframes czc-shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
@keyframes czc-pop { 0% { transform: translate(-50%, 8px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
.czc-in { animation: czc-in 0.38s cubic-bezier(0.2, 0.7, 0.2, 1) both, czc-flash 1.6s ease-out 0.1s both; }
.czc-ping { animation: czc-ping 1.8s ease-out infinite; }
.czc-dot { animation: czc-dot 1.2s ease-in-out infinite; }
.czc-cool { transform-origin: left; animation: czc-cool ${COOLDOWN_MS}ms linear forwards; }
[dir="rtl"] .czc-cool { transform-origin: right; }
.czc-shake { animation: czc-shake 0.42s ease both; }
.czc-sweep { animation: czc-sweep 4s linear infinite; }
.czc-shimmer { background: linear-gradient(90deg, #12150E 0%, #1d2215 50%, #12150E 100%); background-size: 200% 100%; animation: czc-shimmer 1.4s linear infinite; }
.czc-pop { animation: czc-pop 0.25s ease-out both; }
.czc-scroll { scrollbar-width: thin; scrollbar-color: #3A4029 transparent; }
@media (prefers-reduced-motion: reduce) {
  .czc-in, .czc-ping, .czc-dot, .czc-shake, .czc-sweep, .czc-shimmer, .czc-pop { animation: none !important; }
  .czc-cool { animation-duration: 0.01ms !important; }
}
`;

const GRID_BG =
  "linear-gradient(rgba(39,43,30,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(39,43,30,0.35) 1px, transparent 1px)";

function Avatar({ src, size }: { src: string | null | undefined; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/default-avatar.svg"}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size, border: `1px solid ${C.lineStrong}` }}
    />
  );
}

export default function ChatPage() {
  const supabase = createClient();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const [loadingUser, setLoadingUser] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [teamUsernames, setTeamUsernames] = useState<Set<string>>(new Set());
  const [profileMap, setProfileMap] = useState<Map<string, ProfileInfo>>(new Map());

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineNames, setOnlineNames] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState(0);
  const [typers, setTypers] = useState<Record<string, number>>({});
  const [unseen, setUnseen] = useState(0);

  const sessionId = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36)),
    []
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const initialIdsRef = useRef<Set<number> | null>(null);
  const prevCountRef = useRef(0);
  const presenceRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSentRef = useRef(0);

  function showError(msg: string) {
    setError(msg);
    setErrorKey((k) => k + 1);
  }

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, is_admin, banned")
          .eq("id", user.id)
          .single();
        setUsername(profile?.username ?? null);
        setIsAdmin(profile?.is_admin ?? false);
        setIsBanned(profile?.banned ?? false);
      }

      setLoadingUser(false);
    }

    loadUser();
  }, [supabase]);

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      const list = (data ?? []) as Message[];
      initialIdsRef.current = new Set(list.map((m) => m.id)); // these don't animate in
      setMessages(list);
      setLoadingMessages(false);
    }

    async function loadTeamUsernames() {
      const { data } = await supabase
        .from("profiles")
        .select("username, is_team, is_admin, is_owner, avatar_url");

      const teamSet = new Set<string>();
      const map = new Map<string, ProfileInfo>();

      (data ?? []).forEach((p) => {
        if (p.is_team) teamSet.add(p.username);
        map.set(p.username, { is_team: p.is_team, is_admin: p.is_admin, is_owner: p.is_owner, avatar_url: p.avatar_url });
      });

      setTeamUsernames(teamSet);
      setProfileMap(map);
    }

    loadMessages();
    loadTeamUsernames();

    const channel = supabase
      .channel("public-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          // whoever just sent a message is no longer typing
          setTypers((prev) => {
            if (!(incoming.username in prev)) return prev;
            const next = { ...prev };
            delete next[incoming.username];
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as Message).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Scroll: jump to the bottom on first load; afterwards follow new messages only if
  // you're already at the bottom (or it's your own message) — otherwise show a "new messages" pill.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const added = messages.length - prevCountRef.current;
    const last = messages[messages.length - 1];

    if (prevCountRef.current === 0 && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
    } else if (added > 0) {
      if (atBottomRef.current || (last && last.username === username)) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } else {
        setUnseen((n) => n + added);
      }
    }
    prevCountRef.current = messages.length;
  }, [messages, username]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottomRef.current = atBottom;
    if (atBottom && unseen) setUnseen(0);
  }

  function jumpToLatest() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setUnseen(0);
  }

  // Track who's currently viewing the chat page (presence) + live "is typing"
  useEffect(() => {
    if (loadingUser) return;

    const presenceChannel = supabase.channel("chat-presence", {
      config: { presence: { key: sessionId }, broadcast: { self: false } },
    });
    presenceRef.current = presenceChannel;

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState() as Record<string, { username?: string }[]>;
        setOnlineCount(Object.keys(state).length);
        const names = new Set<string>();
        let guests = 0;
        for (const entries of Object.values(state)) {
          const name = entries[0]?.username;
          if (!name || name === "Guest") guests += 1;
          else names.add(name);
        }
        setOnlineNames(Array.from(names).sort((a, b) => a.localeCompare(b)));
        setGuestCount(guests);
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const name = (payload as { username?: string })?.username;
        if (!name) return;
        setTypers((prev) => ({ ...prev, [name]: Date.now() + TYPING_SHOW_MS }));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            username: username ?? "Guest",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceRef.current = null;
      supabase.removeChannel(presenceChannel);
    };
  }, [loadingUser, username, sessionId, supabase]);

  // Drop "is typing" names once they go quiet
  const typerCount = Object.keys(typers).length;
  useEffect(() => {
    if (typerCount === 0) return;
    const t = setInterval(() => {
      setTypers((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) if (v > now) next[k] = v;
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [typerCount]);

  function onInputChange(value: string) {
    setInput(value);
    if (error) setError(null);
    const now = Date.now();
    if (username && value.trim() && now - lastTypingSentRef.current > TYPING_SEND_EVERY_MS) {
      lastTypingSentRef.current = now;
      void presenceRef.current?.send({ type: "broadcast", event: "typing", payload: { username } });
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = input.trim();
    if (!trimmed || !userId || !username) return;

    if (Date.now() - lastSentAt < COOLDOWN_MS) {
      showError(tx.slowDown);
      return;
    }

    if (trimmed.length > MAX_LENGTH) {
      showError(tx.tooLong);
      return;
    }

    setSending(true);

    const { error: sendError } = await supabase.from("messages").insert({
      user_id: userId,
      username,
      content: trimmed,
    });

    setSending(false);

    if (sendError) {
      showError(sendError.message);
      return;
    }

    setInput("");
    setLastSentAt(Date.now());
    lastTypingSentRef.current = 0;
  }

  async function handleDelete(id: number) {
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", id);
    if (deleteError) {
      showError(deleteError.message);
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  }

  // ---------- helpers for rendering ----------
  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit" });
  }

  function dayLabel(iso: string) {
    const d = new Date(iso);
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOf(d) - startOf(new Date())) / 86400000);
    if (diffDays === 0 || diffDays === -1) {
      return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(diffDays, "day");
    }
    return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  function renderContent(text: string) {
    // Highlight @mentions
    const parts = text.split(/(@[\p{L}\p{N}_.-]+)/gu);
    return parts.map((part, i) =>
      part.startsWith("@") && part.length > 1 ? (
        <span key={i} style={{ color: C.amber, fontWeight: 600 }}>
          {part}
        </span>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      )
    );
  }

  const typerNames = Object.keys(typers).filter((n) => n !== username);
  const typingText =
    typerNames.length === 0
      ? ""
      : typerNames.length === 1
        ? tx.typing1(typerNames[0])
        : typerNames.length === 2
          ? tx.typing2(typerNames[0], typerNames[1])
          : tx.typingMany;

  const used = input.length;
  const ratio = Math.min(1, used / MAX_LENGTH);
  const ringColor = ratio >= 1 ? LOSS_TEXT : ratio > 0.8 ? C.amber : C.muted;
  const RING_R = 9;
  const RING_C = 2 * Math.PI * RING_R;
  const cooling = lastSentAt > 0;

  return (
    <main className="min-h-screen w-full pb-20" style={{ background: C.void, color: C.paper }}>
      <style>{CHAT_CSS}</style>

      {/* Page header */}
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} flex flex-wrap items-end justify-between gap-6 pb-10 pt-14 md:pt-20`}>
          <div>
            <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              {/* mini radar */}
              <span className="relative inline-block h-4 w-4 overflow-hidden rounded-full" style={{ border: `1px solid ${C.radar}` }} aria-hidden="true">
                <span
                  className="czc-sweep absolute inset-0"
                  style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 270deg, rgba(143,191,79,0.85) 360deg)" }}
                />
              </span>
              {tx.eyebrow}
            </div>
            <h1 className="cz-display mt-3 text-5xl uppercase leading-none md:text-7xl" style={{ fontWeight: 700 }}>
              {tx.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: C.muted }}>
              {tx.sub}
            </p>
          </div>
          <div className="inline-flex items-center gap-3 border px-4 py-2.5" style={{ borderColor: C.line, background: C.panel }} aria-live="polite">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="czc-ping absolute inset-0 rounded-full" style={{ background: C.radar }} />
              <span className="relative inline-block h-2.5 w-2.5 rounded-full" style={{ background: C.radar }} />
            </span>
            <span className="cz-display text-xl tabular-nums" style={{ fontWeight: 600 }}>
              {tx.online(onlineCount)}
            </span>
          </div>
        </div>
      </header>

      <div className={`${WRAP} mt-8 grid gap-6 lg:grid-cols-[1fr_300px]`}>
        {/* Chat window */}
        <section
          className="relative flex h-[min(74vh,780px)] min-h-[480px] flex-col border"
          style={{ background: C.panel, borderColor: C.line }}
          aria-label={tx.title}
        >
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="czc-scroll flex-1 overflow-y-auto px-3 py-4 md:px-5"
            style={{ backgroundImage: GRID_BG, backgroundSize: "32px 32px" }}
            aria-live="polite"
            aria-relevant="additions"
          >
            {loadingMessages && (
              <div className="flex flex-col gap-4 p-2" aria-label={tx.loading}>
                {[62, 40, 75, 52, 30].map((w, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="czc-shimmer h-9 w-9 shrink-0 rounded-full" />
                    <span className="flex-1">
                      <span className="czc-shimmer block h-3 w-28" />
                      <span className="czc-shimmer mt-2 block h-3" style={{ width: `${w}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!loadingMessages && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <span className="relative inline-block h-20 w-20 overflow-hidden rounded-full" style={{ border: `1px solid ${C.radar}` }} aria-hidden="true">
                  <span className="absolute inset-[30%] rounded-full" style={{ border: `1px solid ${C.lineStrong}` }} />
                  <span
                    className="czc-sweep absolute inset-0"
                    style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 290deg, rgba(143,191,79,0.55) 360deg)" }}
                  />
                </span>
                <p className="max-w-xs text-sm" style={{ color: C.muted }}>
                  {tx.empty}
                </p>
              </div>
            )}

            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
              const isGrouped =
                !newDay &&
                prev &&
                prev.username === msg.username &&
                new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;

              const info = profileMap.get(msg.username);
              const isTeam = teamUsernames.has(msg.username);
              const isAdminUser = info?.is_admin ?? false;
              const isOwnerUser = info?.is_owner ?? false;
              const highlighted = isTeam || isAdminUser || isOwnerUser;
              const isMine = !!username && msg.username === username;
              const mentionsMe =
                !!username && !isMine && msg.content.toLowerCase().includes(`@${username.toLowerCase()}`);
              const isNew = initialIdsRef.current !== null && !initialIdsRef.current.has(msg.id);

              let badge: { label: string; color: string; filled: boolean } | null = null;
              if (isOwnerUser) badge = { label: tx.owner, color: C.amber, filled: true };
              else if (isAdminUser) badge = { label: tx.admin, color: C.amber, filled: false };
              else if (isTeam) badge = { label: tx.team, color: C.radar, filled: false };

              const accent = mentionsMe ? C.amber : highlighted ? (isTeam && !isAdminUser && !isOwnerUser ? C.radar : C.amberDim) : "transparent";

              return (
                <Fragment key={msg.id}>
                  {newDay && (
                    <div className="my-4 flex items-center gap-3" role="separator">
                      <span className="h-px flex-1" style={{ background: C.line }} />
                      <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
                        {dayLabel(msg.created_at)}
                      </span>
                      <span className="h-px flex-1" style={{ background: C.line }} />
                    </div>
                  )}
                  <div
                    className={`group relative flex gap-3 px-2 transition-colors hover:bg-[rgba(23,27,16,0.9)] ${isGrouped ? "py-0.5" : "mt-2 pt-2 pb-0.5"} ${isNew ? "czc-in" : ""}`}
                    style={{
                      borderInlineStart: `2px solid ${accent}`,
                      background: mentionsMe ? "rgba(232,166,61,0.07)" : isMine ? "rgba(237,234,224,0.025)" : undefined,
                    }}
                  >
                    <div className="w-9 shrink-0">
                      {!isGrouped ? (
                        <Link href={`/profile/${msg.username}`} aria-label={msg.username} className="block transition-transform hover:scale-105">
                          <Avatar src={info?.avatar_url} size={36} />
                        </Link>
                      ) : (
                        <span className="block pt-1 text-end text-[10px] tabular-nums opacity-0 transition-opacity group-hover:opacity-100" style={{ color: C.muted }}>
                          {formatTime(msg.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {!isGrouped && (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link
                            href={`/profile/${msg.username}`}
                            className="text-sm hover:underline"
                            style={{ color: highlighted ? C.amber : C.paper, fontWeight: 600 }}
                          >
                            {msg.username}
                          </Link>
                          {badge && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-px text-[10px] uppercase tracking-widest"
                              style={{
                                color: badge.filled ? C.void : badge.color,
                                background: badge.filled ? badge.color : "transparent",
                                border: `1px solid ${badge.color}`,
                                fontWeight: 700,
                              }}
                            >
                              {(isOwnerUser || isAdminUser) && <ShieldCheck size={10} aria-hidden="true" />}
                              {badge.label}
                            </span>
                          )}
                          <time dateTime={msg.created_at} className="text-xs tabular-nums" style={{ color: C.muted }}>
                            {formatTime(msg.created_at)}
                          </time>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed" style={{ color: C.paper }}>
                        {renderContent(msg.content)}
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        className="absolute end-2 top-1 inline-flex h-8 w-8 items-center justify-center opacity-0 transition-opacity hover:bg-[rgba(220,38,38,0.14)] focus:opacity-100 group-hover:opacity-100"
                        style={{ color: LOSS_TEXT }}
                        onClick={() => handleDelete(msg.id)}
                        aria-label={tx.del}
                        title={tx.del}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>

          {/* New messages pill */}
          {unseen > 0 && (
            <button
              onClick={jumpToLatest}
              className="czc-pop absolute left-1/2 z-10 inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest shadow-lg"
              style={{ bottom: 96, background: C.amber, color: C.void, fontWeight: 700, boxShadow: "0 6px 24px rgba(0,0,0,0.5)" }}
            >
              <ArrowDown size={14} aria-hidden="true" />
              {tx.newMessages(unseen)}
            </button>
          )}

          {/* Typing indicator */}
          <div className="flex h-7 items-center gap-2 px-5 text-xs" style={{ color: C.muted }} aria-live="polite">
            {typingText && (
              <>
                <span className="inline-flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="czc-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: C.amber, animationDelay: `${d * 0.15}s` }} />
                  ))}
                </span>
                <span>{typingText}</span>
              </>
            )}
          </div>

          {/* Composer */}
          <div className="border-t p-3 md:p-4" style={{ borderColor: C.line }}>
            {!loadingUser && !username && (
              <div className="flex flex-wrap items-center justify-center gap-2 py-2 text-sm" style={{ color: C.muted }}>
                <Link
                  href="/login"
                  className="inline-flex min-h-[40px] items-center gap-2 px-4 text-xs uppercase tracking-widest"
                  style={{ background: C.amber, color: C.void, fontWeight: 700 }}
                >
                  <LogIn size={14} aria-hidden="true" className="rtl:-scale-x-100" />
                  {tx.signIn}
                </Link>
                <span>{tx.signInRest}</span>
              </div>
            )}

            {!loadingUser && username && isBanned && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm" style={{ color: LOSS_TEXT }}>
                <Ban size={16} aria-hidden="true" />
                {tx.banned}
              </div>
            )}

            {!loadingUser && username && !isBanned && (
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <label className="relative flex-1">
                  <span className="sr-only">{tx.placeholder}</span>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    placeholder={tx.placeholder}
                    maxLength={MAX_LENGTH}
                    className="min-h-[48px] w-full border bg-[#0A0C08] pe-12 ps-4 text-[15px] text-[#EDEAE0] transition-colors focus:border-[#E8A63D]"
                    style={{ borderColor: C.amberDim }}
                  />
                  {/* character ring */}
                  <span
                    className="absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center"
                    style={{ insetInlineEnd: 12 }}
                    title={tx.charsLeft(MAX_LENGTH - used)}
                    aria-hidden={used === 0}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r={RING_R} fill="none" stroke={C.line} strokeWidth="2.5" />
                      <circle
                        cx="12"
                        cy="12"
                        r={RING_R}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="2.5"
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * (1 - ratio)}
                        strokeLinecap="round"
                        transform="rotate(-90 12 12)"
                        style={{ transition: "stroke-dashoffset 0.15s ease, stroke 0.2s ease" }}
                      />
                    </svg>
                    {ratio > 0.8 && (
                      <span className="absolute text-[9px] tabular-nums" style={{ color: ringColor }}>
                        {MAX_LENGTH - used}
                      </span>
                    )}
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="relative inline-flex min-h-[48px] items-center gap-2 overflow-hidden px-5 text-xs uppercase tracking-widest transition-[filter,opacity] hover:brightness-110 disabled:opacity-50"
                  style={{ background: C.amber, color: C.void, fontWeight: 700 }}
                >
                  <Send size={15} aria-hidden="true" className="rtl:-scale-x-100" />
                  <span className="hidden sm:inline">{tx.send}</span>
                  {/* cooldown bar */}
                  {cooling && (
                    <span key={lastSentAt} className="czc-cool absolute inset-x-0 bottom-0 h-[3px]" style={{ background: C.void, opacity: 0.55 }} aria-hidden="true" />
                  )}
                </button>
              </form>
            )}

            {error && (
              <p key={errorKey} className="czc-shake mt-2 text-sm" style={{ color: LOSS_TEXT }} role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Side panel */}
        <aside className="hidden flex-col gap-6 lg:flex">
          <div className="border p-5" style={{ background: C.panel, borderColor: C.line }}>
            <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.radar }}>
              <Users size={14} aria-hidden="true" />
              {tx.onlineNow}
            </div>
            <ul className="czc-scroll flex max-h-[340px] flex-col gap-1 overflow-y-auto">
              {onlineNames.map((name) => (
                <li key={name} className="czc-in">
                  <Link href={`/profile/${name}`} className="flex items-center gap-3 px-1 py-1.5 transition-colors hover:bg-[#171B10]">
                    <span className="relative">
                      <Avatar src={profileMap.get(name)?.avatar_url} size={28} />
                      <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full" style={{ background: C.radar, border: `2px solid ${C.panel}` }} />
                    </span>
                    <span className="truncate text-sm" style={{ color: C.paper }}>
                      {name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {guestCount > 0 && (
              <p className="mt-3 text-xs" style={{ color: C.muted }}>
                {tx.guests(guestCount)}
              </p>
            )}
          </div>

          <div className="border p-5" style={{ background: C.panel, borderColor: C.line }}>
            <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
              <MessageSquare size={14} aria-hidden="true" />
              {tx.rules}
            </div>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed" style={{ color: C.paper }}>
              {[tx.rule1, tx.rule2, tx.rule3].map((r) => (
                <li key={r} className="flex gap-2">
                  <span style={{ color: C.amber }} aria-hidden="true">›</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
