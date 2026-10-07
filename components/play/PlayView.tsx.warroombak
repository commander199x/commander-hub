"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crosshair, Radio, UserCheck, Inbox, Send, Check, X, Clock, BellRing, BellOff, Search, LogIn, Info, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useFeedback } from "@/components/FeedbackProvider";
import { useOnlinePlayers } from "@/lib/presence";
import { PLAY_MODES, notifyServer, pushSupported, currentPushSubscription, enablePush, disablePush, type Challenge, type ReadyPlayer, type PlayMode } from "@/lib/play";
import ChallengeButton from "@/components/play/ChallengeButton";

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const LOSS = "#F87171";
const RED = "#DC2626";
const DURATIONS = [30, 60, 120, 180];

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Matchmaking", title: "Find a game", sub: "See who's around, tell everyone you're ready, and challenge anyone to a match.",
    signIn: "Sign in to challenge players and mark yourself ready.", login: "Log in",
    notReady: "Find a game isn't switched on yet — an admin needs to run sql/play.sql once in Supabase.",
    readyTitle: "I'm ready to play", readyOn: (m: number) => `You're on the ready list for ${m} more min`, modes: "Modes", note: "Note (optional)", notePh: "e.g. need 2 more for 4v4", for: "For",
    min: (m: number) => (m < 60 ? `${m} min` : `${m / 60} h`), goReady: "I'm ready", stop: "Stop", postDiscord: "Post in Discord",
    phone: "Phone notifications", phoneOn: "On — challenges ping this device", phoneOff: "Get pinged on this phone or computer when someone challenges you.", turnOn: "Turn on", turnOff: "Turn off",
    phoneNoSupport: "Not available in this browser. On iPhone: install the app to your home screen first (Share → Add to Home Screen), then open it from there.",
    inbox: "Challenges for you", accept: "Accept", decline: "Decline", sentTitle: "Challenges you sent", cancel: "Cancel", none: "Nothing here right now.",
    ready: "Ready to play", nobodyReady: "Nobody's on the ready list right now. Be the first!", left: (m: number) => `${m} min left`,
    online: "Online now", onlineSub: "Signed-in players on the site right now.", nobodyOnline: "No other signed-in players online at the moment.",
    find: "Challenge anyone", findPh: "Type a player name", you: "you",
    st: { pending: "Waiting", accepted: "Accepted — go play!", declined: "Declined", cancelled: "Cancelled" },
    report: "Report the result",
  },
  ar: {
    eyebrow: "البحث عن مباراة", title: "ابحث عن مباراة", sub: "شاهد من متواجد، أخبر الجميع أنك جاهز، وتحدَّ أي لاعب لمباراة.",
    signIn: "سجّل الدخول لتحدي اللاعبين وإعلان جاهزيتك.", login: "تسجيل الدخول",
    notReady: "الميزة غير مفعّلة بعد — يجب على أحد المشرفين تشغيل sql/play.sql مرة واحدة في Supabase.",
    readyTitle: "أنا جاهز للعب", readyOn: (m: number) => `أنت في قائمة الجاهزين لمدة ${m} دقيقة أخرى`, modes: "الأنماط", note: "ملاحظة (اختياري)", notePh: "مثال: نحتاج لاعبَين لـ 4v4", for: "لمدة",
    min: (m: number) => (m < 60 ? `${m} د` : `${m / 60} س`), goReady: "أنا جاهز", stop: "إيقاف", postDiscord: "انشر في ديسكورد",
    phone: "إشعارات الهاتف", phoneOn: "مفعّلة — ستصلك التحديات على هذا الجهاز", phoneOff: "استلم تنبيهاً على هذا الهاتف أو الكمبيوتر عندما يتحداك أحد.", turnOn: "تفعيل", turnOff: "إيقاف",
    phoneNoSupport: "غير متاحة في هذا المتصفح. على الآيفون: ثبّت التطبيق على الشاشة الرئيسية أولاً (مشاركة ← إضافة إلى الشاشة الرئيسية) ثم افتحه من هناك.",
    inbox: "تحديات لك", accept: "قبول", decline: "رفض", sentTitle: "تحديات أرسلتها", cancel: "إلغاء", none: "لا شيء هنا حالياً.",
    ready: "جاهزون للعب", nobodyReady: "لا أحد في قائمة الجاهزين الآن. كن الأول!", left: (m: number) => `باقي ${m} دقيقة`,
    online: "المتصلون الآن", onlineSub: "اللاعبون المسجّلون المتواجدون في الموقع الآن.", nobodyOnline: "لا يوجد لاعبون آخرون متصلون حالياً.",
    find: "تحدَّ أي لاعب", findPh: "اكتب اسم لاعب", you: "أنت",
    st: { pending: "بانتظار الرد", accepted: "مقبول — العبوا!", declined: "مرفوض", cancelled: "ملغى" },
    report: "أبلغ عن النتيجة",
  },
};

const CSS = `
@keyframes czpl-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes czpl-ping { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.6); opacity: 0; } }
@keyframes czpl-sweep { to { transform: rotate(360deg); } }
.czpl-in { animation: czpl-in 0.5s cubic-bezier(0.2,0.7,0.2,1) both; }
.czpl-ping { animation: czpl-ping 1.8s ease-out infinite; }
.czpl-sweep { animation: czpl-sweep 4s linear infinite; }
@media (prefers-reduced-motion: reduce) { .czpl-in, .czpl-ping, .czpl-sweep { animation: none !important; } }
`;

function Panel({ icon: Icon, title, children, accent = C.amber, right }: { icon: typeof Inbox; title: string; children: React.ReactNode; accent?: string; right?: React.ReactNode }) {
  return (
    <section className="czpl-in border" style={{ background: C.panel, borderColor: C.line }}>
      <header className="flex items-center justify-between gap-3 border-b px-5 py-3.5" style={{ borderColor: C.line }}>
        <h2 className="cz-display flex items-center gap-2.5 text-xl uppercase" style={{ fontWeight: 700 }}><Icon size={17} style={{ color: accent }} aria-hidden="true" />{title}</h2>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

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
  const [names, setNames] = useState<string[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [modes, setModes] = useState<PlayMode[]>(["2v2"]);
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [postReady, setPostReady] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [push, setPush] = useState<"unsupported" | "off" | "on" | "loading">("loading");
  const [find, setFind] = useState("");
  const [now, setNow] = useState(() => Date.now());

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
      const { data: all } = await supabase.from("profiles").select("username, avatar_url").eq("banned", false).order("username");
      const list = (all ?? []) as { username: string; avatar_url: string | null }[];
      setNames(list.map((p) => p.username));
      setAvatars(Object.fromEntries(list.map((p) => [p.username, p.avatar_url])));
      await load();
    })();
    const t = setInterval(() => {
      setNow(Date.now());
      void load();
    }, 30_000);
    return () => clearInterval(t);
  }, [supabase, load]);

  useEffect(() => {
    if (!pushSupported()) return setPush("unsupported");
    currentPushSubscription().then((s) => setPush(s ? "on" : "off"));
  }, []);

  const mine = me ? ready.find((r) => r.user_id === me.id) : undefined;
  const incoming = me ? challenges.filter((c) => c.to_user === me.id && c.status === "pending" && Date.parse(c.expires_at) > now) : [];
  const outgoing = me ? challenges.filter((c) => c.from_user === me.id).slice(0, 8) : [];
  const recentAccepted = me ? challenges.filter((c) => c.to_user === me.id && c.status === "accepted").slice(0, 3) : [];

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

  const ago = (iso: string) => {
    const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
    return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(-m < -59 ? -Math.round(m / 60) : -m, m > 59 ? "hour" : "minute");
  };
  const avatar = (n: string, s = 36) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatars[n] || "/default-avatar.svg"} alt="" className="shrink-0 rounded-full object-cover" style={{ width: s, height: s, border: `1px solid ${C.lineStrong}` }} />
  );
  const otherOnline = online.filter((o) => o.username !== me?.username);
  const findMatch = names.find((n) => n.toLowerCase() === find.trim().toLowerCase() && n !== me?.username);

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{CSS}</style>
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} flex flex-wrap items-end justify-between gap-6 pb-10 pt-14 md:pt-20`}>
          <div>
            <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <span className="relative inline-block h-4 w-4 overflow-hidden rounded-full" style={{ border: `1px solid ${C.radar}` }} aria-hidden="true">
                <span className="czpl-sweep absolute inset-0" style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 270deg, rgba(143,191,79,0.85) 360deg)" }} />
              </span>
              {tx.eyebrow}
            </div>
            <h1 className="cz-display mt-3 text-5xl uppercase leading-none md:text-7xl" style={{ fontWeight: 700 }}>{tx.title}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: C.muted }}>{tx.sub}</p>
          </div>
          <div className="flex gap-3">
            <div className="inline-flex items-center gap-3 border px-4 py-2.5" style={{ borderColor: C.line, background: C.panel }}>
              <span className="relative inline-flex h-2.5 w-2.5"><span className="czpl-ping absolute inset-0 rounded-full" style={{ background: C.radar }} /><span className="relative inline-block h-2.5 w-2.5 rounded-full" style={{ background: C.radar }} /></span>
              <span className="cz-display text-xl tabular-nums" style={{ fontWeight: 600 }}>{online.length} {lang === "ar" ? "متصل" : "online"}</span>
            </div>
            <div className="inline-flex items-center gap-3 border px-4 py-2.5" style={{ borderColor: C.line, background: C.panel }}>
              <UserCheck size={16} style={{ color: C.amber }} aria-hidden="true" />
              <span className="cz-display text-xl tabular-nums" style={{ fontWeight: 600 }}>{ready.length} {lang === "ar" ? "جاهز" : "ready"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={`${WRAP} mt-8`}>
        {me === null && (
          <div className="mb-6 flex flex-wrap items-center gap-4 border p-5" style={{ borderColor: C.amberDim, background: C.panel }}>
            <span className="flex-1">{tx.signIn}</span>
            <Link href="/login" className="inline-flex min-h-[44px] items-center gap-2 px-5 text-xs uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}><LogIn size={15} className="rtl:-scale-x-100" aria-hidden="true" />{tx.login}</Link>
          </div>
        )}
        {!works && <p className="mb-6 flex items-start gap-2 border p-5 text-sm" style={{ borderColor: C.amberDim, background: C.panel, color: C.muted }}><Info size={17} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />{tx.notReady}</p>}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            {/* incoming challenges */}
            {me && (
              <Panel icon={Inbox} title={tx.inbox} accent={RED} right={incoming.length ? <span className="px-2 py-0.5 text-xs text-white" style={{ background: RED, fontWeight: 800 }}>{incoming.length}</span> : null}>
                {incoming.length === 0 && recentAccepted.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>{tx.none}</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {incoming.map((c) => (
                      <li key={c.id} className="czpl-in flex flex-wrap items-center gap-3 border p-3" style={{ borderColor: "rgba(220,38,38,0.5)", background: "linear-gradient(120deg, rgba(220,38,38,0.10), #0A0C08 60%)" }}>
                        {avatar(c.from_username, 40)}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm"><Link href={`/profile/${c.from_username}`} className="hover:underline" style={{ fontWeight: 700 }}>{c.from_username}</Link> <span style={{ color: C.muted }}>· {ago(c.created_at)}</span></div>
                          <div className="cz-display text-xl uppercase" style={{ color: C.amber, fontWeight: 700 }}>{c.mode}</div>
                          {c.message && <div className="text-sm" style={{ color: C.paper }}>“{c.message}”</div>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => respond(c, false)} disabled={busy === c.id} className="inline-flex min-h-[42px] items-center gap-1.5 border px-3 text-xs uppercase tracking-widest disabled:opacity-50" style={{ borderColor: "rgba(248,113,113,0.6)", color: LOSS }}><X size={14} aria-hidden="true" />{tx.decline}</button>
                          <button onClick={() => respond(c, true)} disabled={busy === c.id} className="inline-flex min-h-[42px] items-center gap-1.5 px-4 text-xs uppercase tracking-widest disabled:opacity-50" style={{ background: C.radar, color: C.void, fontWeight: 800 }}>{busy === c.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{tx.accept}</button>
                        </div>
                      </li>
                    ))}
                    {recentAccepted.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-3 border px-3 py-2 text-sm" style={{ borderColor: C.line }}>
                        <Check size={15} style={{ color: C.radar }} aria-hidden="true" />
                        <span className="flex-1">{c.from_username} · {c.mode.toUpperCase()} · <span style={{ color: C.radar }}>{tx.st.accepted}</span></span>
                        <Link href="/report" className="text-xs uppercase tracking-widest" style={{ color: C.amber }}>{tx.report}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}

            {/* ready list */}
            <Panel icon={UserCheck} title={tx.ready} accent={C.radar}>
              {ready.length === 0 ? (
                <p className="text-sm" style={{ color: C.muted }}>{tx.nobodyReady}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {ready.map((r) => (
                    <li key={r.user_id} className="czpl-in flex flex-wrap items-center gap-3 border p-3" style={{ borderColor: C.line, background: C.void }}>
                      <span className="relative">{avatar(r.username)}<span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full" style={{ background: C.radar, border: `2px solid ${C.void}` }} /></span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/profile/${r.username}`} className="text-sm hover:underline" style={{ fontWeight: 700 }}>{r.username}{r.user_id === me?.id && <span style={{ color: C.muted }}> ({tx.you})</span>}</Link>
                        <div className="mt-1 flex flex-wrap gap-1">{r.modes.map((m) => <span key={m} className="border px-1.5 py-px text-[11px] uppercase tracking-widest" style={{ borderColor: C.amberDim, color: C.amber }}>{m}</span>)}</div>
                        {r.note && <div className="mt-1 text-xs" style={{ color: C.muted }}>“{r.note}”</div>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: C.muted }}><Clock size={12} aria-hidden="true" />{tx.left(Math.max(1, Math.round((Date.parse(r.until) - now) / 60000)))}</span>
                      {me && r.user_id !== me.id && <ChallengeButton compact username={r.username} defaultMode={r.modes[0] ?? "2v2"} />}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* online now */}
            <Panel icon={Radio} title={tx.online} accent={C.radar}>
              <p className="-mt-1 mb-3 text-xs" style={{ color: C.muted }}>{tx.onlineSub}</p>
              {otherOnline.length === 0 ? (
                <p className="text-sm" style={{ color: C.muted }}>{tx.nobodyOnline}</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {otherOnline.map((o) => (
                    <li key={o.username} className="flex items-center gap-3 border px-3 py-2" style={{ borderColor: C.line, background: C.void }}>
                      <span className="relative">{avatar(o.username, 30)}<span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full" style={{ background: C.radar, border: `2px solid ${C.void}` }} /></span>
                      <Link href={`/profile/${o.username}`} className="min-w-0 flex-1 truncate text-sm hover:underline">{o.username}</Link>
                      {me && <ChallengeButton compact username={o.username} />}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="flex flex-col gap-6">
            {/* I'm ready */}
            {me && works && (
              <Panel icon={Crosshair} title={tx.readyTitle} accent={C.amber}>
                {mine ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="relative inline-flex h-3 w-3"><span className="czpl-ping absolute inset-0 rounded-full" style={{ background: C.radar }} /><span className="relative inline-block h-3 w-3 rounded-full" style={{ background: C.radar }} /></span>
                    <span className="flex-1 text-sm">{tx.readyOn(Math.max(1, Math.round((Date.parse(mine.until) - now) / 60000)))}</span>
                    <button onClick={stopReady} disabled={busy === "ready"} className="inline-flex min-h-[42px] items-center border px-4 text-xs uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.paper }}>{tx.stop}</button>
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.modes}</div>
                    <div className="mt-2 flex flex-wrap gap-2" role="group">
                      {PLAY_MODES.map((m) => {
                        const on = modes.includes(m);
                        return <button key={m} type="button" aria-pressed={on} onClick={() => setModes((x) => (on ? x.filter((y) => y !== m) : [...x, m]))} className="min-h-[42px] min-w-[58px] border px-3 text-sm uppercase tracking-widest" style={{ background: on ? C.amber : "transparent", color: on ? C.void : C.paper, borderColor: on ? C.amber : C.amberDim, fontWeight: on ? 700 : 500 }}>{m}</button>;
                      })}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder={tx.notePh} aria-label={tx.note} className="min-h-[44px] w-full border border-[#8A6425] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0]" />
                      <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} aria-label={tx.for} className="min-h-[44px] border border-[#8A6425] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0]">
                        {DURATIONS.map((d) => <option key={d} value={d}>{tx.for} {tx.min(d)}</option>)}
                      </select>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="inline-flex min-h-[40px] flex-1 items-center gap-2 text-sm"><input type="checkbox" checked={postReady} onChange={(e) => setPostReady(e.target.checked)} style={{ accentColor: C.amber, width: 16, height: 16 }} />{tx.postDiscord}</label>
                      <button onClick={goReady} disabled={busy === "ready" || modes.length === 0} className="inline-flex min-h-[48px] items-center gap-2 px-6 text-xs uppercase tracking-[0.14em] disabled:opacity-50" style={{ background: C.radar, color: C.void, fontWeight: 800 }}>
                        {busy === "ready" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <UserCheck size={15} aria-hidden="true" />}{tx.goReady}
                      </button>
                    </div>
                  </>
                )}
              </Panel>
            )}

            {/* challenge anyone */}
            {me && (
              <Panel icon={Search} title={tx.find}>
                <datalist id="play-names">{names.filter((n) => n !== me.username).map((n) => <option key={n} value={n} />)}</datalist>
                <div className="flex gap-2">
                  <input list="play-names" value={find} onChange={(e) => setFind(e.target.value)} placeholder={tx.findPh} className="min-h-[44px] min-w-0 flex-1 border border-[#8A6425] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0]" />
                  {findMatch && <ChallengeButton username={findMatch} />}
                </div>
              </Panel>
            )}

            {/* phone notifications */}
            {me && works && (
              <Panel icon={BellRing} title={tx.phone}>
                {push === "unsupported" ? (
                  <p className="text-sm" style={{ color: C.muted }}>{tx.phoneNoSupport}</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex-1 text-sm" style={{ color: push === "on" ? C.radar : C.muted }}>{push === "on" ? tx.phoneOn : tx.phoneOff}</span>
                    <button onClick={togglePush} disabled={push === "loading"} className="inline-flex min-h-[44px] items-center gap-2 px-5 text-xs uppercase tracking-widest disabled:opacity-50" style={push === "on" ? { border: `1px solid ${C.lineStrong}`, color: C.paper } : { background: C.amber, color: C.void, fontWeight: 800 }}>
                      {push === "loading" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : push === "on" ? <BellOff size={15} aria-hidden="true" /> : <BellRing size={15} aria-hidden="true" />}
                      {push === "on" ? tx.turnOff : tx.turnOn}
                    </button>
                  </div>
                )}
              </Panel>
            )}

            {/* sent */}
            {me && outgoing.length > 0 && (
              <Panel icon={Send} title={tx.sentTitle}>
                <ul className="flex flex-col gap-2">
                  {outgoing.map((c) => {
                    const expired = c.status === "pending" && Date.parse(c.expires_at) <= now;
                    const color = c.status === "accepted" ? C.radar : c.status === "pending" && !expired ? C.amber : C.muted;
                    return (
                      <li key={c.id} className="flex flex-wrap items-center gap-3 border px-3 py-2 text-sm" style={{ borderColor: C.line, background: C.void }}>
                        <span className="min-w-0 flex-1 truncate"><b>{c.to_username}</b> · {c.mode.toUpperCase()} <span style={{ color: C.muted }}>· {ago(c.created_at)}</span></span>
                        <span className="text-xs uppercase tracking-widest" style={{ color, fontWeight: 700 }}>{expired ? "—" : tx.st[c.status]}</span>
                        {c.status === "pending" && !expired && <button onClick={() => cancel(c)} disabled={busy === c.id} className="text-xs uppercase tracking-widest underline-offset-2 hover:underline" style={{ color: C.muted }}>{tx.cancel}</button>}
                        {c.status === "accepted" && <Link href="/report" className="text-xs uppercase tracking-widest" style={{ color: C.amber }}>{tx.report}</Link>}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
