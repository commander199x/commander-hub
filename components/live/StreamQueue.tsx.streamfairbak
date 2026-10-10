"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Crown, Users, ListOrdered, LogIn, LogOut, Loader2, Info, Shield, RotateCcw, UserX, Play, Undo2, History, Lock, Unlock, Trophy, ArrowRight, Tv, X } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useFeedback } from "@/components/FeedbackProvider";
import { useStream, previewRotation, type StreamSettings } from "@/lib/stream";
import { logMatch } from "@/lib/logMatch";

const WRAP = "mx-auto max-w-[1180px] px-5 md:px-10";
const RED = "#DC2626";
const LOSS = "#F87171";
const mono = { fontFamily: "var(--font-mono), monospace" } as const;

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Stream lobby", title: "Play on stream", sub: "FFA on the live stream. Join the queue — the winner keeps their seat, and the queue rotates in.",
    open: "Queue open", closed: "Queue closed", seats: "Lobby", empty: "Empty seat", king: "Winner — stays", games: (n: number) => (n === 1 ? "1 game" : `${n} games`),
    queue: "Queue", waiting: (n: number) => `${n} waiting`, noQueue: "Nobody in the queue yet.",
    join: "Join the queue", leave: "Leave the queue", signIn: "Log in to join", closedNote: "The queue is closed right now — it opens when the stream starts.",
    youPlaying: (s: number) => `You're in the lobby — seat ${s}`, youNext: "You're in the next game!", youEta: (p: number, g: number) => `You're #${p} — about ${g} games away`,
    rules: "How it's fair", rule1: "First come, first served — your place is shown to everyone.",
    rule2: (s: number) => `After each game the winner keeps their seat. If N players are waiting, the bottom N leave and the first N join (up to ${s - 1}).`,
    rule3: "Players who lose their seat go to the back of the queue.", rule3off: "Players who lose their seat leave — join again to play more.",
    rule4: "You get a notification when it's your turn.",
    history: "Recent games", winner: "Winner", in: "In", out: "Out",
    host: "Host panel", hostSub: "Only admins see this.", openQ: "Open queue", closeQ: "Close queue", seatsLabel: "Seats", requeue: "Losers re-queue",
    fill: "Fill empty seats", gameOver: "Game over — tap players in finishing order", reset: "Reset", undo: "Undo",
    stays: "Stays", leaves: "Leaves", joins: "Joins", rotate: "Confirm & rotate", ladder: "Also record on the FFA ladder", noShow: "No-show — give seat to next",
    removeQ: "Remove from queue", overlay: "Stream overlay (OBS)", done: "Next game is set — new players notified.", needAll: "Tap every player in finishing order.",
    notReady: "The stream queue isn't switched on yet — an admin needs to run sql/stream-queue.sql once in Supabase.",
  },
  ar: {
    eyebrow: "لوبي البث", title: "العب على البث", sub: "FFA على البث المباشر. انضم للطابور — الفائز يحتفظ بمقعده، والطابور يتناوب.",
    open: "الطابور مفتوح", closed: "الطابور مغلق", seats: "اللوبي", empty: "مقعد فارغ", king: "الفائز — يبقى", games: (n: number) => `${n} مباراة`,
    queue: "الطابور", waiting: (n: number) => `${n} بالانتظار`, noQueue: "لا أحد في الطابور بعد.",
    join: "انضم للطابور", leave: "اخرج من الطابور", signIn: "سجّل الدخول للانضمام", closedNote: "الطابور مغلق الآن — يُفتح عند بدء البث.",
    youPlaying: (s: number) => `أنت في اللوبي — المقعد ${s}`, youNext: "أنت في المباراة القادمة!", youEta: (p: number, g: number) => `أنت رقم ${p} — بعد حوالي ${g} مباريات`,
    rules: "كيف نضمن العدالة", rule1: "الأسبق أولاً — ترتيبك ظاهر للجميع.",
    rule2: (s: number) => `بعد كل مباراة يحتفظ الفائز بمقعده. إذا كان هناك N بالانتظار يخرج آخر N ويدخل أول N (حتى ${s - 1}).`,
    rule3: "من يخسر مقعده يعود إلى آخر الطابور.", rule3off: "من يخسر مقعده يخرج — انضم مجدداً لتلعب أكثر.",
    rule4: "يصلك إشعار عندما يحين دورك.",
    history: "آخر المباريات", winner: "الفائز", in: "دخل", out: "خرج",
    host: "لوحة المضيف", hostSub: "يراها المشرفون فقط.", openQ: "افتح الطابور", closeQ: "أغلق الطابور", seatsLabel: "المقاعد", requeue: "الخاسرون يعودون للطابور",
    fill: "املأ المقاعد الفارغة", gameOver: "انتهت المباراة — اضغط اللاعبين حسب ترتيب الإنهاء", reset: "إعادة", undo: "تراجع",
    stays: "يبقى", leaves: "يخرج", joins: "يدخل", rotate: "تأكيد وتدوير", ladder: "سجّلها أيضاً في تصنيف FFA", noShow: "لم يحضر — أعطِ المقعد للتالي",
    removeQ: "إزالة من الطابور", overlay: "واجهة البث (OBS)", done: "تم تجهيز المباراة القادمة — تم إشعار اللاعبين الجدد.", needAll: "اضغط كل اللاعبين حسب ترتيب الإنهاء.",
    notReady: "طابور البث غير مفعّل بعد — يجب على أحد المشرفين تشغيل sql/stream-queue.sql مرة واحدة في Supabase.",
  },
};

const CSS = `
@keyframes czsq-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes czsq-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(232,166,61,0); } 50% { box-shadow: 0 0 26px 2px rgba(232,166,61,0.35); } }
@keyframes czsq-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.czsq-in { animation: czsq-in 0.45s cubic-bezier(0.2,0.7,0.2,1) both; }
.czsq-king { animation: czsq-glow 2.4s ease-in-out infinite; }
.czsq-blink { animation: czsq-blink 1.2s steps(2) infinite; }
@media (prefers-reduced-motion: reduce) { .czsq-in, .czsq-king, .czsq-blink { animation: none !important; } }
`;

function Box({ title, icon: Icon, right, children, accent = C.amber }: { title: string; icon: typeof Users; right?: ReactNode; children: ReactNode; accent?: string }) {
  return (
    <section className="czsq-in relative border" style={{ background: "linear-gradient(180deg, #12150E, #0E110B)", borderColor: C.line }}>
      <header className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: C.line }}>
        <h3 className="cz-display flex items-center gap-2.5 text-lg uppercase" style={{ fontWeight: 700 }}><Icon size={16} style={{ color: accent }} aria-hidden="true" />{title}</h3>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function StreamQueue() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const fb = useFeedback();
  const { supabase, settings, lobby, queue, games, avatars, ready, refresh } = useStream(5000);
  const [me, setMe] = useState<{ id: string; username: string; admin: boolean } | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [recordLadder, setRecordLadder] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setMe(null);
      const { data } = await supabase.from("profiles").select("username, is_admin").eq("id", user.id).single();
      setMe(data?.username ? { id: user.id, username: data.username, admin: !!data.is_admin } : null);
    })();
  }, [supabase]);

  // forget a half-entered finishing order if the lobby changes underneath it
  const lobbyKey = lobby.map((l) => l.username).join("|");
  useEffect(() => setOrder((o) => o.filter((n) => lobby.some((l) => l.username === n))), [lobbyKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const seats = settings.size;
  const mySeat = me ? lobby.find((l) => l.user_id === me.id) : undefined;
  const myPos = me ? queue.findIndex((q) => q.user_id === me.id) + 1 : 0;
  const preview = useMemo(() => (order.length === lobby.length && lobby.length ? previewRotation(order, queue.map((q) => q.username), seats) : null), [order, lobby, queue, seats]);
  const lastWinner = games[0]?.ranking[0];

  async function joinQueue() {
    if (!me) return;
    setBusy("join");
    const { error } = await supabase.from("stream_queue").insert({ user_id: me.id, username: me.username });
    setBusy(null);
    if (error) fb.error(error.message);
    refresh();
  }
  async function leaveQueue(userId?: string) {
    setBusy("leave");
    const { error } = await supabase.from("stream_queue").delete().eq("user_id", userId ?? me!.id);
    setBusy(null);
    if (error) fb.error(error.message);
    refresh();
  }
  async function saveSettings(next: Partial<StreamSettings>) {
    const value = { ...settings, ...next };
    const { error } = await supabase.from("site_settings").upsert({ key: "stream", value, updated_at: new Date().toISOString(), updated_by: me?.username ?? null });
    if (error) fb.error(error.message);
    refresh();
  }
  async function fill() {
    setBusy("fill");
    const { error } = await supabase.rpc("stream_fill");
    setBusy(null);
    if (error) fb.error(error.message);
    refresh();
  }
  async function noShow(name: string) {
    setBusy(name);
    const { error } = await supabase.rpc("stream_remove", { p_username: name });
    setBusy(null);
    if (error) fb.error(error.message);
    refresh();
  }
  async function rotate() {
    if (order.length !== lobby.length) return fb.error(tx.needAll);
    setBusy("rotate");
    const ranking = [...order];
    const { error } = await supabase.rpc("stream_next_round", { p_ranking: ranking });
    if (!error && recordLadder) {
      const res = await logMatch(supabase, { mode: "ffa", participants: ranking, winners: [ranking[0]], notes: "Stream FFA", createdAt: new Date().toISOString(), replayUrl: null });
      if (res.error) fb.error(`Rotated, but the ladder record failed: ${res.error}`);
    }
    setBusy(null);
    if (error) return fb.error(error.message);
    setOrder([]);
    fb.success(tx.done);
    refresh();
  }

  const avatar = (n: string, s: number, ring: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatars[n] || "/default-avatar.svg"} alt="" className="shrink-0 rounded-full object-cover" style={{ width: s, height: s, border: `2px solid ${ring}` }} />
  );

  if (ready === false) {
    return (
      <div className={`${WRAP} mt-10`}>
        <p className="flex items-start gap-2 border p-5 text-sm" style={{ borderColor: C.amberDim, background: "#0E110B", color: C.muted }}><Info size={17} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />{tx.notReady}</p>
      </div>
    );
  }

  return (
    <section className={`${WRAP} mt-12 pb-16`} aria-labelledby="czsq-title" style={{ color: C.paper }}>
      <style>{CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.radar, ...mono }}><Tv size={14} aria-hidden="true" />{tx.eyebrow}</div>
          <h2 id="czsq-title" className="cz-display mt-2 text-5xl uppercase leading-none" style={{ fontWeight: 700 }}>{tx.title}</h2>
          <p className="mt-3 max-w-2xl text-base" style={{ color: C.muted }}>{tx.sub}</p>
        </div>
        <span className="inline-flex items-center gap-2 border px-3 py-2 text-xs uppercase tracking-[0.2em]" style={{ borderColor: settings.open ? C.radar : C.lineStrong, color: settings.open ? C.radar : C.muted, ...mono }}>
          {settings.open ? <span className="czsq-blink inline-block h-2 w-2 rounded-full" style={{ background: C.radar }} /> : <Lock size={13} aria-hidden="true" />}
          {settings.open ? tx.open : tx.closed}
        </span>
      </div>

      {/* your status */}
      <div className="czsq-in mt-6 flex flex-wrap items-center gap-4 border p-4" style={{ borderColor: mySeat ? C.radar : myPos ? C.amber : C.line, background: mySeat ? "linear-gradient(120deg, rgba(143,191,79,0.12), #0E110B 60%)" : myPos ? "linear-gradient(120deg, rgba(232,166,61,0.10), #0E110B 60%)" : "#0E110B" }}>
        <span className="flex-1 text-sm" style={{ fontWeight: 600 }}>
          {me === null ? tx.signIn
            : mySeat ? <span style={{ color: C.radar }}>{tx.youPlaying(mySeat.seat)}</span>
            : myPos ? <span style={{ color: C.amber }}>{myPos <= seats - 1 ? tx.youNext : tx.youEta(myPos, Math.ceil(myPos / (seats - 1)))}</span>
            : settings.open ? tx.sub : tx.closedNote}
        </span>
        {me === null ? (
          <Link href="/login" className="inline-flex min-h-[46px] items-center gap-2 px-6 text-xs uppercase tracking-[0.16em]" style={{ background: C.amber, color: C.void, fontWeight: 800 }}><LogIn size={15} className="rtl:-scale-x-100" aria-hidden="true" />{tx.signIn}</Link>
        ) : mySeat ? null : myPos ? (
          <button type="button" onClick={() => leaveQueue()} disabled={busy === "leave"} className="inline-flex min-h-[46px] items-center gap-2 border px-5 text-xs uppercase tracking-[0.16em] disabled:opacity-50" style={{ borderColor: C.lineStrong, color: C.paper }}><LogOut size={15} className="rtl:-scale-x-100" aria-hidden="true" />{tx.leave}</button>
        ) : (
          <button type="button" onClick={joinQueue} disabled={!settings.open || busy === "join"} className="inline-flex min-h-[46px] items-center gap-2 px-6 text-xs uppercase tracking-[0.16em] disabled:opacity-40" style={{ background: C.radar, color: C.void, fontWeight: 800, boxShadow: settings.open ? "0 0 24px rgba(143,191,79,0.3)" : "none" }}>
            {busy === "join" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{tx.join}
          </button>
        )}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* lobby seats */}
        <Box title={`${tx.seats} · ${lobby.length}/${seats}`} icon={Users} accent={C.radar}>
          <ol className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: seats }, (_, i) => {
              const s = lobby.find((l) => l.seat === i + 1) ?? lobby[i];
              if (!s) return (
                <li key={`e${i}`} className="flex min-h-[64px] items-center gap-3 border border-dashed px-3" style={{ borderColor: C.line }}>
                  <span className="cz-display w-6 text-xl" style={{ color: C.lineStrong, fontWeight: 700 }}>{i + 1}</span>
                  <span className="text-xs uppercase tracking-widest" style={{ color: C.muted, ...mono }}>{tx.empty}</span>
                </li>
              );
              const king = s.username === lastWinner && s.seat === 1;
              const rank = order.indexOf(s.username);
              return (
                <li key={s.user_id} className={`relative flex min-h-[64px] items-center gap-3 border px-3 ${king ? "czsq-king" : ""}`} style={{ borderColor: king ? C.amber : s.user_id === me?.id ? C.radar : C.line, background: king ? "linear-gradient(120deg, rgba(232,166,61,0.14), #0A0C08 60%)" : "#0A0C08" }}>
                  <span className="cz-display w-6 text-xl" style={{ color: king ? C.amber : C.muted, fontWeight: 700 }}>{i + 1}</span>
                  {avatar(s.username, 38, king ? C.amber : C.lineStrong)}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm" style={{ fontWeight: 700 }}>{king && <Crown size={14} style={{ color: C.amber }} aria-hidden="true" />}{s.username}</span>
                    <span className="block text-[10px] uppercase tracking-wider" style={{ color: king ? C.amber : C.muted, ...mono }}>{king ? tx.king : s.games ? tx.games(s.games) : "—"}</span>
                  </span>
                  {me?.admin && (
                    <span className="flex items-center gap-1">
                      {rank >= 0 && <span className="cz-display inline-flex h-8 w-8 items-center justify-center text-lg" style={{ background: rank === 0 ? C.amber : C.lineStrong, color: rank === 0 ? C.void : C.paper, fontWeight: 700 }}>{rank + 1}</span>}
                      <button type="button" onClick={() => noShow(s.username)} disabled={busy === s.username} title={tx.noShow} aria-label={`${tx.noShow}: ${s.username}`} className="inline-flex h-8 w-8 items-center justify-center" style={{ color: C.muted }}><UserX size={15} aria-hidden="true" /></button>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </Box>

        {/* queue */}
        <Box title={tx.queue} icon={ListOrdered} right={<span className="text-xs" style={{ color: C.muted, ...mono }}>{tx.waiting(queue.length)}</span>}>
          {queue.length === 0 ? (
            <p className="text-sm" style={{ color: C.muted }}>{tx.noQueue}</p>
          ) : (
            <ol className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto">
              {queue.map((q, i) => {
                const next = i < seats - 1;
                return (
                  <li key={q.user_id} className="flex items-center gap-3 border px-3 py-2" style={{ borderColor: q.user_id === me?.id ? C.amber : C.line, background: q.user_id === me?.id ? "rgba(232,166,61,0.08)" : "#0A0C08" }}>
                    <span className="w-7 text-sm tabular-nums" style={{ color: next ? C.radar : C.muted, fontWeight: 700, ...mono }}>#{i + 1}</span>
                    {avatar(q.username, 28, next ? C.radar : C.lineStrong)}
                    <span className="min-w-0 flex-1 truncate text-sm" style={{ fontWeight: q.user_id === me?.id ? 800 : 500 }}>{q.username}</span>
                    {next && <span className="text-[10px] uppercase tracking-widest" style={{ color: C.radar, ...mono }}>next</span>}
                    {me?.admin && <button type="button" onClick={() => leaveQueue(q.user_id)} aria-label={`${tx.removeQ}: ${q.username}`} title={tx.removeQ} className="inline-flex h-7 w-7 items-center justify-center" style={{ color: C.muted }}><X size={14} aria-hidden="true" /></button>}
                  </li>
                );
              })}
            </ol>
          )}
        </Box>
      </div>

      {/* host panel */}
      {me?.admin && (
        <div className="czsq-in relative mt-6 border p-5" style={{ borderColor: "rgba(220,38,38,0.55)", background: "linear-gradient(140deg, rgba(220,38,38,0.08), #0E110B 55%)" }}>
          <div className="flex flex-wrap items-center gap-3">
            <Shield size={18} style={{ color: RED }} aria-hidden="true" />
            <h3 className="cz-display text-xl uppercase" style={{ fontWeight: 700 }}>{tx.host}</h3>
            <span className="text-xs" style={{ color: C.muted }}>{tx.hostSub}</span>
            <Link href="/live/overlay" target="_blank" className="ms-auto inline-flex min-h-[38px] items-center gap-2 border px-3 text-[11px] uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.paper }}><Tv size={14} aria-hidden="true" />{tx.overlay}</Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => saveSettings({ open: !settings.open })} className="inline-flex min-h-[44px] items-center gap-2 px-4 text-xs uppercase tracking-widest" style={settings.open ? { border: `1px solid ${C.lineStrong}`, color: C.paper } : { background: C.radar, color: C.void, fontWeight: 800 }}>
              {settings.open ? <Lock size={14} aria-hidden="true" /> : <Unlock size={14} aria-hidden="true" />}{settings.open ? tx.closeQ : tx.openQ}
            </button>
            <label className="inline-flex min-h-[44px] items-center gap-2 text-sm">{tx.seatsLabel}
              <select value={seats} onChange={(e) => saveSettings({ size: Number(e.target.value) })} className="min-h-[40px] border border-[#3A4029] bg-[#0A0C08] px-2 text-sm text-[#EDEAE0]">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="inline-flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={settings.requeue} onChange={(e) => saveSettings({ requeue: e.target.checked })} style={{ accentColor: C.amber, width: 16, height: 16 }} />{tx.requeue}</label>
            <button type="button" onClick={fill} disabled={busy === "fill" || lobby.length >= seats || !queue.length} className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest disabled:opacity-40" style={{ borderColor: C.amberDim, color: C.amber }}>
              {busy === "fill" ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Users size={14} aria-hidden="true" />}{tx.fill}
            </button>
          </div>

          {lobby.length > 1 && (
            <div className="mt-5 border-t pt-5" style={{ borderColor: "rgba(220,38,38,0.3)" }}>
              <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: LOSS, ...mono }}>{tx.gameOver}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {lobby.map((l) => {
                  const r = order.indexOf(l.username);
                  return (
                    <button key={l.user_id} type="button" disabled={r >= 0} onClick={() => setOrder((o) => [...o, l.username])} className="inline-flex min-h-[44px] items-center gap-2 border px-3 text-sm disabled:opacity-100" style={{ borderColor: r === 0 ? C.amber : r > 0 ? C.lineStrong : C.amberDim, background: r === 0 ? "rgba(232,166,61,0.15)" : r > 0 ? "#171B10" : "#0A0C08", color: r >= 0 ? C.muted : C.paper }}>
                      {r >= 0 && <span className="cz-display text-base" style={{ color: r === 0 ? C.amber : C.paper, fontWeight: 700 }}>{r + 1}.</span>}
                      {r === 0 && <Crown size={14} style={{ color: C.amber }} aria-hidden="true" />}
                      {l.username}
                    </button>
                  );
                })}
                {order.length > 0 && (
                  <>
                    <button type="button" onClick={() => setOrder((o) => o.slice(0, -1))} className="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs uppercase tracking-widest" style={{ color: C.muted }}><Undo2 size={14} aria-hidden="true" />{tx.undo}</button>
                    <button type="button" onClick={() => setOrder([])} className="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs uppercase tracking-widest" style={{ color: C.muted }}><RotateCcw size={14} aria-hidden="true" />{tx.reset}</button>
                  </>
                )}
              </div>

              {preview && (
                <div className="czsq-in mt-4 grid gap-3 sm:grid-cols-3">
                  {[{ label: tx.stays, list: preview.stay, color: C.radar }, { label: tx.leaves, list: preview.out, color: LOSS }, { label: tx.joins, list: preview.join, color: C.amber }].map((col) => (
                    <div key={col.label} className="border p-3" style={{ borderColor: col.color + "66", background: "#0A0C08" }}>
                      <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: col.color, ...mono }}>{col.label} · {col.list.length}</div>
                      <div className="mt-1 text-sm" style={{ color: C.paper }}>{col.list.join(", ") || "—"}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-[44px] flex-1 items-center gap-2 text-sm"><input type="checkbox" checked={recordLadder} onChange={(e) => setRecordLadder(e.target.checked)} style={{ accentColor: C.amber, width: 16, height: 16 }} />{tx.ladder}</label>
                <button type="button" onClick={rotate} disabled={!preview || busy === "rotate"} className="inline-flex min-h-[50px] items-center gap-2 px-6 text-sm uppercase tracking-[0.16em] text-white disabled:opacity-40" style={{ background: RED, fontWeight: 800, boxShadow: preview ? "0 0 26px rgba(220,38,38,0.4)" : "none" }}>
                  {busy === "rotate" ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={16} className="rtl:-scale-x-100" aria-hidden="true" />}{tx.rotate}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Box title={tx.rules} icon={Info} accent={C.radar}>
          <ul className="flex flex-col gap-2.5 text-sm leading-relaxed">
            {[tx.rule1, tx.rule2(seats), settings.requeue ? tx.rule3 : tx.rule3off, tx.rule4].map((r) => (
              <li key={r} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: C.radar }} aria-hidden="true" />{r}</li>
            ))}
          </ul>
        </Box>
        <Box title={tx.history} icon={History}>
          {games.length === 0 ? (
            <p className="text-sm" style={{ color: C.muted }}>—</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {games.map((g) => (
                <li key={g.id} className="border px-3 py-2 text-sm" style={{ borderColor: C.line, background: "#0A0C08" }}>
                  <div className="flex items-center gap-2"><Trophy size={14} style={{ color: C.amber }} aria-hidden="true" /><b>{g.ranking[0]}</b><span className="ms-auto text-[10px]" style={{ color: C.muted, ...mono }}>{new Date(g.created_at).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit" })}</span></div>
                  {(g.joined.length > 0 || g.removed.length > 0) && (
                    <div className="mt-1 text-xs" style={{ color: C.muted }}>
                      {g.removed.length > 0 && <span style={{ color: LOSS }}>{tx.out}: {g.removed.join(", ")}</span>}
                      {g.removed.length > 0 && g.joined.length > 0 && " · "}
                      {g.joined.length > 0 && <span style={{ color: C.radar }}>{tx.in}: {g.joined.join(", ")}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Box>
      </div>
    </section>
  );
}
