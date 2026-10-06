"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Crown, X, Plus, Check, Flag, Clock, ShieldCheck, Ban, Swords, Map as MapIcon, Calendar, Link2, LogIn, Info, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useFeedback } from "@/components/FeedbackProvider";
import { maps as MAP_FILES } from "@/lib/maps-data";
import GeneralSelect from "@/components/GeneralSelect";
import { readGenerals, generalShort, type GeneralKey } from "@/lib/generals";

type Mode = "2v2" | "3v3" | "4v4" | "ffa";
type Sub = {
  id: string; created_at: string; submitter_username: string; mode: Mode; participants: string[]; winners: string[];
  map: string | null; notes: string | null; replay_url: string | null; generals: unknown; match_date: string;
  status: "pending" | "confirmed" | "disputed" | "approved" | "rejected"; confirmed_by: string | null; dispute_reason: string | null;
};

const WRAP = "mx-auto max-w-[1100px] px-6 md:px-10";
const INPUT = "min-h-[44px] w-full border border-[#8A6425] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]";
const LOSS = "#F87171";

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Field report", title: "Report a result", sub: "Played a ranked match? Report it here. A player from the other side confirms, then an admin approves it and ratings update automatically.",
    signIn: "Sign in to report a result.", login: "Log in", banned: "Banned accounts can't report results.",
    notReady: "Result reporting isn't switched on yet — an admin needs to run sql/match-submissions.sql once in Supabase.",
    yourTeam: "Your team", opponents: "Opponents", players: "Players", addPlayer: "Add player", result: "Result", weWon: "We won", weLost: "We lost",
    winner: "Winner", mapLabel: "Map", date: "Date", replay: "Replay link (optional)", replayPh: "Discord or Drive link", notes: "Notes (optional)",
    submit: "Send report", sending: "Sending…", sent: "Report sent — waiting for the other side to confirm.",
    needs: "Waiting for your answer", needsSub: "Someone reported a match you played. Is the result right?", confirm: "Confirm", dispute: "Dispute",
    disputeTitle: "Dispute this result", disputeMsg: "Tell the admins what's wrong. They'll check the replay and decide.", disputePh: "e.g. we actually won, wrong players",
    yours: "Your matches", none: "Nothing here yet.", reportedBy: "reported by", vs: "vs",
    st: { pending: "Waiting for the other side", confirmed: "Confirmed — waiting for an admin", disputed: "Disputed — an admin will decide", approved: "Approved — counted on the ladder", rejected: "Rejected" },
    errNeedTeams: "Add at least one player to each side.", errTooMany: (n: number) => `Each team can have at most ${n} players in this mode.`, errUnknown: (n: string) => `"${n}" isn't a registered player.`,
    errResult: "Choose whether you won or lost.", errWinner: "Choose the winner.", errDup: "A player can only appear once.",
  },
  ar: {
    eyebrow: "بلاغ ميداني", title: "الإبلاغ عن نتيجة", sub: "لعبت مباراة مصنّفة؟ أبلغ عنها هنا. يؤكدها لاعب من الطرف الآخر، ثم يعتمدها مشرف ويتحدّث التقييم تلقائياً.",
    signIn: "سجّل الدخول للإبلاغ عن نتيجة.", login: "تسجيل الدخول", banned: "الحسابات المحظورة لا يمكنها الإبلاغ عن النتائج.",
    notReady: "ميزة الإبلاغ غير مفعّلة بعد — يجب على أحد المشرفين تشغيل sql/match-submissions.sql مرة واحدة في Supabase.",
    yourTeam: "فريقك", opponents: "الخصوم", players: "اللاعبون", addPlayer: "أضف لاعباً", result: "النتيجة", weWon: "فزنا", weLost: "خسرنا",
    winner: "الفائز", mapLabel: "الخريطة", date: "التاريخ", replay: "رابط الإعادة (اختياري)", replayPh: "رابط ديسكورد أو درايف", notes: "ملاحظات (اختياري)",
    submit: "إرسال البلاغ", sending: "جارٍ الإرسال…", sent: "تم إرسال البلاغ — بانتظار تأكيد الطرف الآخر.",
    needs: "بانتظار ردّك", needsSub: "أبلغ أحدهم عن مباراة لعبتها. هل النتيجة صحيحة؟", confirm: "تأكيد", dispute: "اعتراض",
    disputeTitle: "الاعتراض على النتيجة", disputeMsg: "أخبر المشرفين بالخطأ وسيتحققون من الإعادة ويقررون.", disputePh: "مثال: نحن من فاز، لاعبون خاطئون",
    yours: "مبارياتك", none: "لا شيء هنا بعد.", reportedBy: "أبلغ عنها", vs: "ضد",
    st: { pending: "بانتظار الطرف الآخر", confirmed: "مؤكَّدة — بانتظار المشرف", disputed: "معترض عليها — سيقرر المشرف", approved: "معتمدة — محسوبة في التصنيف", rejected: "مرفوضة" },
    errNeedTeams: "أضف لاعباً واحداً على الأقل لكل طرف.", errTooMany: (n: number) => `لكل فريق ${n} لاعبين كحد أقصى في هذا النمط.`, errUnknown: (n: string) => `«${n}» ليس لاعباً مسجّلاً.`,
    errResult: "اختر إن كنت فزت أم خسرت.", errWinner: "اختر الفائز.", errDup: "لا يمكن أن يظهر اللاعب أكثر من مرة.",
  },
};

const STATUS_STYLE: Record<Sub["status"], { color: string; icon: typeof Clock }> = {
  pending: { color: C.amber, icon: Clock },
  confirmed: { color: C.radar, icon: ShieldCheck },
  disputed: { color: LOSS, icon: Flag },
  approved: { color: C.radar, icon: Check },
  rejected: { color: LOSS, icon: Ban },
};

export default function ReportView() {
  const supabase = useMemo(() => createClient(), []);
  const fb = useFeedback();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const [me, setMe] = useState<{ username: string; banned: boolean } | null | undefined>(undefined);
  const [names, setNames] = useState<string[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [ready, setReady] = useState(true);
  const [mode, setMode] = useState<Mode>("2v2");
  const [mates, setMates] = useState<string[]>([]);
  const [opps, setOpps] = useState<string[]>([]);
  const [ffa, setFfa] = useState<string[]>([]);
  const [won, setWon] = useState<boolean | null>(null);
  const [ffaWinner, setFfaWinner] = useState<string | null>(null);
  const [generals, setGenerals] = useState<Record<string, GeneralKey | "">>({});
  const [map, setMap] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [replay, setReplay] = useState("");
  const [notes, setNotes] = useState("");
  const [draft, setDraft] = useState({ mates: "", opps: "", ffa: "" });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function load(username: string) {
    const { data, error } = await supabase.from("match_submissions").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) {
      setReady(false);
      return;
    }
    setSubs(((data ?? []) as Sub[]).filter((s) => s.participants.includes(username)));
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setMe(null);
      const { data: p } = await supabase.from("profiles").select("username, banned").eq("id", user.id).single();
      if (!p?.username) return setMe(null);
      setMe({ username: p.username, banned: !!p.banned });
      const { data: all } = await supabase.from("profiles").select("username").eq("banned", false).order("username");
      setNames(((all ?? []) as { username: string }[]).map((x) => x.username));
      await load(p.username);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const size = mode === "2v2" ? 2 : mode === "3v3" ? 3 : mode === "4v4" ? 4 : 8;
  const team = mode !== "ffa";
  const myTeam = me ? [me.username, ...mates] : mates;
  const ffaPlayers = me ? [me.username, ...ffa] : ffa;

  function add(list: "mates" | "opps" | "ffa") {
    const name = names.find((n) => n.toLowerCase() === draft[list].trim().toLowerCase());
    setError(null);
    if (!name) return setError(tx.errUnknown(draft[list].trim()));
    if ([...myTeam, ...opps, ...ffa].includes(name)) return setError(tx.errDup);
    if (list === "mates") setMates((x) => [...x, name]);
    if (list === "opps") setOpps((x) => [...x, name]);
    if (list === "ffa") setFfa((x) => [...x, name]);
    setDraft((d) => ({ ...d, [list]: "" }));
  }

  async function submit() {
    if (!me) return;
    setError(null);
    let participants: string[], winners: string[];
    if (team) {
      if (myTeam.length < 1 || opps.length < 1) return setError(tx.errNeedTeams);
      if (myTeam.length > size || opps.length > size) return setError(tx.errTooMany(size));
      if (won === null) return setError(tx.errResult);
      participants = [...myTeam, ...opps];
      winners = won ? myTeam : opps;
    } else {
      if (ffaPlayers.length < 2) return setError(tx.errNeedTeams);
      if (!ffaWinner) return setError(tx.errWinner);
      participants = ffaPlayers;
      winners = [ffaWinner];
    }
    const g: Record<string, string> = {};
    for (const p of participants) if (generals[p]) g[p] = generals[p] as string;
    setSending(true);
    const { error } = await supabase.from("match_submissions").insert({
      submitter_username: me.username, mode, participants, winners,
      map: map.trim() || null, notes: notes.trim() || null, replay_url: replay.trim() || null, generals: g, match_date: date,
    });
    setSending(false);
    if (error) return setError(error.message);
    fb.success(tx.sent);
    setMates([]); setOpps([]); setFfa([]); setWon(null); setFfaWinner(null); setGenerals({}); setMap(""); setReplay(""); setNotes("");
    await load(me.username);
  }

  async function answer(s: Sub, ok: boolean) {
    if (!me) return;
    let reason = "";
    if (!ok) {
      const r = await fb.prompt({ title: tx.disputeTitle, message: tx.disputeMsg, placeholder: tx.disputePh, multiline: true, confirmLabel: tx.dispute });
      if (r === null) return;
      reason = r;
    }
    setBusy(s.id);
    const { error } = ok ? await supabase.rpc("confirm_submission", { p_id: s.id }) : await supabase.rpc("dispute_submission", { p_id: s.id, p_reason: reason });
    setBusy(null);
    if (error) return fb.error(error.message);
    await load(me.username);
  }

  const fmt = (d: string) => new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const canAnswer = (s: Sub) => !!me && s.status === "pending" && s.submitter_username !== me.username && (s.mode === "ffa" || s.winners.includes(me.username) !== s.winners.includes(s.submitter_username));
  const needs = subs.filter(canAnswer);
  const mine = subs.filter((s) => !canAnswer(s));

  const playerRow = (p: string, removable: (() => void) | null, crown?: { on: boolean; set: () => void }) => (
    <li key={p} className="flex items-center gap-2">
      {crown && (
        <button type="button" onClick={crown.set} aria-pressed={crown.on} aria-label={`${p} ${tx.winner}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center border" style={{ background: crown.on ? C.amber : "transparent", borderColor: crown.on ? C.amber : C.lineStrong, color: crown.on ? C.void : C.muted }}>
          <Crown size={15} aria-hidden="true" />
        </button>
      )}
      <span className="min-w-0 flex-1 truncate text-sm" style={{ fontWeight: p === me?.username ? 700 : 500, color: p === me?.username ? C.amber : C.paper }}>{p}</span>
      <GeneralSelect compact lang={lang} value={generals[p] ?? ""} onChange={(v) => setGenerals((g) => ({ ...g, [p]: v }))} label={p} />
      {removable ? (
        <button type="button" onClick={removable} aria-label={`Remove ${p}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: C.muted }}><X size={15} aria-hidden="true" /></button>
      ) : <span className="w-9 shrink-0" />}
    </li>
  );

  const adder = (list: "mates" | "opps" | "ffa") => (
    <div className="flex gap-2 p-3 pt-0">
      <input list="report-names" value={draft[list]} onChange={(e) => setDraft((d) => ({ ...d, [list]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(list); } }} placeholder={tx.addPlayer} className={INPUT} />
      <button type="button" onClick={() => add(list)} aria-label={tx.addPlayer} className="inline-flex min-h-[44px] w-11 shrink-0 items-center justify-center border" style={{ borderColor: C.amberDim, color: C.amber }}><Plus size={16} aria-hidden="true" /></button>
    </div>
  );

  const card = (s: Sub, actions: boolean) => {
    const st = STATUS_STYLE[s.status];
    const losers = s.participants.filter((p) => !s.winners.includes(p));
    const g = readGenerals(s.generals);
    return (
      <li key={s.id} className="border" style={{ borderColor: actions ? C.amberDim : C.line, background: C.panel }}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2 text-xs" style={{ borderColor: C.line, color: C.muted }}>
          <span className="uppercase tracking-widest" style={{ color: C.amber }}>{s.mode}</span>
          <span>{fmt(s.match_date)}</span>
          {s.map && <span className="inline-flex items-center gap-1"><MapIcon size={11} aria-hidden="true" />{s.map}</span>}
          <span>{tx.reportedBy} <b style={{ color: C.paper }}>{s.submitter_username}</b></span>
          <span className="ms-auto inline-flex items-center gap-1.5" style={{ color: st.color, fontWeight: 700 }}><st.icon size={13} aria-hidden="true" />{tx.st[s.status]}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
          <span style={{ color: C.radar, fontWeight: 700 }}>▲ {s.winners.map((p) => (g[p] ? `${p} (${generalShort(g[p], lang)})` : p)).join(", ")}</span>
          <span style={{ color: C.lineStrong }}>{tx.vs}</span>
          <span style={{ color: LOSS }}>▼ {losers.map((p) => (g[p] ? `${p} (${generalShort(g[p], lang)})` : p)).join(", ")}</span>
          {s.replay_url && <a href={s.replay_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline" style={{ color: C.amber }}><Link2 size={12} aria-hidden="true" />replay</a>}
        </div>
        {s.dispute_reason && <p className="px-4 pb-3 text-xs" style={{ color: LOSS }}>“{s.dispute_reason}”</p>}
        {actions && (
          <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-3" style={{ borderColor: C.line }}>
            <button type="button" onClick={() => answer(s, false)} disabled={busy === s.id} className="inline-flex min-h-[40px] items-center gap-2 border px-4 text-xs uppercase tracking-widest disabled:opacity-50" style={{ borderColor: "rgba(248,113,113,0.6)", color: LOSS }}><Flag size={14} aria-hidden="true" />{tx.dispute}</button>
            <button type="button" onClick={() => answer(s, true)} disabled={busy === s.id} className="inline-flex min-h-[40px] items-center gap-2 px-5 text-xs uppercase tracking-widest disabled:opacity-50" style={{ background: C.radar, color: C.void, fontWeight: 700 }}>
              {busy === s.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{tx.confirm}
            </button>
          </div>
        )}
      </li>
    );
  };

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-10 pt-14 md:pt-20`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}><ClipboardCheck size={14} aria-hidden="true" />{tx.eyebrow}</div>
          <h1 className="cz-display mt-3 text-5xl uppercase leading-none md:text-6xl" style={{ fontWeight: 700 }}>{tx.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: C.muted }}>{tx.sub}</p>
        </div>
      </header>

      <div className={`${WRAP} mt-8`}>
        {me === undefined ? (
          <Loader2 size={22} className="animate-spin" style={{ color: C.muted }} aria-hidden="true" />
        ) : me === null ? (
          <div className="flex flex-wrap items-center gap-4 border p-6" style={{ borderColor: C.amberDim, background: C.panel }}>
            <span className="flex-1">{tx.signIn}</span>
            <Link href="/login" className="inline-flex min-h-[44px] items-center gap-2 px-5 text-xs uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}><LogIn size={15} className="rtl:-scale-x-100" aria-hidden="true" />{tx.login}</Link>
          </div>
        ) : !ready ? (
          <p className="flex items-start gap-2 border p-5 text-sm" style={{ borderColor: C.amberDim, background: C.panel, color: C.muted }}><Info size={17} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />{tx.notReady}</p>
        ) : (
          <>
            {needs.length > 0 && (
              <section className="mb-10">
                <h2 className="cz-display text-3xl uppercase" style={{ fontWeight: 700, color: C.amber }}>{tx.needs} <span className="text-xl" style={{ color: C.muted }}>{needs.length}</span></h2>
                <p className="mt-1 text-sm" style={{ color: C.muted }}>{tx.needsSub}</p>
                <ul className="mt-4 flex flex-col gap-3">{needs.map((s) => card(s, true))}</ul>
              </section>
            )}

            {me.banned ? (
              <p className="border p-5 text-sm" style={{ borderColor: "rgba(248,113,113,0.5)", color: LOSS }}>{tx.banned}</p>
            ) : (
              <section className="border p-5 md:p-6" style={{ background: C.panel, borderColor: C.line }}>
                <datalist id="report-names">{names.filter((n) => n !== me.username).map((n) => <option key={n} value={n} />)}</datalist>
                <div className="flex flex-wrap gap-0 border" style={{ borderColor: C.amberDim, width: "fit-content" }} role="group">
                  {(["2v2", "3v3", "4v4", "ffa"] as const).map((m) => (
                    <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setWon(null); setFfaWinner(null); }} className="min-h-[44px] px-4 text-sm uppercase tracking-widest" style={{ background: mode === m ? C.amber : "transparent", color: mode === m ? C.void : C.paper, fontWeight: mode === m ? 700 : 500 }}>{m}</button>
                  ))}
                </div>

                {team ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr]">
                    {[{ label: tx.yourTeam, list: myTeam, key: "mates" as const, color: C.amber }, null, { label: tx.opponents, list: opps, key: "opps" as const, color: C.radar }].map((col, i) =>
                      col ? (
                        <div key={col.key} className="border" style={{ borderColor: C.line, background: C.void }}>
                          <div className="flex justify-between border-b px-4 py-2.5" style={{ borderColor: C.line }}>
                            <span className="cz-display text-lg uppercase" style={{ color: col.color, fontWeight: 700 }}>{col.label}</span>
                            <span className="text-xs tabular-nums" style={{ color: C.muted }}>{col.list.length}/{size}</span>
                          </div>
                          <ul className="flex flex-col gap-2 p-3">
                            {col.list.map((p) => playerRow(p, p === me.username ? null : () => (col.key === "mates" ? setMates((x) => x.filter((y) => y !== p)) : setOpps((x) => x.filter((y) => y !== p)))))}
                          </ul>
                          {col.list.length < size && adder(col.key)}
                        </div>
                      ) : (
                        <div key={i} className="flex items-center justify-center"><Swords size={24} style={{ color: C.lineStrong }} aria-hidden="true" /></div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="mt-5 border" style={{ borderColor: C.line, background: C.void }}>
                    <div className="border-b px-4 py-2.5 text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: C.muted }}>{tx.players} · {tx.winner}: 👑</div>
                    <ul className="flex flex-col gap-2 p-3">
                      {ffaPlayers.map((p) => playerRow(p, p === me.username ? null : () => setFfa((x) => x.filter((y) => y !== p)), { on: ffaWinner === p, set: () => setFfaWinner(p) }))}
                    </ul>
                    {adder("ffa")}
                  </div>
                )}

                {team && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.result}</span>
                    {[true, false].map((v) => (
                      <button key={String(v)} type="button" aria-pressed={won === v} onClick={() => setWon(v)} className="inline-flex min-h-[44px] items-center gap-2 border px-5 text-sm uppercase tracking-widest" style={{ background: won === v ? (v ? C.radar : LOSS) : "transparent", color: won === v ? C.void : v ? C.radar : LOSS, borderColor: v ? C.radar : LOSS, fontWeight: 700 }}>
                        {v ? <Crown size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}{v ? tx.weWon : tx.weLost}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}><MapIcon size={12} aria-hidden="true" />{tx.mapLabel}</span>
                    <input list="report-maps" value={map} onChange={(e) => setMap(e.target.value)} className={INPUT} />
                    <datalist id="report-maps">{MAP_FILES.map((m) => <option key={m.name} value={m.name} />)}</datalist>
                  </label>
                  <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}><Calendar size={12} aria-hidden="true" />{tx.date}</span>
                    <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={INPUT} />
                  </label>
                  <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}><Link2 size={12} aria-hidden="true" />{tx.replay}</span>
                    <input value={replay} onChange={(e) => setReplay(e.target.value)} placeholder={tx.replayPh} className={INPUT} />
                  </label>
                  <label className="block"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.notes}</span>
                    <input value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} className={INPUT} />
                  </label>
                </div>

                {error && <p role="alert" className="mt-4 border px-4 py-3 text-sm" style={{ borderColor: "rgba(248,113,113,0.5)", color: LOSS }}>{error}</p>}

                <button type="button" onClick={submit} disabled={sending} className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 text-sm uppercase tracking-[0.14em] disabled:opacity-60" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
                  {sending ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ClipboardCheck size={17} aria-hidden="true" />}{sending ? tx.sending : tx.submit}
                </button>
              </section>
            )}

            <section className="mt-10">
              <h2 className="cz-display text-3xl uppercase" style={{ fontWeight: 700 }}>{tx.yours}</h2>
              {mine.length === 0 ? <p className="mt-3 text-sm" style={{ color: C.muted }}>{tx.none}</p> : <ul className="mt-4 flex flex-col gap-3">{mine.map((s) => card(s, false))}</ul>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
