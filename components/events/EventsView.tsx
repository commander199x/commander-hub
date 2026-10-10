"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Users, Trophy, Radio, Target, Sparkles, Check, HelpCircle, Clock, Share2, CalendarPlus, Plus, Trash2, Loader2, LogIn, Info, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useFeedback } from "@/components/FeedbackProvider";

type Kind = "clan_night" | "tournament" | "stream" | "training" | "other";
type Ev = { id: string; title: string; description: string | null; kind: Kind; starts_at: string; ends_at: string | null; link: string | null; created_by: string | null };
type Rsvp = { event_id: string; user_id: string; username: string; status: "going" | "maybe" };

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const SITE = "https://www.commander.host";
const KINDS: Record<Kind, { icon: typeof Users; color: string; en: string; ar: string }> = {
  clan_night: { icon: Users, color: C.amber, en: "Clan night", ar: "ليلة الكلان" },
  tournament: { icon: Trophy, color: "#E8A63D", en: "Tournament", ar: "بطولة" },
  stream: { icon: Radio, color: "#DC2626", en: "Live stream", ar: "بث مباشر" },
  training: { icon: Target, color: "#8FBF4F", en: "Training", ar: "تدريب" },
  other: { icon: Sparkles, color: "#C9CCC0", en: "Event", ar: "فعالية" },
};

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Operations calendar", title: "Events", sub: "Clan nights, tournaments and streams. RSVP and you'll get a reminder an hour before it starts.",
    next: "Next operation", upcoming: "Upcoming", past: "Past events", none: "No events scheduled yet — check back soon.",
    going: "Going", maybe: "Maybe", youGoing: "You're going", youMaybe: "You might come", cancel: "Cancel RSVP", login: "Log in to RSVP",
    count: (g: number, m: number) => `${g} going${m ? ` · ${m} maybe` : ""}`, startsIn: "Starts in", live: "Happening now", ended: "Ended",
    addCal: "Add to calendar", google: "Google Calendar", ics: "Phone / Outlook (.ics)", share: "Copy link", copied: "Link copied", open: "Open",
    newEvent: "New event", adminOnly: "Only admins see this.", eTitle: "Title", eKind: "Type", eDate: "Date", eTime: "Start time (your time)", eHours: "Length",
    eDesc: "Details (optional)", eLink: "Link (optional, e.g. /live or a Discord invite)", post: "Post on Discord", notifyAll: "Notify all members", create: "Create event",
    created: "Event created.", del: "Delete", delConfirm: "Delete this event?", needSql: "Events aren't switched on yet — an admin needs to run sql/events-achievements.sql once in Supabase.",
    d: "d", h: "h", m: "m", s: "s", hours: (n: number) => `${n} h`,
  },
  ar: {
    eyebrow: "تقويم العمليات", title: "الفعاليات", sub: "ليالي الكلان والبطولات والبث المباشر. سجّل حضورك ويصلك تذكير قبل البدء بساعة.",
    next: "العملية القادمة", upcoming: "القادمة", past: "الفعاليات السابقة", none: "لا توجد فعاليات بعد — تابعنا قريباً.",
    going: "سأحضر", maybe: "ربما", youGoing: "أنت حاضر", youMaybe: "قد تحضر", cancel: "إلغاء الحضور", login: "سجّل الدخول للحضور",
    count: (g: number, m: number) => `${g} حاضر${m ? ` · ${m} ربما` : ""}`, startsIn: "تبدأ بعد", live: "جارية الآن", ended: "انتهت",
    addCal: "أضف إلى التقويم", google: "تقويم جوجل", ics: "الهاتف / آوتلوك (.ics)", share: "نسخ الرابط", copied: "تم نسخ الرابط", open: "افتح",
    newEvent: "فعالية جديدة", adminOnly: "يراها المشرفون فقط.", eTitle: "العنوان", eKind: "النوع", eDate: "التاريخ", eTime: "وقت البدء (بتوقيتك)", eHours: "المدة",
    eDesc: "التفاصيل (اختياري)", eLink: "رابط (اختياري، مثل /live أو دعوة ديسكورد)", post: "انشر في ديسكورد", notifyAll: "أشعر كل الأعضاء", create: "إنشاء الفعالية",
    created: "تم إنشاء الفعالية.", del: "حذف", delConfirm: "حذف هذه الفعالية؟", needSql: "الفعاليات غير مفعّلة بعد — يجب على أحد المشرفين تشغيل sql/events-achievements.sql مرة واحدة في Supabase.",
    d: "ي", h: "س", m: "د", s: "ث", hours: (n: number) => `${n} س`,
  },
};

const CSS = `
@keyframes czev-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes czev-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.czev-in { animation: czev-in 0.5s cubic-bezier(0.2,0.7,0.2,1) both; }
.czev-pulse { animation: czev-pulse 1.4s ease-in-out infinite; }
.czev-card { transition: border-color 0.25s ease, transform 0.25s ease; }
.czev-card:hover { border-color: #8A6425 !important; }
@media (prefers-reduced-motion: reduce) { .czev-in, .czev-pulse { animation: none !important; } }
`;

const endOf = (e: Ev) => (e.ends_at ? Date.parse(e.ends_at) : Date.parse(e.starts_at) + 3 * 3600_000);
const gcalStamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function Box({ title, icon: Icon, children, right, accent = C.amber }: { title: string; icon: typeof Users; children: ReactNode; right?: ReactNode; accent?: string }) {
  return (
    <section className="czev-in border" style={{ background: C.panel, borderColor: C.line }}>
      <header className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: C.line }}>
        <h2 className="cz-display flex items-center gap-2.5 text-lg uppercase" style={{ fontWeight: 700 }}><Icon size={16} style={{ color: accent }} aria-hidden="true" />{title}</h2>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function EventsView() {
  const supabase = useMemo(() => createClient(), []);
  const fb = useFeedback();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [me, setMe] = useState<{ id: string; username: string; admin: boolean } | null | undefined>(undefined);
  const [events, setEvents] = useState<Ev[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [ready, setReady] = useState<boolean | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState<string | null>(null);
  const [calOpen, setCalOpen] = useState<string | null>(null);
  const [form, setForm] = useState(() => ({ title: "", kind: "clan_night" as Kind, date: new Date().toISOString().slice(0, 10), time: "21:00", hours: 2, desc: "", link: "", post: true, notify: false }));

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 45 * 86400000).toISOString();
    const [e, r] = await Promise.all([
      supabase.from("events").select("*").gte("starts_at", since).order("starts_at"),
      supabase.from("event_rsvps").select("event_id, user_id, username, status"),
    ]);
    if (e.error) return setReady(false);
    setReady(true);
    setEvents((e.data ?? []) as Ev[]);
    const rs = (r.data ?? []) as Rsvp[];
    setRsvps(rs);
    const names = Array.from(new Set(rs.map((x) => x.username)));
    if (names.length) {
      const { data } = await supabase.from("profiles").select("username, avatar_url").in("username", names);
      setAvatars(Object.fromEntries(((data ?? []) as { username: string; avatar_url: string | null }[]).map((p) => [p.username, p.avatar_url])));
    }
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("username, is_admin").eq("id", user.id).single();
        setMe(data?.username ? { id: user.id, username: data.username, admin: !!data.is_admin } : null);
      } else setMe(null);
      await load();
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash) setTimeout(() => document.getElementById(`ev-${hash}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    })();
    const t = setInterval(() => setNow(Date.now()), 1000);
    const r = setInterval(load, 60_000);
    return () => { clearInterval(t); clearInterval(r); };
  }, [supabase, load]);

  const upcoming = events.filter((e) => endOf(e) > now);
  const past = events.filter((e) => endOf(e) <= now).reverse().slice(0, 6);
  const nextEv = upcoming[0];
  const listed = day ? upcoming.filter((e) => new Date(e.starts_at).toDateString() === day) : upcoming;

  async function rsvp(e: Ev, status: "going" | "maybe" | null) {
    if (!me) return;
    setBusy(e.id);
    const mine = rsvps.find((r) => r.event_id === e.id && r.user_id === me.id);
    let error = null;
    if (status === null) ({ error } = await supabase.from("event_rsvps").delete().eq("event_id", e.id).eq("user_id", me.id));
    else if (mine) ({ error } = await supabase.from("event_rsvps").update({ status }).eq("event_id", e.id).eq("user_id", me.id));
    else ({ error } = await supabase.from("event_rsvps").insert({ event_id: e.id, user_id: me.id, username: me.username, status }));
    setBusy(null);
    if (error) return fb.error(error.message);
    load();
  }

  async function createEvent() {
    if (!me?.admin || form.title.trim().length < 3) return;
    setBusy("create");
    const start = new Date(`${form.date}T${form.time}:00`); // the admin's own time zone
    const { data, error } = await supabase.from("events").insert({
      title: form.title.trim(), kind: form.kind, description: form.desc.trim() || null, link: form.link.trim() || null,
      starts_at: start.toISOString(), ends_at: new Date(start.getTime() + form.hours * 3600_000).toISOString(), created_by: me.username,
    }).select("id").single();
    if (error) { setBusy(null); return fb.error(error.message); }
    const id = (data as { id: string }).id;
    if (form.notify) {
      const { data: all } = await supabase.from("profiles").select("id").eq("banned", false);
      const rows = ((all ?? []) as { id: string }[]).map((p) => ({ user_id: p.id, message: `📅 New event: ${form.title.trim()} — ${start.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`, link: `/events#${id}`, read: false }));
      for (let i = 0; i < rows.length; i += 500) await supabase.from("notifications").insert(rows.slice(i, i + 500));
    }
    if (form.post) {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/events/announce", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token ?? ""}` }, body: JSON.stringify({ id }) });
      if (!res.ok) fb.error(`Event created, but the Discord post failed: ${((await res.json().catch(() => ({}))) as { error?: string }).error ?? res.status}`);
    }
    setBusy(null);
    fb.success(tx.created);
    setForm((f) => ({ ...f, title: "", desc: "", link: "" }));
    load();
  }

  async function del(e: Ev) {
    if (!(await fb.confirm({ title: tx.delConfirm, message: e.title, confirmLabel: tx.del, danger: true }))) return;
    const { error } = await supabase.from("events").delete().eq("id", e.id);
    if (error) return fb.error(error.message);
    load();
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const countdown = (e: Ev) => {
    const start = Date.parse(e.starts_at);
    if (now >= start && now < endOf(e)) return <span className="inline-flex items-center gap-1.5" style={{ color: "#DC2626", fontWeight: 800 }}><span className="czev-pulse h-2 w-2 rounded-full" style={{ background: "#DC2626" }} />{tx.live}</span>;
    let s = Math.max(0, Math.floor((start - now) / 1000));
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    return <span className="tabular-nums" dir="ltr">{d > 0 && `${d}${tx.d} `}{h}{tx.h} {String(m).padStart(2, "0")}{tx.m} {String(s).padStart(2, "0")}{tx.s}</span>;
  };
  const icsHref = (e: Ev) => {
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Commander//Events//EN", "BEGIN:VEVENT", `UID:${e.id}@commander.host`, `DTSTAMP:${gcalStamp(Date.now())}`, `DTSTART:${gcalStamp(Date.parse(e.starts_at))}`, `DTEND:${gcalStamp(endOf(e))}`, `SUMMARY:${e.title.replace(/[,;]/g, " ")}`, `DESCRIPTION:${(e.description ?? "").replace(/\n/g, "\\n").replace(/[,;]/g, " ")}`, `URL:${SITE}/events#${e.id}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
  };
  const gcalHref = (e: Ev) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${gcalStamp(Date.parse(e.starts_at))}/${gcalStamp(endOf(e))}&details=${encodeURIComponent(`${e.description ?? ""}\n\n${SITE}/events#${e.id}`)}`;

  const eventCard = (e: Ev, big = false) => {
    const k = KINDS[e.kind] ?? KINDS.other;
    const Icon = k.icon;
    const going = rsvps.filter((r) => r.event_id === e.id && r.status === "going");
    const maybe = rsvps.filter((r) => r.event_id === e.id && r.status === "maybe");
    const mine = me ? rsvps.find((r) => r.event_id === e.id && r.user_id === me.id) : undefined;
    const isPast = endOf(e) <= now;
    return (
      <article key={e.id} id={`ev-${e.id}`} className={`czev-in czev-card relative border ${big ? "p-6 md:p-8" : "p-5"}`} style={{ borderColor: big ? k.color + "88" : C.line, background: big ? `linear-gradient(130deg, ${k.color}1c, #12150E 55%)` : C.panel, opacity: isPast ? 0.65 : 1 }}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex w-16 shrink-0 flex-col items-center border py-2" style={{ borderColor: k.color + "77", background: "#0A0C08" }} aria-hidden="true">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: k.color, fontWeight: 700 }}>{new Date(e.starts_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short" })}</span>
            <span className="cz-display text-3xl leading-none" style={{ fontWeight: 700 }}>{new Date(e.starts_at).getDate()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: k.color, fontWeight: 700 }}><Icon size={13} aria-hidden="true" />{k[lang]}</div>
            <h3 className={`cz-display mt-1 uppercase leading-tight ${big ? "text-4xl md:text-5xl" : "text-2xl"}`} style={{ fontWeight: 700 }}>{e.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: C.muted }}>
              <span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden="true" />{fmtDate(e.starts_at)}</span>
              {!isPast && <span className="inline-flex items-center gap-1.5" style={{ color: C.paper }}>{Date.parse(e.starts_at) > now && <span style={{ color: C.muted }}>{tx.startsIn}</span>}{countdown(e)}</span>}
              {isPast && <span>{tx.ended}</span>}
            </div>
            {e.description && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed" style={{ color: C.paper }}>{e.description}</p>}
          </div>
          {me?.admin && <button type="button" onClick={() => del(e)} aria-label={`${tx.del}: ${e.title}`} title={tx.del} className="inline-flex h-9 w-9 items-center justify-center" style={{ color: C.muted }}><Trash2 size={15} aria-hidden="true" /></button>}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {(going.length > 0 || maybe.length > 0) && (
            <span className="flex items-center gap-2">
              <span className="flex -space-x-2 rtl:space-x-reverse" aria-hidden="true">
                {going.slice(0, 6).map((r) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={r.user_id} src={avatars[r.username] || "/default-avatar.svg"} alt="" title={r.username} className="h-8 w-8 rounded-full object-cover" style={{ border: `2px solid ${C.panel}`, outline: `1px solid ${C.radar}` }} />
                ))}
              </span>
              <span className="text-sm" style={{ color: C.paper, fontWeight: 600 }}>{tx.count(going.length, maybe.length)}</span>
            </span>
          )}
          <span className="ms-auto flex flex-wrap items-center gap-2">
            {!isPast && (me === null ? (
              <Link href="/login" className="inline-flex min-h-[42px] items-center gap-2 border px-4 text-xs uppercase tracking-widest" style={{ borderColor: C.amberDim, color: C.amber }}><LogIn size={14} className="rtl:-scale-x-100" aria-hidden="true" />{tx.login}</Link>
            ) : me ? (
              <>
                {(["going", "maybe"] as const).map((st) => {
                  const on = mine?.status === st;
                  return (
                    <button key={st} type="button" aria-pressed={on} disabled={busy === e.id} onClick={() => rsvp(e, on ? null : st)} className="inline-flex min-h-[42px] items-center gap-2 border px-4 text-xs uppercase tracking-widest disabled:opacity-50" style={{ background: on ? (st === "going" ? C.radar : C.amber) : "transparent", color: on ? C.void : st === "going" ? C.radar : C.amber, borderColor: st === "going" ? C.radar : C.amber, fontWeight: 800 }}>
                      {busy === e.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : st === "going" ? <Check size={14} aria-hidden="true" /> : <HelpCircle size={14} aria-hidden="true" />}
                      {on ? (st === "going" ? tx.youGoing : tx.youMaybe) : st === "going" ? tx.going : tx.maybe}
                    </button>
                  );
                })}
              </>
            ) : null)}
            {!isPast && (
              <span className="relative">
                <button type="button" onClick={() => setCalOpen((c) => (c === e.id ? null : e.id))} aria-expanded={calOpen === e.id} className="inline-flex min-h-[42px] items-center gap-2 border px-3 text-xs uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.paper }}><CalendarPlus size={14} aria-hidden="true" />{tx.addCal}</button>
                {calOpen === e.id && (
                  <span className="absolute end-0 top-full z-10 mt-1 flex w-60 flex-col border" style={{ background: "#12150E", borderColor: C.amberDim, boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
                    <a href={gcalHref(e)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#171B10]">{tx.google}<ArrowUpRight size={13} className="ms-auto" aria-hidden="true" /></a>
                    <a href={icsHref(e)} download={`${e.title.replace(/[^\w-]+/g, "-")}.ics`} className="flex items-center gap-2 border-t px-4 py-3 text-sm hover:bg-[#171B10]" style={{ borderColor: C.line }}>{tx.ics}</a>
                  </span>
                )}
              </span>
            )}
            <button type="button" onClick={async () => { await navigator.clipboard?.writeText(`${SITE}/events#${e.id}`).catch(() => {}); fb.success(tx.copied); }} aria-label={tx.share} title={tx.share} className="inline-flex min-h-[42px] w-11 items-center justify-center border" style={{ borderColor: C.lineStrong, color: C.paper }}><Share2 size={14} aria-hidden="true" /></button>
            {e.link && <a href={e.link} target={e.link.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="inline-flex min-h-[42px] items-center gap-1.5 border px-3 text-xs uppercase tracking-widest" style={{ borderColor: k.color, color: k.color }}>{tx.open}<ArrowUpRight size={13} className="rtl:-scale-x-100" aria-hidden="true" /></a>}
          </span>
        </div>
      </article>
    );
  };

  // month grid
  const first = new Date(month);
  const startPad = (first.getDay() + 6) % 7; // Monday first
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: startPad + daysIn }, (_, i) => (i < startPad ? null : new Date(first.getFullYear(), first.getMonth(), i - startPad + 1)));
  const evDays = new Map<string, Ev[]>();
  for (const e of events) { const k = new Date(e.starts_at).toDateString(); evDays.set(k, [...(evDays.get(k) ?? []), e]); }
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "narrow" }));

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{CSS}</style>
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-10 pt-14 md:pt-20`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}><CalendarDays size={14} aria-hidden="true" />{tx.eyebrow}</div>
          <h1 className="cz-display mt-3 uppercase leading-none" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700 }}>{tx.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: C.muted }}>{tx.sub}</p>
        </div>
      </header>

      <div className={`${WRAP} mt-8`}>
        {ready === false && <p className="mb-6 flex items-start gap-2 border p-5 text-sm" style={{ borderColor: C.amberDim, background: C.panel, color: C.muted }}><Info size={17} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />{tx.needSql}</p>}

        {nextEv && (
          <div className="mb-8">
            <div className="mb-3 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.amber }}>▮ {tx.next}</div>
            {eventCard(nextEv, true)}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-4">
            <h2 className="cz-display text-3xl uppercase" style={{ fontWeight: 600 }}>{tx.upcoming}{day && <button type="button" onClick={() => setDay(null)} className="ms-3 align-middle text-xs uppercase tracking-widest" style={{ color: C.amber }}>✕ {new Date(day).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}</button>}</h2>
            {ready && listed.filter((e) => e.id !== nextEv?.id || day).length === 0 && !nextEv && <p className="border px-5 py-8 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>{tx.none}</p>}
            {listed.filter((e) => day || e.id !== nextEv?.id).map((e) => eventCard(e))}
            {past.length > 0 && (
              <>
                <h2 className="cz-display mt-6 text-2xl uppercase" style={{ fontWeight: 600, color: C.muted }}>{tx.past}</h2>
                {past.map((e) => eventCard(e))}
              </>
            )}
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--cz-header-h,64px)+24px)]">
            <Box title={month.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" })} icon={CalendarDays}
              right={<span className="flex gap-1"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="inline-flex h-8 w-8 items-center justify-center border" style={{ borderColor: C.lineStrong }}><ChevronLeft size={15} className="rtl:-scale-x-100" aria-hidden="true" /></button><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="inline-flex h-8 w-8 items-center justify-center border" style={{ borderColor: C.lineStrong }}><ChevronRight size={15} className="rtl:-scale-x-100" aria-hidden="true" /></button></span>}>
              <div className="grid grid-cols-7 gap-1 text-center" dir="ltr">
                {weekdays.map((w, i) => <span key={i} className="pb-1 text-[10px] uppercase" style={{ color: C.muted }}>{w}</span>)}
                {cells.map((d, i) => {
                  if (!d) return <span key={i} />;
                  const k = d.toDateString();
                  const evs = evDays.get(k) ?? [];
                  const today = k === new Date(now).toDateString();
                  const on = day === k;
                  return (
                    <button key={i} type="button" disabled={!evs.length} onClick={() => setDay(on ? null : k)} aria-pressed={on} className="relative flex aspect-square flex-col items-center justify-center text-sm disabled:cursor-default" style={{ background: on ? C.amber : evs.length ? "rgba(232,166,61,0.10)" : "transparent", color: on ? C.void : today ? C.amber : evs.length ? C.paper : C.muted, border: today ? `1px solid ${C.amber}` : "1px solid transparent", fontWeight: evs.length || today ? 700 : 400 }}>
                      {d.getDate()}
                      {evs.length > 0 && <span className="absolute bottom-1 flex gap-0.5">{evs.slice(0, 3).map((e) => <span key={e.id} className="h-1 w-1 rounded-full" style={{ background: on ? C.void : (KINDS[e.kind] ?? KINDS.other).color }} />)}</span>}
                    </button>
                  );
                })}
              </div>
            </Box>

            {me?.admin && (
              <Box title={tx.newEvent} icon={Plus} accent="#DC2626" right={<span className="text-[10px]" style={{ color: C.muted }}>{tx.adminOnly}</span>}>
                <div className="flex flex-col gap-3">
                  <input value={form.title} maxLength={90} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={tx.eTitle} aria-label={tx.eTitle} className="min-h-[44px] border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                  <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })} aria-label={tx.eKind} className="min-h-[44px] border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0]">
                    {(Object.keys(KINDS) as Kind[]).map((k) => <option key={k} value={k}>{KINDS[k][lang]}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>{tx.eDate}<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 min-h-[44px] w-full border border-[#3A4029] bg-[#0A0C08] px-2 text-sm normal-case tracking-normal text-[#EDEAE0]" /></label>
                    <label className="block text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>{tx.eTime}<input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1 min-h-[44px] w-full border border-[#3A4029] bg-[#0A0C08] px-2 text-sm text-[#EDEAE0]" /></label>
                  </div>
                  <label className="flex items-center gap-2 text-sm">{tx.eHours}
                    <select value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} className="min-h-[40px] border border-[#3A4029] bg-[#0A0C08] px-2 text-sm text-[#EDEAE0]">{[1, 2, 3, 4, 6].map((h) => <option key={h} value={h}>{tx.hours(h)}</option>)}</select>
                  </label>
                  <textarea value={form.desc} maxLength={600} rows={3} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder={tx.eDesc} aria-label={tx.eDesc} className="border border-[#3A4029] bg-[#0A0C08] px-3 py-2 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                  <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder={tx.eLink} aria-label={tx.eLink} className="min-h-[44px] border border-[#3A4029] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.post} onChange={(e) => setForm({ ...form, post: e.target.checked })} style={{ accentColor: C.amber, width: 16, height: 16 }} />{tx.post}</label>
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.notify} onChange={(e) => setForm({ ...form, notify: e.target.checked })} style={{ accentColor: C.amber, width: 16, height: 16 }} />{tx.notifyAll}</label>
                  <button type="button" onClick={createEvent} disabled={busy === "create" || form.title.trim().length < 3} className="inline-flex min-h-[48px] items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] disabled:opacity-40" style={{ background: C.amber, color: C.void, fontWeight: 800 }}>
                    {busy === "create" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}{tx.create}
                  </button>
                </div>
              </Box>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
