"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Users, Swords, Activity, Disc3, MessageSquare, Flag, ShieldAlert, Map as MapIcon, Clock, ScrollText, ArrowUpRight, TrendingUp, TrendingDown, RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import TankSpinner from "@/components/TankSpinner";

// Admin-only overview. Access is checked here AND by your database rules (RLS),
// so non-admins can't see anything their account isn't already allowed to read.

type Match = { id: string; mode: string; participants: string[] | null; winners: string[] | null; map: string | null; created_at: string; replay_url: string | null };
type Profile = { username: string; created_at: string; banned: boolean | null };
type AuditRow = Record<string, unknown> & { action?: string; created_at?: string };

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const PAGE = 1000;
const DAY = 86400000;
const WEEKS = 12;
const LOSS = "#F87171";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CSS = `
@keyframes czad-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes czad-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes czad-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.czad-bar { transform-origin: bottom; transform-box: fill-box; animation: czad-grow 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czad-in { animation: czad-in 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czad-line { stroke-dasharray: 1; animation: czad-draw 1.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
.czad-hbar { transform-origin: left; animation: czad-hgrow 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes czad-hgrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) { .czad-bar, .czad-in, .czad-line, .czad-hbar { animation: none !important; } .czad-line { stroke-dasharray: none; } }
`;

function weekStart(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (x.getUTCDay() + 6) % 7; // Monday = 0
  return x.getTime() - dow * DAY;
}

async function fetchAll<T>(q: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await q(from, from + PAGE - 1);
    if (error) break;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    let raf = 0;
    const start = performance.now();
    setShown(0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown.toLocaleString("en")}{suffix}</>;
}

function Panel({ title, icon: Icon, children, right, className = "", delay = 0 }: { title: string; icon: typeof Users; children: ReactNode; right?: ReactNode; className?: string; delay?: number }) {
  return (
    <section className={`czad-in border p-5 ${className}`} style={{ background: C.panel, borderColor: C.line, animationDelay: `${delay}s` }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
          <Icon size={14} style={{ color: C.amber }} aria-hidden="true" />
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Delta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0 && now === 0) return <span style={{ color: C.muted }}>—</span>;
  const pct = prev === 0 ? 100 : Math.round(((now - prev) / prev) * 100);
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: up ? C.radar : LOSS }}>
      <Icon size={13} aria-hidden="true" />
      {up ? "+" : ""}
      {pct}% vs last week
    </span>
  );
}

function WeekBars({ weeks, series }: { weeks: number[]; series: { label: string; color: string; values: number[] }[] }) {
  const W = 640, H = 200, PAD = 28;
  const totals = weeks.map((_, i) => series.reduce((s, x) => s + x.values[i], 0));
  const max = Math.max(1, ...totals);
  const bw = (W - PAD * 2) / weeks.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="block w-full" role="img" aria-label="Matches per week">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={PAD} x2={W - PAD} y1={H - (H - 10) * f} y2={H - (H - 10) * f} stroke={C.line} strokeDasharray="3 5" />
            <text x={PAD - 6} y={H - (H - 10) * f + 4} textAnchor="end" fontSize="10" fill={C.muted}>{Math.round(max * f)}</text>
          </g>
        ))}
        {weeks.map((w, i) => {
          let y = H;
          return (
            <g key={w}>
              <title>{`Week of ${new Date(w).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${series.map((s) => `${s.values[i]} ${s.label}`).join(", ")}`}</title>
              {series.map((s) => {
                const h = ((H - 10) * s.values[i]) / max;
                y -= h;
                return <rect key={s.label} className="czad-bar" style={{ animationDelay: `${i * 0.04}s` }} x={PAD + i * bw + bw * 0.18} y={y} width={bw * 0.64} height={Math.max(0, h)} fill={s.color} />;
              })}
              <text x={PAD + i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="10" fill={C.muted}>
                {new Date(w).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-xs" style={{ color: C.muted }}>
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5" style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
    </div>
  );
}

function WeekLine({ weeks, values, color, label }: { weeks: number[]; values: number[]; color: string; label: string }) {
  const W = 640, H = 160, PAD = 28;
  const max = Math.max(1, ...values);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, weeks.length - 1);
  const y = (v: number) => H - 8 - ((H - 20) * v) / max;
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="block w-full" role="img" aria-label={label}>
      <path d={`${d} L${x(values.length - 1)},${H - 8} L${x(0)},${H - 8} Z`} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" pathLength={1} className="czad-line" />
      {values.map((v, i) => (
        <g key={i}>
          <title>{`${new Date(weeks[i]).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${v}`}</title>
          <circle cx={x(i)} cy={y(v)} r="4" fill={C.void} stroke={color} strokeWidth="2" />
        </g>
      ))}
      <text x={x(values.length - 1)} y={y(values[values.length - 1]) - 10} textAnchor="end" fontSize="12" fontWeight="700" fill={color}>{values[values.length - 1]}</text>
      {weeks.map((w, i) => (i % 2 === 0 ? <text key={w} x={x(i)} y={H + 14} textAnchor="middle" fontSize="10" fill={C.muted}>{new Date(w).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</text> : null))}
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [chat7, setChat7] = useState<number | null>(null);
  const [reports, setReports] = useState<number | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      setState("loading");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return !cancelled && setState("denied");
      const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      if (!me?.is_admin) return !cancelled && setState("denied");

      const since7 = new Date(Date.now() - 7 * DAY).toISOString();
      const [m, p, chat, rep, log] = await Promise.all([
        fetchAll<Match>((a, b) => supabase.from("matches").select("id, mode, participants, winners, map, created_at, replay_url").order("created_at", { ascending: false }).range(a, b)),
        fetchAll<Profile>((a, b) => supabase.from("profiles").select("username, created_at, banned").range(a, b)),
        supabase.from("messages").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("match_reports").select("*", { count: "exact", head: true }),
        supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      if (cancelled) return;
      setMatches(m);
      setProfiles(p);
      setChat7(chat.error ? null : chat.count ?? 0);
      setReports(rep.error ? null : rep.count ?? 0);
      setAudit(log.error ? [] : ((log.data ?? []) as AuditRow[]));
      setLoadedAt(new Date());
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const s = useMemo(() => {
    const now = Date.now();
    const thisWeek = weekStart(new Date());
    const weeks = Array.from({ length: WEEKS }, (_, i) => thisWeek - (WEEKS - 1 - i) * 7 * DAY);
    const idx = (iso: string) => weeks.indexOf(weekStart(new Date(iso)));

    const team = Array(WEEKS).fill(0), ffa = Array(WEEKS).fill(0);
    const activeSets: Set<string>[] = weeks.map(() => new Set());
    const signups = Array(WEEKS).fill(0);
    const heat: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const modeCount: Record<string, number> = {};
    const mapCount: Record<string, number> = {};
    const playerCount: Record<string, number> = {};
    let replays30 = 0, matches30 = 0;

    for (const m of matches) {
      const t = new Date(m.created_at);
      const i = idx(m.created_at);
      if (i >= 0) {
        (m.mode === "ffa" ? ffa : team)[i]++;
        for (const p of m.participants ?? []) activeSets[i].add(p);
      }
      modeCount[m.mode] = (modeCount[m.mode] ?? 0) + 1;
      const age = now - t.getTime();
      if (age <= 90 * DAY) {
        heat[(t.getDay() + 6) % 7][t.getHours()]++;
        if (m.map) mapCount[m.map] = (mapCount[m.map] ?? 0) + 1;
      }
      if (age <= 30 * DAY) {
        matches30++;
        if (m.replay_url) replays30++;
        for (const p of m.participants ?? []) playerCount[p] = (playerCount[p] ?? 0) + 1;
      }
    }
    for (const p of profiles) {
      const i = idx(p.created_at);
      if (i >= 0) signups[i]++;
    }
    const active = activeSets.map((x) => x.size);
    const matchesWeek = team.map((v, i) => v + ffa[i]);
    const new7 = profiles.filter((p) => now - new Date(p.created_at).getTime() <= 7 * DAY).length;
    const heatMax = Math.max(1, ...heat.flat());
    const busiest = (() => {
      let best = { d: 0, h: 0, v: -1 };
      heat.forEach((row, d) => row.forEach((v, h) => { if (v > best.v) best = { d, h, v }; }));
      return best.v > 0 ? best : null;
    })();

    return {
      weeks, team, ffa, active, signups, matchesWeek, heat, heatMax, busiest,
      members: profiles.filter((p) => !p.banned).length,
      banned: profiles.filter((p) => p.banned).length,
      new7,
      replayPct: matches30 ? Math.round((replays30 / matches30) * 100) : 0,
      modes: Object.entries(modeCount).sort((a, b) => b[1] - a[1]),
      maps: Object.entries(mapCount).sort((a, b) => b[1] - a[1]).slice(0, 8),
      players: Object.entries(playerCount).sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [matches, profiles]);

  if (state === "loading") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center" style={{ background: C.void }}>
        <TankSpinner label="Loading command center..." />
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6" style={{ background: C.void, color: C.paper }}>
        <div className="max-w-md border p-8 text-center" style={{ borderColor: "rgba(248,113,113,0.45)", background: C.panel }}>
          <ShieldAlert size={36} className="mx-auto" style={{ color: LOSS }} aria-hidden="true" />
          <h1 className="cz-display mt-4 text-3xl uppercase" style={{ fontWeight: 700 }}>Admins only</h1>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>Log in with an admin account to open the command center.</p>
          <Link href="/login" className="mt-6 inline-flex min-h-[48px] items-center px-6 text-sm uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>Log in</Link>
        </div>
      </main>
    );
  }

  const last = WEEKS - 1;
  const kpis = [
    { icon: Users, label: "Members", value: s.members, sub: <span className="text-xs" style={{ color: C.radar }}>+{s.new7} this week{s.banned ? ` · ${s.banned} banned` : ""}</span> },
    { icon: Swords, label: "Matches this week", value: s.matchesWeek[last], sub: <Delta now={s.matchesWeek[last]} prev={s.matchesWeek[last - 1]} /> },
    { icon: Activity, label: "Active players (week)", value: s.active[last], sub: <Delta now={s.active[last]} prev={s.active[last - 1]} /> },
    { icon: Disc3, label: "Replay coverage (30d)", value: s.replayPct, suffix: "%", sub: <span className="text-xs" style={{ color: C.muted }}>of matches have a replay</span> },
    { icon: MessageSquare, label: "Chat messages (7d)", value: chat7 ?? 0, sub: chat7 === null ? <span className="text-xs" style={{ color: C.muted }}>not readable</span> : null },
    { icon: Flag, label: "Match reports", value: reports ?? 0, sub: reports === null ? <span className="text-xs" style={{ color: C.muted }}>not readable</span> : <Link href="/admin" className="text-xs underline-offset-2 hover:underline" style={{ color: C.amber }}>Review in admin</Link> },
  ];

  const actor = (r: AuditRow) => {
    for (const k of ["admin_username", "admin", "actor", "username", "performed_by"]) if (typeof r[k] === "string") return r[k] as string;
    return "";
  };

  return (
    <main className="min-h-screen w-full pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{CSS}</style>
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} flex flex-wrap items-end justify-between gap-4 pb-8 pt-12`}>
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <LayoutDashboard size={14} aria-hidden="true" />
              Admin
            </div>
            <h1 className="cz-display mt-2 text-5xl uppercase leading-none" style={{ fontWeight: 700 }}>Command center</h1>
            {loadedAt && <p className="mt-2 text-xs" style={{ color: C.muted }}>Updated {loadedAt.toLocaleTimeString()}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setReloadKey((k) => k + 1)} className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper }}>
              <RefreshCw size={14} aria-hidden="true" /> Refresh
            </button>
            {[["/admin", "Admin tools"], ["/admin/deleted-matches", "Deleted matches"], ["/admin/audit-log", "Audit log"]].map(([href, label]) => (
              <Link key={href} href={href} className="inline-flex min-h-[44px] items-center gap-1.5 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.muted }}>
                {label}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className={`${WRAP} mt-8`}>
        <div className="grid grid-cols-2 gap-px border md:grid-cols-3 xl:grid-cols-6" style={{ background: C.line, borderColor: C.line }}>
          {kpis.map((k, i) => (
            <div key={k.label} className="czad-in px-5 py-5" style={{ background: C.panel, animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
                <k.icon size={13} aria-hidden="true" />
                {k.label}
              </div>
              <div className="cz-display mt-2 text-4xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>
                <CountUp value={k.value} suffix={k.suffix} />
              </div>
              <div className="mt-2 min-h-[18px]">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Matches per week" icon={Swords} delay={0.1}>
            <WeekBars weeks={s.weeks} series={[{ label: "Team", color: C.amber, values: s.team }, { label: "FFA", color: C.radar, values: s.ffa }]} />
          </Panel>
          <Panel title="Active players per week" icon={Activity} delay={0.15}>
            <WeekLine weeks={s.weeks} values={s.active} color={C.radar} label="Active players per week" />
            <div className="mt-6 mb-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>New members per week</div>
            <WeekLine weeks={s.weeks} values={s.signups} color={C.amber} label="New members per week" />
          </Panel>
        </div>

        <Panel
          title="When players are active (last 90 days, your local time)"
          icon={Clock}
          className="mt-6"
          delay={0.2}
          right={s.busiest ? <span className="text-xs" style={{ color: C.amber }}>Busiest: {DAYS[s.busiest.d]} {String(s.busiest.h).padStart(2, "0")}:00</span> : null}
        >
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid gap-[3px]" style={{ gridTemplateColumns: "40px repeat(24, 1fr)" }}>
                <span />
                {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center text-[10px]" style={{ color: C.muted }}>{h % 3 === 0 ? h : ""}</span>)}
                {s.heat.map((row, d) => (
                  <div key={d} className="contents">
                    <span className="text-[11px]" style={{ color: C.muted }}>{DAYS[d]}</span>
                    {row.map((v, h) => (
                      <span key={h} title={`${DAYS[d]} ${String(h).padStart(2, "0")}:00 — ${v} matches`} className="aspect-square transition-transform hover:scale-125" style={{ background: v ? `rgba(232,166,61,${0.12 + (0.88 * v) / s.heatMax})` : C.void, border: `1px solid ${C.line}` }} />
                    ))}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs" style={{ color: C.muted }}>Tip: schedule tournaments and announcements around the brightest squares.</p>
            </div>
          </div>
        </Panel>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel title="Game modes (all time)" icon={Swords} delay={0.25}>
            <ul className="flex flex-col gap-3">
              {s.modes.map(([mode, n], i) => {
                const total = s.modes.reduce((a, [, v]) => a + v, 0);
                return (
                  <li key={mode}>
                    <div className="flex justify-between text-sm"><span className="uppercase tracking-widest">{mode}</span><span className="tabular-nums" style={{ color: C.muted }}>{n} · {Math.round((n / total) * 100)}%</span></div>
                    <div className="mt-1 h-1.5" style={{ background: C.line }}><div className="czad-hbar h-full" style={{ width: `${(n / s.modes[0][1]) * 100}%`, background: i ? C.amberDim : C.amber, animationDelay: `${i * 0.08}s` }} /></div>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title="Top maps (90 days)" icon={MapIcon} delay={0.3}>
            {s.maps.length === 0 ? <p className="text-sm" style={{ color: C.muted }}>No maps recorded yet.</p> : (
              <ul className="flex flex-col gap-3">
                {s.maps.map(([name, n], i) => (
                  <li key={name}>
                    <div className="flex justify-between gap-2 text-sm"><span className="truncate">{name}</span><span className="tabular-nums" style={{ color: C.muted }}>{n}</span></div>
                    <div className="mt-1 h-1.5" style={{ background: C.line }}><div className="czad-hbar h-full" style={{ width: `${(n / s.maps[0][1]) * 100}%`, background: C.radar, animationDelay: `${i * 0.06}s` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Most active players (30 days)" icon={Users} delay={0.35}>
            {s.players.length === 0 ? <p className="text-sm" style={{ color: C.muted }}>No matches in the last 30 days.</p> : (
              <ol className="flex flex-col gap-2">
                {s.players.map(([name, n], i) => (
                  <li key={name} className="flex items-center gap-3 text-sm">
                    <span className="cz-display w-6 text-lg tabular-nums" style={{ color: i < 3 ? C.amber : C.muted, fontWeight: 700 }}>{i + 1}</span>
                    <Link href={`/profile/${name}`} className="min-w-0 flex-1 truncate hover:underline">{name}</Link>
                    <span className="tabular-nums" style={{ color: C.muted }}>{n} matches</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <Panel title="Latest admin actions" icon={ScrollText} className="mt-6" delay={0.4} right={<Link href="/admin/audit-log" className="text-xs uppercase tracking-widest" style={{ color: C.amber }}>Full log</Link>}>
          {audit.length === 0 ? <p className="text-sm" style={{ color: C.muted }}>No entries, or the audit log isn't readable with this account.</p> : (
            <ul className="flex flex-col gap-px" style={{ background: C.line }}>
              {audit.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 text-sm" style={{ background: C.panel }}>
                  <span className="border px-2 py-0.5 text-[11px] uppercase tracking-widest" style={{ borderColor: String(r.action ?? "").includes("delete") || String(r.action ?? "").includes("ban") ? "rgba(248,113,113,0.5)" : C.amberDim, color: String(r.action ?? "").includes("delete") || String(r.action ?? "").includes("ban") ? LOSS : C.amber }}>
                    {String(r.action ?? "action").replace(/_/g, " ")}
                  </span>
                  {actor(r) && <span style={{ color: C.paper }}>{actor(r)}</span>}
                  <span className="ms-auto text-xs" style={{ color: C.muted }}>{r.created_at ? new Date(String(r.created_at)).toLocaleString() : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </main>
  );
}
