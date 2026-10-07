"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Crosshair, Radio, UserCheck, Check, X, Clock, BellRing, BellOff, Search, LogIn, Info, Loader2, Shield, Signal, Star, ArrowUpRight, Send, Satellite } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useFeedback } from "@/components/FeedbackProvider";
import { useOnlinePlayers } from "@/lib/presence";
import { PLAY_MODES, notifyServer, pushSupported, currentPushSubscription, enablePush, disablePush, type Challenge, type ReadyPlayer, type PlayMode } from "@/lib/play";
import ChallengeButton from "@/components/play/ChallengeButton";

const WRAP = "mx-auto max-w-[1400px] px-5 md:px-12";
const RED = "#DC2626";
const LOSS = "#F87171";
const SWEEP_S = 4; // seconds per radar turn
const DURATIONS = [30, 60, 120, 180];

const TIERS: [number, { en: string; ar: string }][] = [
  [-Infinity, { en: "Private", ar: "جندي" }], [900, { en: "Corporal", ar: "عريف" }], [1000, { en: "Sergeant", ar: "رقيب" }], [1100, { en: "Lieutenant", ar: "ملازم" }],
  [1200, { en: "Captain", ar: "نقيب" }], [1300, { en: "Major", ar: "رائد" }], [1400, { en: "Colonel", ar: "عقيد" }], [1500, { en: "Brigadier General", ar: "عميد" }],
  [1600, { en: "General", ar: "لواء" }], [1700, { en: "Commander", ar: "قائد" }],
];
const tierOf = (r: number) => TIERS.reduce((acc, [min, t]) => (r >= min ? t : acc), TIERS[0][1]);

// Arabic needs a native review.
const TEXT = {
  en: {
    ticker: "Command channel // Matchmaking", nominal: "All systems nominal", utc: "UTC",
    title: "Find a game", sub: "Scan the field, deploy when you're ready, and challenge any commander on the network.",
    readiness: "Combat readiness", levels: ["Quiet", "Low", "Elevated", "High", "Maximum"],
    online: "Online", ready: "Ready", incoming: "Incoming", status: "Your status", deployed: "Deployed", standby: "Standby",
    radar: "Tactical radar", radarSub: "Click a contact to lock on.", you: "You", legendReady: "Ready", legendOnline: "Online",
    noContacts: "No other contacts on the network right now.",
    target: "Target lock", noTarget: "Select a contact on the radar, or search below.", rating: "Team rating", readyFor: "Ready for", onPage: "On",
    left: (m: number) => `${m} min left`, profile: "Profile", acquired: "Target acquired",
    deploy: "Deploy", deploySub: "Tell every commander you're ready to fight.", modes: "Modes", notePh: "e.g. need 2 more for 4v4", for: "For",
    min: (m: number) => (m < 60 ? `${m} min` : `${m / 60} h`), goReady: "I'm ready", stop: "Stand down", postDiscord: "Post in Discord",
    deployedFor: (m: number) => `Deployed — ${m} min left on the ready list`,
    transmissions: "Incoming transmissions", noTransmissions: "No orders waiting. The field is quiet.", accept: "Accept", decline: "Decline", report: "Report the result", accepted: "Accepted",
    units: "Ready units", noUnits: "Nobody deployed yet. Be the first.",
    dispatched: "Dispatched orders", cancel: "Cancel", st: { pending: "Awaiting reply", accepted: "Accepted — go play!", declined: "Declined", cancelled: "Cancelled" }, expired: "Expired",
    manual: "Manual targeting", manualPh: "Type a commander's name",
    radio: "Field radio", radioOn: "On — challenges ping this device", radioOff: "Get pinged on this phone or computer when someone challenges you.", turnOn: "Turn on", turnOff: "Turn off",
    radioNoSupport: "Not available in this browser. On iPhone: install the app to your home screen first (Share → Add to Home Screen), then open it from there.",
    signIn: "Sign in to deploy and challenge commanders.", login: "Log in",
    notReady: "Find a game isn't switched on yet — an admin needs to run sql/play.sql once in Supabase.",
  },
  ar: {
    ticker: "قناة القيادة // البحث عن مباراة", nominal: "كل الأنظمة تعمل", utc: "UTC",
    title: "ابحث عن مباراة", sub: "امسح الميدان، انتشر عندما تكون جاهزاً، وتحدَّ أي قائد على الشبكة.",
    readiness: "الجاهزية القتالية", levels: ["هادئ", "منخفض", "مرتفع", "عالٍ", "قصوى"],
    online: "متصل", ready: "جاهز", incoming: "وارد", status: "حالتك", deployed: "منتشر", standby: "استعداد",
    radar: "الرادار التكتيكي", radarSub: "اضغط على هدف لتثبيته.", you: "أنت", legendReady: "جاهز", legendOnline: "متصل",
    noContacts: "لا توجد أهداف أخرى على الشبكة الآن.",
    target: "تثبيت الهدف", noTarget: "اختر هدفاً على الرادار أو ابحث بالأسفل.", rating: "تقييم الفرق", readyFor: "جاهز لـ", onPage: "في",
    left: (m: number) => `باقي ${m} د`, profile: "الملف", acquired: "تم تحديد الهدف",
    deploy: "انتشار", deploySub: "أخبر كل القادة أنك جاهز للقتال.", modes: "الأنماط", notePh: "مثال: نحتاج لاعبَين لـ 4v4", for: "لمدة",
    min: (m: number) => (m < 60 ? `${m} د` : `${m / 60} س`), goReady: "أنا جاهز", stop: "انسحاب", postDiscord: "انشر في ديسكورد",
    deployedFor: (m: number) => `منتشر — باقي ${m} دقيقة في قائمة الجاهزين`,
    transmissions: "إرسالات واردة", noTransmissions: "لا أوامر بانتظارك. الميدان هادئ.", accept: "قبول", decline: "رفض", report: "أبلغ عن النتيجة", accepted: "مقبول",
    units: "وحدات جاهزة", noUnits: "لم ينتشر أحد بعد. كن الأول.",
    dispatched: "أوامر مُرسلة", cancel: "إلغاء", st: { pending: "بانتظار الرد", accepted: "مقبول — العبوا!", declined: "مرفوض", cancelled: "ملغى" }, expired: "منتهي",
    manual: "استهداف يدوي", manualPh: "اكتب اسم قائد",
    radio: "اللاسلكي الميداني", radioOn: "مفعّل — ستصلك التحديات على هذا الجهاز", radioOff: "استلم تنبيهاً على هذا الهاتف أو الكمبيوتر عندما يتحداك أحد.", turnOn: "تفعيل", turnOff: "إيقاف",
    radioNoSupport: "غير متاحة في هذا المتصفح. على الآيفون: ثبّت التطبيق على الشاشة الرئيسية أولاً ثم افتحه من هناك.",
    signIn: "سجّل الدخول للانتشار وتحدي القادة.", login: "تسجيل الدخول",
    notReady: "الميزة غير مفعّلة بعد — يجب على أحد المشرفين تشغيل sql/play.sql مرة واحدة في Supabase.",
  },
};

const CSS = `
@keyframes czw-sweep { to { transform: rotate(360deg); } }
@keyframes czw-blip { 0% { opacity: 1; transform: translate(-50%, -50%) scale(1.35); filter: brightness(1.6); } 30% { opacity: 0.95; transform: translate(-50%, -50%) scale(1); filter: none; } 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); } }
@keyframes czw-ring { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(2.4); opacity: 0; } }
@keyframes czw-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes czw-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
@keyframes czw-spin { to { transform: rotate(360deg); } }
@keyframes czw-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes czw-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes czw-glitch { 0%, 94%, 100% { transform: none; text-shadow: none; } 95% { transform: translate(-2px, 1px); text-shadow: 2px 0 #8FBF4F, -2px 0 #DC2626; } 97% { transform: translate(2px, -1px); text-shadow: -2px 0 #8FBF4F, 2px 0 #DC2626; } }
.czw-sweep { animation: czw-sweep ${SWEEP_S}s linear infinite; }
.czw-blip { animation: czw-blip ${SWEEP_S}s linear infinite; }
.czw-ring { animation: czw-ring 2s ease-out infinite; }
.czw-in { animation: czw-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czw-scan { animation: czw-scan 2.6s linear infinite; }
.czw-spin { animation: czw-spin 6s linear infinite; }
.czw-blink { animation: czw-blink 1.1s steps(2) infinite; }
.czw-ticker { animation: czw-ticker 30s linear infinite; }
.czw-glitch { animation: czw-glitch 5s steps(1) infinite; }
.czw-scanlines { background-image: repeating-linear-gradient(0deg, rgba(237,234,224,0.025) 0px, rgba(237,234,224,0.025) 1px, transparent 1px, transparent 3px); }
.czw-plate { transition: transform 0.15s ease, background-color 0.2s ease, border-color 0.2s ease; }
.czw-plate:active { transform: scale(0.97); }
.czw-tag { transition: transform 0.25s ease, border-color 0.25s ease; }
.czw-tag:hover { transform: translateY(-3px); border-color: #8A6425 !important; }
@media (prefers-reduced-motion: reduce) {
  .czw-sweep, .czw-blip, .czw-ring, .czw-in, .czw-scan, .czw-spin, .czw-blink, .czw-ticker, .czw-glitch { animation: none !important; }
  .czw-blip { opacity: 1; transform: translate(-50%, -50%); }
  .czw-tag:hover { transform: none; }
}
`;

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
};

function Brackets({ color = C.amberDim, size = 14 }: { color?: string; size?: number }) {
  const s = { width: size, height: size, borderColor: color } as const;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute left-0 top-0 border-l-2 border-t-2" style={s} />
      <span className="absolute right-0 top-0 border-r-2 border-t-2" style={s} />
      <span className="absolute bottom-0 left-0 border-b-2 border-l-2" style={s} />
      <span className="absolute bottom-0 right-0 border-b-2 border-r-2" style={s} />
    </span>
  );
}

function Panel({ code, icon: Icon, title, children, accent = C.amber, right, className = "", delay = 0 }: { code: string; icon: typeof Radio; title: string; children: ReactNode; accent?: string; right?: ReactNode; className?: string; delay?: number }) {
  return (
    <section className={`czw-in relative border ${className}`} style={{ background: "linear-gradient(180deg, #12150E, #0E110B)", borderColor: C.line, animationDelay: `${delay}s` }}>
      <Brackets />
      <header className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: C.line }}>
        <h2 className="flex min-w-0 items-center gap-2.5">
          <span className="text-[10px] tracking-[0.2em]" style={{ color: C.muted, fontFamily: "var(--font-mono), monospace" }}>{code}</span>
          <Icon size={15} style={{ color: accent }} aria-hidden="true" />
          <span className="cz-display truncate text-lg uppercase" style={{ fontWeight: 700, letterSpacing: "0.04em" }}>{title}</span>
        </h2>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

type Contact = { username: string; ready?: ReadyPlayer; page?: string; rating: number; avatar: string | null };

export default function PlayView() {
  const supabase = useMemo(() => createClient(), []);
  const fb = useFeedback();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const online = useOnlinePlayers();

  const [me, setMe] = useState<{ id: string; username: string } | null | undefined>(undefined);
  const [ready, setReady] = useState<ReadyPlayer[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [works, setWorks] = useState(true);
  const [people, setPeople] = useState<Record<string, { avatar: string | null; rating: number }>>({});
  const [modes, setModes] = useState<PlayMode[]>(["2v2"]);
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [postReady, setPostReady] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [push, setPush] = useState<"unsupported" | "off" | "on" | "loading">("loading");
  const [find, setFind] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [target, setTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r, c] = await Promise.all([
      supabase.from("ready_players").select("*").gt("until", new Date().toISOString()).order("updated_at", { ascending: false }),
      supabase.from("challenges").select("*").order("created_at", { ascending: false }).limit(40),
    ]);
    if (r.error) return setWorks(false);
    setReady((r.data ?? []) as ReadyPlayer[]);
    setChallenges((c.data ?? []) as Challenge[]);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
        setMe(data?.username ? { id: user.id, username: data.username } : null);
      } else setMe(null);
      const { data: all } = await supabase.from("profiles").select("username, avatar_url, rating_team").eq("banned", false).order("username");
      const list = (all ?? []) as { username: string; avatar_url: string | null; rating_team: number | null }[];
      setPeople(Object.fromEntries(list.map((p) => [p.username, { avatar: p.avatar_url, rating: Math.round(Number(p.rating_team ?? 1000)) }])));
      await load();
    })();
    const t = setInterval(() => void load(), 30_000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(t);
      clearInterval(clock);
    };
  }, [supabase, load]);

  useEffect(() => {
    if (!pushSupported()) return setPush("unsupported");
    currentPushSubscription().then((s) => setPush(s ? "on" : "off"));
  }, []);

  const mine = me ? ready.find((r) => r.user_id === me.id) : undefined;
  const incoming = me ? challenges.filter((c) => c.to_user === me.id && c.status === "pending" && Date.parse(c.expires_at) > now) : [];
  const recentAccepted = me ? challenges.filter((c) => c.to_user === me.id && c.status === "accepted").slice(0, 3) : [];
  const outgoing = me ? challenges.filter((c) => c.from_user === me.id).slice(0, 8) : [];
  const names = Object.keys(people);

  // contacts on the radar: everyone online or ready, except you
  const contacts = useMemo(() => {
    const map = new Map<string, Contact>();
    for (const o of online) if (o.username !== me?.username) map.set(o.username, { username: o.username, page: o.page, rating: people[o.username]?.rating ?? 1000, avatar: people[o.username]?.avatar ?? null });
    for (const r of ready) if (r.username !== me?.username) map.set(r.username, { ...(map.get(r.username) ?? { username: r.username, rating: people[r.username]?.rating ?? 1000, avatar: people[r.username]?.avatar ?? null }), ready: r });
    return Array.from(map.values());
  }, [online, ready, people, me]);

  // Radar positions: each player has a fixed spot (from their name); if two land too close,
  // the later one is nudged around the ring until it has room for its label.
  const blips = useMemo(() => {
    const placed: { c: Contact; x: number; y: number; angle: number }[] = [];
    for (const c of [...contacts].sort((a, b) => a.username.localeCompare(b.username))) {
      let angle = hash(c.username) * 360;
      const r = c.ready ? 18 + hash(c.username + "r") * 14 : 34 + hash(c.username + "o") * 10;
      let x = 0, y = 0;
      for (let i = 0; i < 36; i++) {
        const rad = (angle * Math.PI) / 180;
        x = 50 + Math.sin(rad) * r;
        y = 50 - Math.cos(rad) * r;
        if (placed.every((p) => Math.abs(p.x - x) > 16 || Math.abs(p.y - y) > 7)) break;
        angle = (angle + 17) % 360;
      }
      placed.push({ c, x, y, angle });
    }
    return placed;
  }, [contacts]);

  useEffect(() => {
    if (me === undefined) return; // still finding out who you are
    if (target && target === me?.username) return setTarget(null);
    if (!target && contacts.length) setTarget((contacts.find((c) => c.ready) ?? contacts[0]).username);
  }, [contacts, target, me]);
  const locked = contacts.find((c) => c.username === target) ?? (target && people[target] ? { username: target, rating: people[target].rating, avatar: people[target].avatar } : null);

  const readiness = Math.min(4, Math.floor(ready.length / 2) + (online.length >= 5 ? 1 : 0) + (ready.length ? 1 : 0));
  const readinessColor = [C.muted, C.radar, C.amber, "#F59E0B", RED][readiness];

  async function goReady() {
    if (!me || modes.length === 0) return;
    setBusy("ready");
    const { error } = await supabase.from("ready_players").upsert({ user_id: me.id, username: me.username, modes, note: note.trim() || null, until: new Date(Date.now() + minutes * 60_000).toISOString(), updated_at: new Date().toISOString() });
    setBusy(null);
    if (error) return fb.error(error.message);
    void notifyServer("ready", undefined, postReady);
    load();
  }
  async function stopReady() {
    if (!me) return;
    setBusy("ready");
    await supabase.from("ready_players").delete().eq("user_id", me.id);
    setBusy(null);
    load();
  }
  async function respond(c: Challenge, accept: boolean) {
    setBusy(c.id);
    const { error } = await supabase.rpc("respond_challenge", { p_id: c.id, p_accept: accept });
    setBusy(null);
    if (error) return fb.error(error.message);
    void notifyServer("challenge", c.id, accept);
    load();
  }
  async function cancel(c: Challenge) {
    setBusy(c.id);
    const { error } = await supabase.rpc("cancel_challenge", { p_id: c.id });
    setBusy(null);
    if (error) return fb.error(error.message);
    load();
  }
  async function togglePush() {
    setPush("loading");
    if (push === "on") {
      await disablePush();
      return setPush("off");
    }
    const err = await enablePush();
    if (err) {
      fb.error(err);
      return setPush("off");
    }
    setPush("on");
  }

  const minsLeft = (iso: string) => Math.max(1, Math.round((Date.parse(iso) - now) / 60000));
  const ago = (iso: string) => {
    const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
    return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(m > 59 ? -Math.round(m / 60) : -m, m > 59 ? "hour" : "minute");
  };
  const avatar = (n: string, s: number, ring: string = C.lineStrong) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={people[n]?.avatar || "/default-avatar.svg"} alt="" className="shrink-0 rounded-full object-cover" style={{ width: s, height: s, border: `2px solid ${ring}` }} />
  );
  const clock = new Date(now).toISOString().slice(11, 19);
  const findMatch = names.find((n) => n.toLowerCase() === find.trim().toLowerCase() && n !== me?.username);
  const mono = { fontFamily: "var(--font-mono), monospace" } as const;

  return (
    <main className="relative min-h-screen w-full overflow-x-clip pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{CSS}</style>
      <div aria-hidden="true" className="czw-scanlines pointer-events-none fixed inset-0 z-0" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[620px]" style={{ background: "radial-gradient(ellipse 60% 55% at 70% 20%, rgba(143,191,79,0.10), transparent 65%), radial-gradient(ellipse 50% 50% at 10% 0%, rgba(220,38,38,0.08), transparent 60%)" }} />

      {/* ticker */}
      <div className="relative z-[1] overflow-hidden border-b" style={{ borderColor: C.line, background: "#070806" }} dir="ltr">
        <div className="czw-ticker flex w-max gap-12 whitespace-nowrap py-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.muted, ...mono }}>
          {[0, 1].map((k) => (
            <span key={k} className="flex gap-12">
              <span><span style={{ color: C.radar }}>●</span> {tx.ticker}</span>
              <span>{tx.online}: {online.length}</span>
              <span>{tx.ready}: {ready.length}</span>
              <span style={{ color: readinessColor }}>{tx.readiness}: {tx.levels[readiness]}</span>
              <span>{tx.nominal}</span>
              <span>{clock} {tx.utc}</span>
            </span>
          ))}
        </div>
      </div>

      {/* hero */}
      <header className="relative z-[1]">
        <div className={`${WRAP} pb-8 pt-12 md:pt-16`}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="czw-in">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.radar, ...mono }}>
                <Satellite size={14} aria-hidden="true" />
                <span className="czw-blink inline-block h-1.5 w-1.5 rounded-full" style={{ background: RED }} />
                Live · {clock} {tx.utc}
              </div>
              <h1 className="czw-glitch cz-display mt-3 uppercase leading-[0.85]" style={{ fontSize: "clamp(3.2rem, 9vw, 7.5rem)", fontWeight: 700, color: C.paper }}>{tx.title}</h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: C.muted }}>{tx.sub}</p>
            </div>
            {/* readiness gauge */}
            <div className="czw-in relative w-full max-w-[360px] border p-4" style={{ borderColor: C.line, background: "#0E110B", animationDelay: "0.1s" }}>
              <Brackets color={readinessColor} size={10} />
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em]" style={{ color: C.muted, ...mono }}>
                <span>{tx.readiness}</span>
                <span style={{ color: readinessColor, fontWeight: 700 }}>{tx.levels[readiness]}</span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5" dir="ltr">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-3" style={{ background: i <= readiness ? [C.radar, C.radar, C.amber, "#F59E0B", RED][i] : C.line, boxShadow: i <= readiness && i === readiness ? `0 0 12px ${readinessColor}` : "none", transition: "background 0.4s ease" }} />
                ))}
              </div>
            </div>
          </div>

          {/* HUD stats */}
          <div className="czw-in mt-8 grid grid-cols-2 gap-px border md:grid-cols-4" style={{ background: C.line, borderColor: C.line, animationDelay: "0.15s" }}>
            {[
              { label: tx.online, value: online.length, color: C.radar, icon: Signal },
              { label: tx.ready, value: ready.length, color: C.amber, icon: UserCheck },
              { label: tx.incoming, value: incoming.length, color: incoming.length ? RED : C.muted, icon: Radio },
              { label: tx.status, value: mine ? tx.deployed : tx.standby, color: mine ? C.radar : C.muted, icon: Shield },
            ].map((s) => (
              <div key={s.label} className="relative min-w-0 px-4 py-4 sm:px-5" style={{ background: "#0E110B" }}>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em]" style={{ color: C.muted, ...mono }}><s.icon size={12} aria-hidden="true" />{s.label}</div>
                <div className="cz-display mt-1 truncate text-3xl uppercase leading-none tabular-nums sm:text-4xl" style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className={`${WRAP} relative z-[1]`}>
        {me === null && (
          <div className="czw-in mb-6 flex flex-wrap items-center gap-4 border p-5" style={{ borderColor: C.amberDim, background: "#0E110B" }}>
            <span className="flex-1">{tx.signIn}</span>
            <Link href="/login" className="inline-flex min-h-[44px] items-center gap-2 px-5 text-xs uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}><LogIn size={15} className="rtl:-scale-x-100" aria-hidden="true" />{tx.login}</Link>
          </div>
        )}
        {!works && <p className="mb-6 flex items-start gap-2 border p-5 text-sm" style={{ borderColor: C.amberDim, background: "#0E110B", color: C.muted }}><Info size={17} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />{tx.notReady}</p>}

        {/* ===== radar + target lock ===== */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Panel code="01" icon={Crosshair} title={tx.radar} accent={C.radar} delay={0.2}
            right={<span className="hidden items-center gap-4 text-[10px] uppercase tracking-[0.2em] sm:flex" style={{ color: C.muted, ...mono }}><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: C.amber }} />{tx.legendReady}</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: C.radar }} />{tx.legendOnline}</span></span>}>
            <p className="-mt-1 mb-4 text-xs" style={{ color: C.muted }}>{tx.radarSub}</p>
            <div className="relative mx-auto aspect-square w-full max-w-[560px]" dir="ltr">
              {/* scope */}
              <div className="absolute inset-0 overflow-hidden rounded-full" style={{ background: "radial-gradient(circle, rgba(143,191,79,0.10), rgba(10,12,8,0.95) 70%)", border: `2px solid ${C.radar}`, boxShadow: "0 0 40px rgba(143,191,79,0.15), inset 0 0 60px rgba(0,0,0,0.6)" }}>
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  {[16, 30, 44].map((r) => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={C.lineStrong} strokeWidth="0.3" />)}
                  <line x1="50" y1="2" x2="50" y2="98" stroke={C.lineStrong} strokeWidth="0.25" />
                  <line x1="2" y1="50" x2="98" y2="50" stroke={C.lineStrong} strokeWidth="0.25" />
                  {Array.from({ length: 36 }, (_, i) => {
                    const a = (i * 10 * Math.PI) / 180, long = i % 3 === 0;
                    return <line key={i} x1={50 + Math.sin(a) * 48} y1={50 - Math.cos(a) * 48} x2={50 + Math.sin(a) * (long ? 45 : 46.5)} y2={50 - Math.cos(a) * (long ? 45 : 46.5)} stroke={C.radar} strokeWidth={long ? 0.5 : 0.25} opacity="0.6" />;
                  })}
                  {["N", "E", "S", "W"].map((d, i) => <text key={d} x={50 + [0, 41, 0, -41][i]} y={50 + [-39, 1.5, 42, 1.5][i]} textAnchor="middle" fontSize="3" fill={C.muted} style={mono}>{d}</text>)}
                </svg>
                <div className="czw-sweep absolute inset-0" style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 300deg, rgba(143,191,79,0.08) 330deg, rgba(143,191,79,0.55) 360deg)" }} />
              </div>
              {/* you */}
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "rgba(232,166,61,0.15)", border: `1px solid ${C.amber}` }}>
                  <span className="czw-ring absolute inset-0 rounded-full" style={{ border: `1px solid ${C.amber}` }} />
                  <Star size={16} style={{ color: C.amber }} fill={C.amber} aria-hidden="true" />
                </span>
                <span className="mt-1 text-[9px] uppercase tracking-[0.2em]" style={{ color: C.amber, ...mono }}>{tx.you}</span>
              </div>
              {/* contacts */}
              {blips.map(({ c, x, y, angle }) => {
                const color = c.ready ? C.amber : C.radar;
                const on = target === c.username;
                return (
                  <button
                    key={c.username}
                    type="button"
                    onClick={() => setTarget(c.username)}
                    aria-pressed={on}
                    aria-label={`${c.username}${c.ready ? ` — ${tx.legendReady}` : ""}`}
                    className="czw-blip group absolute z-[2] flex flex-col items-center"
                    style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(angle / 360) * SWEEP_S - SWEEP_S}s` }}
                  >
                    <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                      {c.ready && <span className="czw-ring absolute inset-0 rounded-full" style={{ border: `1px solid ${color}` }} />}
                      <span className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
                      {on && <span className="czw-spin absolute -inset-3 rounded-full border border-dashed" style={{ borderColor: RED }} />}
                    </span>
                    <span className="mt-1 whitespace-nowrap px-1 text-[10px] uppercase tracking-wider" style={{ color: on ? C.paper : color, background: on ? "rgba(220,38,38,0.85)" : "rgba(10,12,8,0.7)", ...mono }}>{c.username}</span>
                  </button>
                );
              })}
              {contacts.length === 0 && (
                <div className="absolute inset-x-0 bottom-[14%] text-center text-xs uppercase tracking-[0.2em]" style={{ color: C.muted, ...mono }}>{tx.noContacts}</div>
              )}
            </div>
          </Panel>

          <div className="flex flex-col gap-6">
            {/* target lock */}
            <Panel code="02" icon={Crosshair} title={tx.target} accent={RED} delay={0.25}>
              {!locked ? (
                <p className="text-sm" style={{ color: C.muted }}>{tx.noTarget}</p>
              ) : (
                <div key={locked.username} className="czw-in">
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      {avatar(locked.username, 92, RED)}
                      <svg viewBox="0 0 100 100" className="czw-spin pointer-events-none absolute -inset-3 h-[calc(100%+24px)] w-[calc(100%+24px)]" aria-hidden="true">
                        <circle cx="50" cy="50" r="47" fill="none" stroke={RED} strokeWidth="1.2" strokeDasharray="12 8" />
                      </svg>
                      {[0, 90, 180, 270].map((d) => <span key={d} className="absolute left-1/2 top-1/2 h-3 w-[2px]" style={{ background: RED, transform: `translate(-50%, -50%) rotate(${d}deg) translateY(-58px)` }} aria-hidden="true" />)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: RED, ...mono }}><span className="czw-blink">▮</span> {tx.acquired}</div>
                      <div className="cz-display mt-1 truncate text-4xl uppercase leading-none" style={{ fontWeight: 700 }}>{locked.username}</div>
                      <div className="mt-2 text-sm" style={{ color: C.amber, fontWeight: 600 }}>{tierOf(locked.rating)[lang]} · <span style={{ color: C.paper }}>{locked.rating}</span> <span className="text-xs" style={{ color: C.muted }}>{tx.rating}</span></div>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-px border text-sm" style={{ background: C.line, borderColor: C.line }}>
                    {"ready" in locked && locked.ready ? (
                      <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ background: "#0E110B" }}>
                        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted, ...mono }}>{tx.readyFor}</span>
                        {locked.ready.modes.map((m) => <span key={m} className="border px-2 py-0.5 text-xs uppercase tracking-widest" style={{ borderColor: C.amber, color: C.amber, fontWeight: 700 }}>{m}</span>)}
                        <span className="ms-auto inline-flex items-center gap-1 text-xs" style={{ color: C.muted }}><Clock size={12} aria-hidden="true" />{tx.left(minsLeft(locked.ready.until))}</span>
                      </div>
                    ) : null}
                    {"page" in locked && locked.page ? (
                      <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#0E110B" }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: C.radar }} />
                        <span className="text-xs" style={{ color: C.muted, ...mono }}>{tx.onPage} {locked.page}</span>
                      </div>
                    ) : null}
                    {"ready" in locked && locked.ready?.note ? <div className="px-4 py-3 text-sm italic" style={{ background: "#0E110B" }}>“{locked.ready.note}”</div> : null}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {me && locked.username !== me.username && <ChallengeButton username={locked.username} defaultMode={("ready" in locked && locked.ready?.modes[0]) || "2v2"} />}
                    <Link href={`/profile/${locked.username}`} className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.paper }}>{tx.profile}<ArrowUpRight size={14} className="rtl:-scale-x-100" aria-hidden="true" /></Link>
                  </div>
                </div>
              )}
            </Panel>

            {/* deploy */}
            {me && works && (
              <Panel code="03" icon={Shield} title={tx.deploy} accent={C.radar} delay={0.3}>
                {mine ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="relative inline-flex h-3 w-3"><span className="czw-ring absolute inset-0 rounded-full" style={{ border: `1px solid ${C.radar}` }} /><span className="relative inline-block h-3 w-3 rounded-full" style={{ background: C.radar }} /></span>
                      <span className="flex-1 text-sm" style={{ color: C.radar, fontWeight: 600 }}>{tx.deployedFor(minsLeft(mine.until))}</span>
                    </div>
                    <div className="mt-3 h-1.5 w-full" style={{ background: C.line }} dir="ltr">
                      <div className="h-full transition-[width] duration-1000" style={{ width: `${Math.min(100, ((Date.parse(mine.until) - now) / (Date.parse(mine.until) - Date.parse(mine.updated_at))) * 100)}%`, background: C.radar }} />
                    </div>
                    <button onClick={stopReady} disabled={busy === "ready"} className="mt-4 inline-flex min-h-[44px] items-center gap-2 border px-5 text-xs uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.paper }}>{tx.stop}</button>
                  </div>
                ) : (
                  <>
                    <p className="-mt-1 mb-4 text-xs" style={{ color: C.muted }}>{tx.deploySub}</p>
                    <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: C.muted, ...mono }}>{tx.modes}</div>
                    <div className="mt-2 grid grid-cols-5 gap-2" role="group" dir="ltr">
                      {PLAY_MODES.map((m) => {
                        const on = modes.includes(m);
                        return (
                          <button key={m} type="button" aria-pressed={on} onClick={() => setModes((x) => (on ? x.filter((y) => y !== m) : [...x, m]))} className="czw-plate relative flex min-h-[54px] flex-col items-center justify-center border" style={{ background: on ? "linear-gradient(180deg, rgba(232,166,61,0.25), rgba(232,166,61,0.08))" : "#0A0C08", borderColor: on ? C.amber : C.lineStrong }}>
                            <span className="cz-display text-lg uppercase leading-none" style={{ color: on ? C.amber : C.paper, fontWeight: 700 }}>{m}</span>
                            <span className="mt-1 h-1 w-6" style={{ background: on ? C.amber : C.line }} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder={tx.notePh} aria-label={tx.notePh} className="min-h-[44px] w-full border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                      <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} aria-label={tx.for} className="min-h-[44px] border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0]">
                        {DURATIONS.map((d) => <option key={d} value={d}>{tx.for} {tx.min(d)}</option>)}
                      </select>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="inline-flex min-h-[40px] flex-1 items-center gap-2 text-sm"><input type="checkbox" checked={postReady} onChange={(e) => setPostReady(e.target.checked)} style={{ accentColor: C.amber, width: 16, height: 16 }} />{tx.postDiscord}</label>
                      <button onClick={goReady} disabled={busy === "ready" || modes.length === 0} className="relative inline-flex min-h-[52px] items-center gap-2 overflow-hidden px-7 text-sm uppercase tracking-[0.18em] disabled:opacity-50" style={{ background: C.radar, color: C.void, fontWeight: 800, boxShadow: "0 0 26px rgba(143,191,79,0.35)" }}>
                        {busy === "ready" ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UserCheck size={16} aria-hidden="true" />}{tx.goReady}
                      </button>
                    </div>
                  </>
                )}
              </Panel>
            )}
          </div>
        </div>

        {/* ===== transmissions + units ===== */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          {me && (
            <Panel code="04" icon={Radio} title={tx.transmissions} accent={RED} delay={0.35} right={incoming.length ? <span className="px-2 py-0.5 text-xs text-white" style={{ background: RED, fontWeight: 800, ...mono }}>{incoming.length}</span> : null}>
              {incoming.length === 0 && recentAccepted.length === 0 ? (
                <p className="text-sm" style={{ color: C.muted }}>{tx.noTransmissions}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {incoming.map((c) => (
                    <li key={c.id} className="czw-in relative overflow-hidden border p-4" style={{ borderColor: "rgba(220,38,38,0.6)", background: "linear-gradient(120deg, rgba(220,38,38,0.12), #0A0C08 65%)" }}>
                      <span aria-hidden="true" className="czw-scan pointer-events-none absolute inset-x-0 top-0 h-full" style={{ background: "linear-gradient(180deg, transparent, rgba(220,38,38,0.10), transparent)" }} />
                      <div className="relative flex flex-wrap items-center gap-4">
                        {avatar(c.from_username, 46, RED)}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: LOSS, ...mono }}>⚔ {ago(c.created_at)}</div>
                          <div className="text-base"><Link href={`/profile/${c.from_username}`} className="hover:underline" style={{ fontWeight: 700 }}>{c.from_username}</Link> <span className="cz-display ms-1 text-xl uppercase" style={{ color: C.amber, fontWeight: 700 }}>{c.mode}</span></div>
                          {c.message && <div className="text-sm italic" style={{ color: C.paper }}>“{c.message}”</div>}
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
                          <button onClick={() => respond(c, false)} disabled={busy === c.id} className="inline-flex min-h-[42px] items-center gap-1.5 border px-3 text-xs uppercase tracking-widest disabled:opacity-50" style={{ borderColor: "rgba(248,113,113,0.6)", color: LOSS }}><X size={14} aria-hidden="true" />{tx.decline}</button>
                          <button onClick={() => respond(c, true)} disabled={busy === c.id} className="inline-flex min-h-[42px] items-center gap-1.5 px-4 text-xs uppercase tracking-widest disabled:opacity-50" style={{ background: C.radar, color: C.void, fontWeight: 800 }}>{busy === c.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{tx.accept}</button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {recentAccepted.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-3 border px-4 py-2.5 text-sm" style={{ borderColor: C.line, background: "#0A0C08" }}>
                      <Check size={15} style={{ color: C.radar }} aria-hidden="true" />
                      <span className="flex-1">{c.from_username} · {c.mode.toUpperCase()} · <span style={{ color: C.radar }}>{tx.accepted}</span></span>
                      <Link href="/report" className="text-xs uppercase tracking-widest" style={{ color: C.amber }}>{tx.report}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel code="05" icon={UserCheck} title={tx.units} accent={C.amber} delay={0.4} className={me ? "" : "lg:col-span-2"}>
            {ready.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>{tx.noUnits}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {ready.map((r) => {
                  const total = Math.max(1, Date.parse(r.until) - Date.parse(r.updated_at));
                  const pct = Math.max(0, Math.min(100, ((Date.parse(r.until) - now) / total) * 100));
                  const rating = people[r.username]?.rating ?? 1000;
                  return (
                    <li key={r.user_id} className="czw-tag relative border p-4" style={{ borderColor: C.line, background: "linear-gradient(160deg, #161A11, #0A0C08)", borderRadius: "14px 4px 14px 4px" }}>
                      <span aria-hidden="true" className="absolute end-3 top-3 h-2.5 w-2.5 rounded-full" style={{ background: "#0A0C08", border: `1px solid ${C.lineStrong}` }} />
                      <div className="flex items-center gap-3">
                        {avatar(r.username, 44, C.amber)}
                        <div className="min-w-0">
                          <button type="button" onClick={() => setTarget(r.username)} className="cz-display block truncate text-xl uppercase leading-none hover:underline" style={{ fontWeight: 700 }}>{r.username}</button>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: C.amber, ...mono }}>{tierOf(rating)[lang]} · {rating}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">{r.modes.map((m) => <span key={m} className="border px-1.5 py-px text-[11px] uppercase tracking-widest" style={{ borderColor: C.amberDim, color: C.amber }}>{m}</span>)}</div>
                      {r.note && <div className="mt-2 text-xs italic" style={{ color: C.muted }}>“{r.note}”</div>}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1 flex-1" style={{ background: C.line }} dir="ltr"><div className="h-full" style={{ width: `${pct}%`, background: pct < 20 ? RED : C.amber, transition: "width 1s linear" }} /></div>
                        <span className="text-[10px] tabular-nums" style={{ color: C.muted, ...mono }}>{tx.left(minsLeft(r.until))}</span>
                      </div>
                      {me && r.user_id !== me.id && <div className="mt-3"><ChallengeButton compact username={r.username} defaultMode={r.modes[0] ?? "2v2"} /></div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* ===== comms row ===== */}
        {me && (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
            <Panel code="06" icon={Search} title={tx.manual} delay={0.45}>
              <datalist id="play-names">{names.filter((n) => n !== me.username).map((n) => <option key={n} value={n} />)}</datalist>
              <div className="flex gap-2">
                <input list="play-names" value={find} onChange={(e) => setFind(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && findMatch) setTarget(findMatch); }} placeholder={tx.manualPh} className="min-h-[44px] min-w-0 flex-1 border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                {findMatch && <button type="button" onClick={() => setTarget(findMatch)} aria-label={tx.target} className="inline-flex min-h-[44px] w-11 items-center justify-center border" style={{ borderColor: RED, color: RED }}><Crosshair size={17} aria-hidden="true" /></button>}
              </div>
              {findMatch && <div className="mt-3"><ChallengeButton username={findMatch} /></div>}
            </Panel>

            {works && (
              <Panel code="07" icon={BellRing} title={tx.radio} delay={0.5}>
                {push === "unsupported" ? (
                  <p className="text-sm" style={{ color: C.muted }}>{tx.radioNoSupport}</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm" style={{ color: push === "on" ? C.radar : C.muted }}>{push === "on" ? tx.radioOn : tx.radioOff}</span>
                    <button onClick={togglePush} disabled={push === "loading"} className="inline-flex min-h-[44px] w-fit items-center gap-2 px-5 text-xs uppercase tracking-widest disabled:opacity-50" style={push === "on" ? { border: `1px solid ${C.lineStrong}`, color: C.paper } : { background: C.amber, color: C.void, fontWeight: 800 }}>
                      {push === "loading" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : push === "on" ? <BellOff size={15} aria-hidden="true" /> : <BellRing size={15} aria-hidden="true" />}
                      {push === "on" ? tx.turnOff : tx.turnOn}
                    </button>
                  </div>
                )}
              </Panel>
            )}

            <Panel code="08" icon={Send} title={tx.dispatched} delay={0.55}>
              {outgoing.length === 0 ? (
                <p className="text-sm" style={{ color: C.muted }}>{tx.noTransmissions}</p>
              ) : (
                <ul className="flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
                  {outgoing.map((c) => {
                    const expired = c.status === "pending" && Date.parse(c.expires_at) <= now;
                    const color = c.status === "accepted" ? C.radar : c.status === "pending" && !expired ? C.amber : C.muted;
                    return (
                      <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm" style={{ background: "#0A0C08", borderInlineStart: `3px solid ${color}` }}>
                        <span className="w-full min-w-0 truncate"><b>{c.to_username}</b> <span style={{ color: C.muted, ...mono }}>· {c.mode.toUpperCase()} · {ago(c.created_at)}</span></span>
                        <span className="me-auto text-[10px] uppercase tracking-widest" style={{ color, fontWeight: 700, ...mono }}>{expired ? tx.expired : tx.st[c.status]}</span>
                        {c.status === "pending" && !expired && <button onClick={() => cancel(c)} disabled={busy === c.id} className="text-[11px] uppercase tracking-widest underline-offset-2 hover:underline" style={{ color: C.muted }}>{tx.cancel}</button>}
                        {c.status === "accepted" && <Link href="/report" className="text-[11px] uppercase tracking-widest" style={{ color: C.amber }}>{tx.report}</Link>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>
        )}
      </div>
    </main>
  );
}
