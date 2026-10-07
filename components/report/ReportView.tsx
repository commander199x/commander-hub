"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ClipboardCheck, Crown, X, Check, Flag, Clock, ShieldCheck, Ban, Swords, Map as MapIcon, Calendar, Link2, LogIn, Info, Loader2,
  ArrowLeftRight, Search, Zap, RotateCcw, Skull, FileText, ChevronRight,
} from "lucide-react";
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
type Person = { username: string; avatar: string | null; rating: number };
type QuickFill = { key: string; kind: "challenge" | "rematch"; label: string; sub: string; mode: Mode; mine: string[]; opps: string[]; ffa: string[] };

const WRAP = "mx-auto max-w-[1180px] px-5 md:px-10";
const RED = "#DC2626";
const LOSS = "#F87171";
const MODES: Mode[] = ["2v2", "3v3", "4v4", "ffa"];
const SIZE: Record<Mode, number> = { "2v2": 2, "3v3": 3, "4v4": 4, ffa: 8 };

const TIERS: [number, { en: string; ar: string }][] = [
  [-Infinity, { en: "Private", ar: "جندي" }], [900, { en: "Corporal", ar: "عريف" }], [1000, { en: "Sergeant", ar: "رقيب" }], [1100, { en: "Lieutenant", ar: "ملازم" }],
  [1200, { en: "Captain", ar: "نقيب" }], [1300, { en: "Major", ar: "رائد" }], [1400, { en: "Colonel", ar: "عقيد" }], [1500, { en: "Brigadier General", ar: "عميد" }],
  [1600, { en: "General", ar: "لواء" }], [1700, { en: "Commander", ar: "قائد" }],
];
const tierOf = (r: number) => TIERS.reduce((acc, [min, t]) => (r >= min ? t : acc), TIERS[0][1]);

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Field report", title: "Report a result", sub: "Played a ranked match? File the report — the other side confirms, an admin approves, and ratings update automatically.",
    steps: ["Report", "Opponent confirms", "Admin approves"],
    signIn: "Sign in to report a result.", login: "Log in", banned: "Banned accounts can't report results.",
    notReady: "Result reporting isn't switched on yet — an admin needs to run sql/match-submissions.sql once in Supabase.",
    quick: "Quick fill", quickSub: "One click fills in the players.", fromChallenge: "Accepted challenge", rematch: "Rematch", use: "Use",
    oneVone: "1v1 counts on the FFA ladder.",
    mode: "Mode", yourTeam: "Your team", opponents: "Opponents", players: "Players", search: "Add player — type a name", noMatch: "No player found",
    move: "Move to the other side", remove: "Remove", winner: "Winner", result: "Result", victory: "Victory", defeat: "Defeat", victorySub: "Your team won", defeatSub: "Your team lost",
    pickWinner: "Tap the crown next to the winner.",
    details: "Details", mapLabel: "Map", date: "Date", replay: "Replay link (optional)", replayPh: "Discord or Drive link", notes: "Notes (optional)",
    preview: "Battle report", defeated: "defeated", won: "won the FFA against", on: "on",
    hint: { players: "Add at least one player to each side.", ffa: "Add at least one other player.", result: "Choose Victory or Defeat.", winner: "Choose the winner.", tooMany: (n: number) => `Max ${n} players per side in this mode.` },
    submit: "Send report", sending: "Sending…", sent: "Report sent — waiting for the other side to confirm.",
    needs: "Waiting for your answer", needsSub: "Someone reported a match you played. Is it right?", confirm: "Confirm", dispute: "Dispute",
    disputeTitle: "Dispute this result", disputeMsg: "Tell the admins what's wrong. They'll check the replay and decide.", disputePh: "e.g. we actually won, wrong players",
    yours: "Your reports", none: "No reports yet.", reportedBy: "by", vs: "vs",
    st: { pending: "Waiting for the other side", confirmed: "Confirmed — waiting for an admin", disputed: "Disputed — an admin will decide", approved: "Approved — on the ladder", rejected: "Rejected" },
    errUnknown: (n: string) => `"${n}" isn't a registered player.`, errDup: "That player is already in this match.",
  },
  ar: {
    eyebrow: "بلاغ ميداني", title: "الإبلاغ عن نتيجة", sub: "لعبت مباراة مصنّفة؟ قدّم البلاغ — يؤكده الطرف الآخر، يعتمده مشرف، ويتحدّث التقييم تلقائياً.",
    steps: ["البلاغ", "تأكيد الخصم", "اعتماد المشرف"],
    signIn: "سجّل الدخول للإبلاغ عن نتيجة.", login: "تسجيل الدخول", banned: "الحسابات المحظورة لا يمكنها الإبلاغ عن النتائج.",
    notReady: "ميزة الإبلاغ غير مفعّلة بعد — يجب على أحد المشرفين تشغيل sql/match-submissions.sql مرة واحدة في Supabase.",
    quick: "تعبئة سريعة", quickSub: "ضغطة واحدة تملأ اللاعبين.", fromChallenge: "تحدٍّ مقبول", rematch: "إعادة المباراة", use: "استخدم",
    oneVone: "مباريات 1v1 تُحسب في تصنيف FFA.",
    mode: "النمط", yourTeam: "فريقك", opponents: "الخصوم", players: "اللاعبون", search: "أضف لاعباً — اكتب اسماً", noMatch: "لا يوجد لاعب",
    move: "انقل إلى الطرف الآخر", remove: "إزالة", winner: "الفائز", result: "النتيجة", victory: "انتصار", defeat: "هزيمة", victorySub: "فاز فريقك", defeatSub: "خسر فريقك",
    pickWinner: "اضغط التاج بجانب الفائز.",
    details: "التفاصيل", mapLabel: "الخريطة", date: "التاريخ", replay: "رابط الإعادة (اختياري)", replayPh: "رابط ديسكورد أو درايف", notes: "ملاحظات (اختياري)",
    preview: "تقرير المعركة", defeated: "هزم", won: "فاز بـ FFA ضد", on: "على",
    hint: { players: "أضف لاعباً واحداً على الأقل لكل طرف.", ffa: "أضف لاعباً آخر على الأقل.", result: "اختر انتصار أو هزيمة.", winner: "اختر الفائز.", tooMany: (n: number) => `${n} لاعبين كحد أقصى لكل طرف في هذا النمط.` },
    submit: "إرسال البلاغ", sending: "جارٍ الإرسال…", sent: "تم إرسال البلاغ — بانتظار تأكيد الطرف الآخر.",
    needs: "بانتظار ردّك", needsSub: "أبلغ أحدهم عن مباراة لعبتها. هل هي صحيحة؟", confirm: "تأكيد", dispute: "اعتراض",
    disputeTitle: "الاعتراض على النتيجة", disputeMsg: "أخبر المشرفين بالخطأ وسيتحققون من الإعادة ويقررون.", disputePh: "مثال: نحن من فاز، لاعبون خاطئون",
    yours: "بلاغاتك", none: "لا توجد بلاغات بعد.", reportedBy: "من", vs: "ضد",
    st: { pending: "بانتظار الطرف الآخر", confirmed: "مؤكَّدة — بانتظار المشرف", disputed: "معترض عليها — سيقرر المشرف", approved: "معتمدة — في التصنيف", rejected: "مرفوضة" },
    errUnknown: (n: string) => `«${n}» ليس لاعباً مسجّلاً.`, errDup: "هذا اللاعب موجود في المباراة بالفعل.",
  },
};

const CSS = `
@keyframes czr-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes czr-pop { 0% { transform: scale(0.96); } 60% { transform: scale(1.02); } 100% { transform: none; } }
.czr-in { animation: czr-in 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czr-pop { animation: czr-pop 0.3s ease both; }
.czr-row { transition: background-color 0.2s ease, border-color 0.2s ease; }
.czr-card { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.czr-card:hover { transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) { .czr-in, .czr-pop { animation: none !important; } .czr-card:hover { transform: none; } }
`;

const mono = { fontFamily: "var(--font-mono), monospace" } as const;

function Brackets({ color = C.amberDim }: { color?: string }) {
  const s = { width: 12, height: 12, borderColor: color } as const;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute left-0 top-0 border-l-2 border-t-2" style={s} />
      <span className="absolute right-0 top-0 border-r-2 border-t-2" style={s} />
      <span className="absolute bottom-0 left-0 border-b-2 border-l-2" style={s} />
      <span className="absolute bottom-0 right-0 border-b-2 border-r-2" style={s} />
    </span>
  );
}

function Section({ code, title, icon: Icon, children, accent = C.amber, right }: { code: string; title: string; icon: typeof Swords; children: ReactNode; accent?: string; right?: ReactNode }) {
  return (
    <section className="czr-in relative border" style={{ background: "linear-gradient(180deg, #12150E, #0E110B)", borderColor: C.line }}>
      <Brackets />
      <header className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: C.line }}>
        <h2 className="flex items-center gap-2.5">
          <span className="text-[10px] tracking-[0.2em]" style={{ color: C.muted, ...mono }}>{code}</span>
          <Icon size={15} style={{ color: accent }} aria-hidden="true" />
          <span className="cz-display text-lg uppercase" style={{ fontWeight: 700, letterSpacing: "0.04em" }}>{title}</span>
        </h2>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

// Type-ahead player search with avatars and ranks
function PlayerPicker({ people, exclude, onPick, placeholder, noMatch, lang }: { people: Person[]; exclude: string[]; onPick: (n: string) => void; placeholder: string; noMatch: string; lang: "en" | "ar" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return people.filter((p) => !exclude.includes(p.username) && p.username.toLowerCase().includes(t)).sort((a, b) => Number(!a.username.toLowerCase().startsWith(t)) - Number(!b.username.toLowerCase().startsWith(t)) || b.rating - a.rating).slice(0, 6);
  }, [q, people, exclude]);
  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const pick = (n: string) => {
    onPick(n);
    setQ("");
    setOpen(false);
    setHi(0);
  };
  return (
    <div ref={box} className="relative">
      <Search size={15} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
      <input
        role="combobox"
        aria-expanded={open && q.trim().length > 0}
        aria-label={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); if (list[hi]) pick(list[hi].username); }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className="min-h-[44px] w-full border border-dashed border-[#3A4029] bg-[#0A0C08] pe-3 ps-9 text-sm text-[#EDEAE0] focus:border-solid focus:border-[#E8A63D]"
      />
      {open && q.trim() && (
        <ul role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 border" style={{ background: "#12150E", borderColor: C.amberDim, boxShadow: "0 14px 40px rgba(0,0,0,0.6)" }}>
          {list.length === 0 && <li className="px-3 py-3 text-sm" style={{ color: C.muted }}>{noMatch}</li>}
          {list.map((p, i) => (
            <li key={p.username} role="option" aria-selected={i === hi}>
              <button type="button" onMouseEnter={() => setHi(i)} onMouseDown={(e) => { e.preventDefault(); pick(p.username); }} className="flex w-full items-center gap-3 px-3 py-2 text-start" style={{ background: i === hi ? "#1C2114" : "transparent" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar || "/default-avatar.svg"} alt="" className="h-7 w-7 rounded-full object-cover" style={{ border: `1px solid ${C.lineStrong}` }} />
                <span className="min-w-0 flex-1 truncate text-sm" style={{ fontWeight: 600 }}>{p.username}</span>
                <span className="text-[11px]" style={{ color: C.amber, ...mono }}>{tierOf(p.rating)[lang]} · {p.rating}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ReportView() {
  const supabase = useMemo(() => createClient(), []);
  const fb = useFeedback();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const [me, setMe] = useState<{ id: string; username: string; banned: boolean } | null | undefined>(undefined);
  const [people, setPeople] = useState<Person[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [quick, setQuick] = useState<QuickFill[]>([]);
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
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [filled, setFilled] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const byName = useMemo(() => Object.fromEntries(people.map((p) => [p.username, p])), [people]);

  async function load(username: string, userId: string) {
    const { data, error } = await supabase.from("match_submissions").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) {
      setReady(false);
      return;
    }
    const mineSubs = ((data ?? []) as Sub[]).filter((s) => s.participants.includes(username));
    setSubs(mineSubs);

    // quick fill: accepted challenges (last 7 days) + recent rosters for a rematch
    const q: QuickFill[] = [];
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: ch } = await supabase.from("challenges").select("id, from_user, from_username, to_username, mode, status, responded_at").eq("status", "accepted").gte("responded_at", since).order("responded_at", { ascending: false }).limit(5);
    for (const c of (ch ?? []) as { id: string; from_user: string; from_username: string; to_username: string; mode: string; responded_at: string }[]) {
      const other = c.from_user === userId ? c.to_username : c.from_username;
      const m: Mode = c.mode === "1v1" ? "ffa" : (c.mode as Mode);
      q.push({ key: `c:${c.id}`, kind: "challenge", label: `${tx.vs} ${other}`, sub: c.mode.toUpperCase(), mode: m, mine: [], opps: m === "ffa" ? [] : [other], ffa: m === "ffa" ? [other] : [] });
    }
    const seen = new Set<string>();
    for (const s of mineSubs.slice(0, 10)) {
      const sig = `${s.mode}|${[...s.participants].sort().join(",")}`;
      if (seen.has(sig) || q.filter((x) => x.kind === "rematch").length >= 3) continue;
      seen.add(sig);
      const mySide = s.winners.includes(username) ? s.winners : s.participants.filter((p) => !s.winners.includes(p));
      const other = s.participants.filter((p) => !mySide.includes(p));
      q.push({ key: `r:${s.id}`, kind: "rematch", label: s.mode === "ffa" ? s.participants.filter((p) => p !== username).join(", ") : `${tx.vs} ${other.join(" + ")}`, sub: s.mode.toUpperCase(), mode: s.mode, mine: mySide.filter((p) => p !== username), opps: s.mode === "ffa" ? [] : other, ffa: s.mode === "ffa" ? s.participants.filter((p) => p !== username) : [] });
    }
    setQuick(q);
    return q;
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setMe(null);
      const { data: p } = await supabase.from("profiles").select("username, banned").eq("id", user.id).single();
      if (!p?.username) return setMe(null);
      setMe({ id: user.id, username: p.username, banned: !!p.banned });
      const { data: all } = await supabase.from("profiles").select("username, avatar_url, rating_team").eq("banned", false).order("username");
      setPeople(((all ?? []) as { username: string; avatar_url: string | null; rating_team: number | null }[]).map((x) => ({ username: x.username, avatar: x.avatar_url, rating: Math.round(Number(x.rating_team ?? 1000)) })));
      const q = await load(p.username, user.id);
      // /report?challenge=<id> fills the form straight from an accepted challenge
      const wanted = new URLSearchParams(window.location.search).get("challenge");
      const hit = wanted && q?.find((x) => x.key === `c:${wanted}`);
      if (hit) applyQuick(hit);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const size = SIZE[mode];
  const team = mode !== "ffa";
  const myTeam = me ? [me.username, ...mates] : mates;
  const ffaPlayers = me ? [me.username, ...ffa] : ffa;
  const everyone = team ? [...myTeam, ...opps] : ffaPlayers;

  function applyQuick(q: QuickFill) {
    setMode(q.mode);
    setMates(q.mine.slice(0, SIZE[q.mode] - 1));
    setOpps(q.opps.slice(0, SIZE[q.mode]));
    setFfa(q.ffa);
    setWon(null);
    setFfaWinner(null);
    setGenerals({});
    setFilled(q.key);
    setTried(false);
  }

  function add(list: "mates" | "opps" | "ffa", name: string) {
    if (!byName[name]) return fb.error(tx.errUnknown(name));
    if (everyone.includes(name)) return fb.error(tx.errDup);
    if (list === "mates") setMates((x) => [...x, name]);
    if (list === "opps") setOpps((x) => [...x, name]);
    if (list === "ffa") setFfa((x) => [...x, name]);
  }

  function move(name: string) {
    if (mates.includes(name) && opps.length < size) {
      setMates((x) => x.filter((y) => y !== name));
      setOpps((x) => [...x, name]);
    } else if (opps.includes(name) && myTeam.length < size) {
      setOpps((x) => x.filter((y) => y !== name));
      setMates((x) => [...x, name]);
    }
  }

  const problem = (() => {
    if (team) {
      if (myTeam.length > size || opps.length > size) return tx.hint.tooMany(size);
      if (opps.length < 1) return tx.hint.players;
      if (won === null) return tx.hint.result;
    } else {
      if (ffaPlayers.length < 2) return tx.hint.ffa;
      if (!ffaWinner) return tx.hint.winner;
    }
    return null;
  })();

  async function submit() {
    if (!me) return;
    setTried(true);
    if (problem) return;
    const participants = team ? [...myTeam, ...opps] : ffaPlayers;
    const winners = team ? (won ? myTeam : opps) : [ffaWinner!];
    const g: Record<string, string> = {};
    for (const p of participants) if (generals[p]) g[p] = generals[p] as string;
    setSending(true);
    const { error } = await supabase.from("match_submissions").insert({
      submitter_username: me.username, mode, participants, winners,
      map: map.trim() || null, notes: notes.trim() || null, replay_url: replay.trim() || null, generals: g, match_date: date,
    });
    setSending(false);
    if (error) return fb.error(error.message);
    fb.success(tx.sent);
    setMates([]); setOpps([]); setFfa([]); setWon(null); setFfaWinner(null); setGenerals({}); setMap(""); setReplay(""); setNotes(""); setFilled(null); setTried(false);
    await load(me.username, me.id);
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
    await load(me.username, me.id);
  }

  const fmt = (d: string) => new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const canAnswer = (s: Sub) => !!me && s.status === "pending" && s.submitter_username !== me.username && (s.mode === "ffa" || s.winners.includes(me.username) !== s.winners.includes(s.submitter_username));
  const needs = subs.filter(canAnswer);
  const mine = subs.filter((s) => !canAnswer(s));
  const avatar = (n: string, s = 32, ring: string = C.lineStrong) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={byName[n]?.avatar || "/default-avatar.svg"} alt="" className="shrink-0 rounded-full object-cover" style={{ width: s, height: s, border: `2px solid ${ring}` }} />
  );

  const playerRow = (p: string, side: "mates" | "opps" | "ffa") => {
    const isMe = p === me?.username;
    const color = side === "opps" ? LOSS : C.amber;
    return (
      <li key={p} className="czr-row czr-pop flex items-center gap-2 border px-2 py-1.5" style={{ borderColor: C.line, background: "#0A0C08" }}>
        {side === "ffa" && (
          <button type="button" onClick={() => setFfaWinner(p)} aria-pressed={ffaWinner === p} aria-label={`${p} — ${tx.winner}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center border" style={{ background: ffaWinner === p ? C.amber : "transparent", borderColor: ffaWinner === p ? C.amber : C.lineStrong, color: ffaWinner === p ? C.void : C.muted }}>
            <Crown size={15} aria-hidden="true" />
          </button>
        )}
        {avatar(p, 30, isMe ? C.amber : color)}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm" style={{ fontWeight: isMe ? 800 : 600, color: isMe ? C.amber : C.paper }}>{p}</span>
          <span className="block text-[10px] uppercase tracking-wider" style={{ color: C.muted, ...mono }}>{tierOf(byName[p]?.rating ?? 1000)[lang]}</span>
        </span>
        <GeneralSelect compact lang={lang} value={generals[p] ?? ""} onChange={(v) => setGenerals((g) => ({ ...g, [p]: v }))} label={p} />
        {side !== "ffa" && !isMe && (
          <button type="button" onClick={() => move(p)} aria-label={`${tx.move}: ${p}`} title={tx.move} className="inline-flex h-9 w-9 shrink-0 items-center justify-center border" style={{ borderColor: C.lineStrong, color: C.muted }}><ArrowLeftRight size={14} aria-hidden="true" /></button>
        )}
        {!isMe ? (
          <button type="button" onClick={() => (side === "mates" ? setMates((x) => x.filter((y) => y !== p)) : side === "opps" ? setOpps((x) => x.filter((y) => y !== p)) : (setFfa((x) => x.filter((y) => y !== p)), ffaWinner === p && setFfaWinner(null)))} aria-label={`${tx.remove}: ${p}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: C.muted }}><X size={15} aria-hidden="true" /></button>
        ) : <span className="w-9 shrink-0" />}
      </li>
    );
  };

  const teamCol = (side: "mates" | "opps", list: string[], label: string, color: string) => (
    <div className="flex flex-col border" style={{ borderColor: (side === "mates" && won === true) || (side === "opps" && won === false) ? C.radar : C.line, background: "#0E110B", transition: "border-color 0.3s ease" }}>
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: C.line }}>
        <span className="cz-display flex items-center gap-2 text-lg uppercase" style={{ color, fontWeight: 700 }}>
          {label}
          {((side === "mates" && won === true) || (side === "opps" && won === false)) && <Crown size={15} style={{ color: C.radar }} aria-hidden="true" />}
        </span>
        <span className="text-xs tabular-nums" style={{ color: list.length === size ? C.radar : C.muted, ...mono }}>{list.length}/{size}</span>
      </div>
      <ul className="flex flex-col gap-2 p-3">{list.map((p) => playerRow(p, side))}</ul>
      {list.length < size && (
        <div className="px-3 pb-3"><PlayerPicker people={people} exclude={everyone} onPick={(n) => add(side, n)} placeholder={tx.search} noMatch={tx.noMatch} lang={lang} /></div>
      )}
    </div>
  );

  const steps = (s: Sub) => {
    const level = s.status === "pending" ? 1 : s.status === "confirmed" || s.status === "disputed" ? 2 : 3;
    const bad = s.status === "rejected" || s.status === "disputed";
    return (
      <div className="flex items-center gap-1.5" dir="ltr" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 w-8" style={{ background: i <= level ? (bad && i === level ? LOSS : i === 3 ? C.radar : C.amber) : C.line }} />
        ))}
      </div>
    );
  };

  const STATUS: Record<Sub["status"], { color: string; icon: typeof Clock }> = {
    pending: { color: C.amber, icon: Clock }, confirmed: { color: C.radar, icon: ShieldCheck }, disputed: { color: LOSS, icon: Flag }, approved: { color: C.radar, icon: Check }, rejected: { color: LOSS, icon: Ban },
  };

  const reportCard = (s: Sub, actions: boolean) => {
    const st = STATUS[s.status];
    const losers = s.participants.filter((p) => !s.winners.includes(p));
    const g = readGenerals(s.generals);
    const name = (p: string) => (g[p] ? `${p} (${generalShort(g[p], lang)})` : p);
    return (
      <li key={s.id} className="czr-in relative border" style={{ borderColor: actions ? "rgba(220,38,38,0.6)" : C.line, background: actions ? "linear-gradient(120deg, rgba(220,38,38,0.10), #0A0C08 60%)" : "#0A0C08" }}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5 text-xs" style={{ borderColor: C.line, color: C.muted }}>
          <span className="uppercase tracking-widest" style={{ color: C.amber, fontWeight: 700, ...mono }}>{s.mode}</span>
          <span>{fmt(s.match_date)}</span>
          {s.map && <span className="inline-flex items-center gap-1"><MapIcon size={11} aria-hidden="true" />{s.map}</span>}
          <span>{tx.reportedBy} <b style={{ color: C.paper }}>{s.submitter_username}</b></span>
          <span className="ms-auto flex items-center gap-3">{steps(s)}<span className="inline-flex items-center gap-1.5" style={{ color: st.color, fontWeight: 700 }}><st.icon size={13} aria-hidden="true" />{tx.st[s.status]}</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
          <span style={{ color: C.radar, fontWeight: 700 }}>▲ {s.winners.map(name).join(" + ")}</span>
          <span className="text-xs uppercase" style={{ color: C.lineStrong, ...mono }}>{tx.vs}</span>
          <span style={{ color: LOSS }}>▼ {losers.map(name).join(" + ")}</span>
          {s.replay_url && <a href={s.replay_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs hover:underline" style={{ color: C.amber }}><Link2 size={12} aria-hidden="true" />replay</a>}
        </div>
        {s.dispute_reason && <p className="px-4 pb-3 text-xs" style={{ color: LOSS }}>“{s.dispute_reason}”</p>}
        {actions && (
          <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-3" style={{ borderColor: C.line }}>
            <button type="button" onClick={() => answer(s, false)} disabled={busy === s.id} className="inline-flex min-h-[42px] items-center gap-2 border px-4 text-xs uppercase tracking-widest disabled:opacity-50" style={{ borderColor: "rgba(248,113,113,0.6)", color: LOSS }}><Flag size={14} aria-hidden="true" />{tx.dispute}</button>
            <button type="button" onClick={() => answer(s, true)} disabled={busy === s.id} className="inline-flex min-h-[42px] items-center gap-2 px-5 text-xs uppercase tracking-widest disabled:opacity-50" style={{ background: C.radar, color: C.void, fontWeight: 800 }}>
              {busy === s.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{tx.confirm}
            </button>
          </div>
        )}
      </li>
    );
  };

  // live preview sentence
  const preview = (() => {
    const mapPart = map.trim() ? ` ${tx.on} ${map.trim()}` : "";
    if (team) {
      if (!opps.length) return null;
      const w = won === null ? null : won ? myTeam : opps;
      const l = won === null ? null : won ? opps : myTeam;
      if (!w || !l) return { text: `${myTeam.join(" + ")} ${tx.vs} ${opps.join(" + ")}`, sub: `${mode.toUpperCase()}${mapPart} · ${fmt(date)}`, ok: false };
      return { text: `${w.join(" + ")} ${tx.defeated} ${l.join(" + ")}`, sub: `${mode.toUpperCase()}${mapPart} · ${fmt(date)}`, ok: true };
    }
    if (ffaPlayers.length < 2) return null;
    if (!ffaWinner) return { text: ffaPlayers.join(" · "), sub: `FFA${mapPart} · ${fmt(date)}`, ok: false };
    return { text: `${ffaWinner} ${tx.won} ${ffaPlayers.filter((p) => p !== ffaWinner).join(", ")}`, sub: `FFA${mapPart} · ${fmt(date)}`, ok: true };
  })();

  return (
    <main className="relative min-h-screen w-full overflow-x-clip pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{CSS}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[520px]" style={{ background: "radial-gradient(ellipse 55% 60% at 80% 10%, rgba(232,166,61,0.10), transparent 65%)" }} />

      <header className="relative border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-10 pt-12 md:pt-16`}>
          <div className="czr-in flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.radar, ...mono }}><ClipboardCheck size={14} aria-hidden="true" />{tx.eyebrow}</div>
          <h1 className="czr-in cz-display mt-3 uppercase leading-[0.88]" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, animationDelay: "0.05s" }}>{tx.title}</h1>
          <p className="czr-in mt-4 max-w-2xl text-base leading-relaxed" style={{ color: C.muted, animationDelay: "0.1s" }}>{tx.sub}</p>
          <ol className="czr-in mt-7 flex flex-wrap items-center gap-2" style={{ animationDelay: "0.15s" }}>
            {tx.steps.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 border px-3 py-2 text-xs uppercase tracking-[0.14em]" style={{ borderColor: i === 0 ? C.amber : C.lineStrong, color: i === 0 ? C.amber : C.muted, background: i === 0 ? "rgba(232,166,61,0.08)" : "transparent", ...mono }}>
                  <span className="inline-flex h-5 w-5 items-center justify-center text-[11px]" style={{ background: i === 0 ? C.amber : C.line, color: i === 0 ? C.void : C.paper, fontWeight: 800 }}>{i + 1}</span>
                  {s}
                </span>
                {i < 2 && <ChevronRight size={14} className="rtl:-scale-x-100" style={{ color: C.lineStrong }} aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className={`${WRAP} relative mt-8 flex flex-col gap-6`}>
        {me === undefined ? (
          <Loader2 size={22} className="animate-spin" style={{ color: C.muted }} aria-hidden="true" />
        ) : me === null ? (
          <div className="flex flex-wrap items-center gap-4 border p-6" style={{ borderColor: C.amberDim, background: "#0E110B" }}>
            <span className="flex-1">{tx.signIn}</span>
            <Link href="/login" className="inline-flex min-h-[44px] items-center gap-2 px-5 text-xs uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}><LogIn size={15} className="rtl:-scale-x-100" aria-hidden="true" />{tx.login}</Link>
          </div>
        ) : !ready ? (
          <p className="flex items-start gap-2 border p-5 text-sm" style={{ borderColor: C.amberDim, background: "#0E110B", color: C.muted }}><Info size={17} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />{tx.notReady}</p>
        ) : (
          <>
            {needs.length > 0 && (
              <Section code="!!" title={`${tx.needs} · ${needs.length}`} icon={Flag} accent={RED}>
                <p className="-mt-1 mb-4 text-sm" style={{ color: C.muted }}>{tx.needsSub}</p>
                <ul className="flex flex-col gap-3">{needs.map((s) => reportCard(s, true))}</ul>
              </Section>
            )}

            {me.banned ? (
              <p className="border p-5 text-sm" style={{ borderColor: "rgba(248,113,113,0.5)", color: LOSS }}>{tx.banned}</p>
            ) : (
              <>
                {quick.length > 0 && (
                  <Section code="01" title={tx.quick} icon={Zap}>
                    <p className="-mt-1 mb-4 text-xs" style={{ color: C.muted }}>{tx.quickSub}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {quick.map((q) => (
                        <button key={q.key} type="button" onClick={() => applyQuick(q)} aria-pressed={filled === q.key} className="czr-card flex items-center gap-3 border p-3 text-start" style={{ borderColor: filled === q.key ? C.amber : C.line, background: filled === q.key ? "rgba(232,166,61,0.08)" : "#0A0C08", boxShadow: filled === q.key ? "0 0 20px rgba(232,166,61,0.15)" : "none" }}>
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center" style={{ border: `1px solid ${q.kind === "challenge" ? RED : C.amberDim}`, color: q.kind === "challenge" ? RED : C.amber }}>
                            {q.kind === "challenge" ? <Swords size={17} aria-hidden="true" /> : <RotateCcw size={17} aria-hidden="true" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[10px] uppercase tracking-[0.18em]" style={{ color: q.kind === "challenge" ? LOSS : C.muted, ...mono }}>{q.kind === "challenge" ? tx.fromChallenge : tx.rematch} · {q.sub}</span>
                            <span className="block truncate text-sm" style={{ fontWeight: 700 }}>{q.label}</span>
                          </span>
                          {filled === q.key ? <Check size={16} style={{ color: C.amber }} aria-hidden="true" /> : <span className="text-[11px] uppercase tracking-widest" style={{ color: C.amber }}>{tx.use}</span>}
                        </button>
                      ))}
                    </div>
                  </Section>
                )}

                <Section code={quick.length ? "02" : "01"} title={tx.title} icon={FileText}>
                  {/* mode */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: C.muted, ...mono }}>{tx.mode}</span>
                    <div className="grid grid-cols-4 gap-2" role="group" dir="ltr">
                      {MODES.map((m) => (
                        <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setWon(null); setFfaWinner(null); setFilled(null); }} className="min-h-[46px] min-w-[64px] border px-3" style={{ background: mode === m ? "linear-gradient(180deg, rgba(232,166,61,0.25), rgba(232,166,61,0.08))" : "#0A0C08", borderColor: mode === m ? C.amber : C.lineStrong }}>
                          <span className="cz-display text-lg uppercase" style={{ color: mode === m ? C.amber : C.paper, fontWeight: 700 }}>{m}</span>
                        </button>
                      ))}
                    </div>
                    {filled?.startsWith("c:") && mode === "ffa" && quick.find((q) => q.key === filled)?.sub === "1V1" && <span className="text-xs" style={{ color: C.muted }}>{tx.oneVone}</span>}
                  </div>

                  {/* sides */}
                  {team ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
                      {teamCol("mates", myTeam, tx.yourTeam, C.amber)}
                      <div className="flex items-center justify-center py-1 md:py-10"><span className="cz-display text-2xl" style={{ color: C.lineStrong, fontWeight: 700 }}>{tx.vs.toUpperCase()}</span></div>
                      {teamCol("opps", opps, tx.opponents, LOSS)}
                    </div>
                  ) : (
                    <div className="mt-5 border" style={{ borderColor: C.line, background: "#0E110B" }}>
                      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: C.line }}>
                        <span className="cz-display text-lg uppercase" style={{ color: C.amber, fontWeight: 700 }}>{tx.players}</span>
                        <span className="text-xs" style={{ color: C.muted }}>{tx.pickWinner}</span>
                      </div>
                      <ul className="flex flex-col gap-2 p-3">{ffaPlayers.map((p) => playerRow(p, "ffa"))}</ul>
                      {ffaPlayers.length < SIZE.ffa && <div className="px-3 pb-3"><PlayerPicker people={people} exclude={everyone} onPick={(n) => add("ffa", n)} placeholder={tx.search} noMatch={tx.noMatch} lang={lang} /></div>}
                    </div>
                  )}

                  {/* result */}
                  {team && (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[true, false].map((v) => {
                        const on = won === v;
                        const col = v ? C.radar : LOSS;
                        return (
                          <button key={String(v)} type="button" aria-pressed={on} onClick={() => setWon(v)} className="czr-card flex items-center gap-4 border p-4 text-start" style={{ borderColor: on ? col : C.lineStrong, background: on ? `linear-gradient(120deg, ${v ? "rgba(143,191,79,0.18)" : "rgba(220,38,38,0.16)"}, #0A0C08 70%)` : "#0A0C08", boxShadow: on ? `0 0 24px ${v ? "rgba(143,191,79,0.2)" : "rgba(220,38,38,0.2)"}` : "none" }}>
                            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center" style={{ background: on ? col : "transparent", border: `1px solid ${col}`, color: on ? C.void : col }}>
                              {v ? <Crown size={22} aria-hidden="true" /> : <Skull size={22} aria-hidden="true" />}
                            </span>
                            <span>
                              <span className="cz-display block text-2xl uppercase leading-none" style={{ color: on ? col : C.paper, fontWeight: 700 }}>{v ? tx.victory : tx.defeat}</span>
                              <span className="mt-1 block text-xs" style={{ color: C.muted }}>{v ? tx.victorySub : tx.defeatSub}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* details */}
                  <div className="mt-6 text-[10px] uppercase tracking-[0.25em]" style={{ color: C.muted, ...mono }}>{tx.details}</div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}><MapIcon size={12} aria-hidden="true" />{tx.mapLabel}</span>
                      <input list="report-maps" value={map} onChange={(e) => setMap(e.target.value)} className="min-h-[44px] w-full border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                      <datalist id="report-maps">{MAP_FILES.map((m) => <option key={m.name} value={m.name} />)}</datalist>
                    </label>
                    <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}><Calendar size={12} aria-hidden="true" />{tx.date}</span>
                      <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="min-h-[44px] w-full border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                    </label>
                    <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}><Link2 size={12} aria-hidden="true" />{tx.replay}</span>
                      <input value={replay} onChange={(e) => setReplay(e.target.value)} placeholder={tx.replayPh} className="min-h-[44px] w-full border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                    </label>
                    <label className="block"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>{tx.notes}</span>
                      <input value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} className="min-h-[44px] w-full border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                    </label>
                  </div>

                  {/* battle report preview */}
                  <div className="relative mt-6 border p-4" style={{ borderColor: preview?.ok ? C.radar : C.line, background: "#0A0C08", transition: "border-color 0.3s ease" }}>
                    <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: preview?.ok ? C.radar : C.muted, ...mono }}>▮ {tx.preview}</div>
                    {preview ? (
                      <>
                        <div className="cz-display mt-1 text-xl uppercase leading-tight md:text-2xl" style={{ fontWeight: 700, color: preview.ok ? C.paper : C.muted }}>{preview.text}</div>
                        <div className="mt-1 text-xs" style={{ color: C.muted, ...mono }}>{preview.sub}</div>
                      </>
                    ) : (
                      <div className="mt-1 text-sm" style={{ color: C.muted }}>{team ? tx.hint.players : tx.hint.ffa}</div>
                    )}
                    {problem && (preview || tried) && <div className="mt-2 text-xs" role={tried ? "alert" : undefined} style={{ color: tried ? LOSS : C.amber }}>→ {problem}</div>}
                  </div>

                  <button type="button" onClick={submit} disabled={sending} className="mt-5 inline-flex min-h-[56px] w-full items-center justify-center gap-2 text-sm uppercase tracking-[0.18em] transition-[filter,opacity] hover:brightness-110 disabled:opacity-60" style={{ background: problem ? "#3A4029" : C.amber, color: problem ? C.paper : C.void, fontWeight: 800, boxShadow: problem ? "none" : "0 0 30px rgba(232,166,61,0.3)" }}>
                    {sending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <ClipboardCheck size={18} aria-hidden="true" />}{sending ? tx.sending : tx.submit}
                  </button>
                </Section>
              </>
            )}

            <Section code="RX" title={tx.yours} icon={ClipboardCheck}>
              {mine.length === 0 ? <p className="text-sm" style={{ color: C.muted }}>{tx.none}</p> : <ul className="flex flex-col gap-3">{mine.map((s) => reportCard(s, false))}</ul>}
            </Section>
          </>
        )}
      </div>
    </main>
  );
}
