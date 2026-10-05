"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, Swords, ListChecks, Calculator, Users, UserCog, AlertTriangle, LayoutDashboard, Trash2, ScrollText,
  Search, Ban, Undo2, MessageSquareX, Minus, Plus, ArrowUpRight, Crown, Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MatchForm from "@/components/MatchForm";
import RecentMatchesAdmin from "@/components/RecentMatchesAdmin";
import RecalculateRatings from "@/components/RecalculateRatings";
import ResetSeasonRatings from "@/components/ResetSeasonRatings";
import MergeGuestIntoAccount from "@/components/MergeGuestIntoAccount";
import MergeDuplicateAccounts from "@/components/MergeDuplicateAccounts";
import TankSpinner from "@/components/TankSpinner";
import { logAdminAction } from "@/lib/auditLog";
import { useFeedback } from "@/components/FeedbackProvider";
import { C } from "@/lib/theme";
import "@/app/admin.css";

interface Profile {
  id: string;
  username: string;
  banned: boolean;
  is_admin: boolean;
  is_team: boolean;
  is_owner: boolean;
  wins: number;
  losses: number;
  avatar_url?: string | null;
}

type Filter = "all" | "team" | "staff" | "banned";

const WRAP = "mx-auto max-w-[1440px] px-6 md:px-10";
const LOSS = "#F87171";
const DANGER = "#DC2626";
const PAGE_STEP = 40;

const SECTIONS = [
  { id: "log", label: "Log a match", icon: Swords },
  { id: "matches", label: "Recent matches", icon: ListChecks },
  { id: "ratings", label: "Ratings", icon: Calculator },
  { id: "accounts", label: "Accounts", icon: UserCog },
  { id: "members", label: "Members", icon: Users },
  { id: "danger", label: "Danger zone", icon: AlertTriangle },
] as const;

const CSS = `
@keyframes czam-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.czam-in { animation: czam-in 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
/* The existing admin tools keep working inside the new panels: neutralise the old page wrapper only */
.czam-host.admin-panel { max-width: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; }
/* ---- Skin for the existing admin tools: the site's look for their inputs, buttons, tables and headings ---- */
.czam-host { color: #EDEAE0; font-size: 14px; }
.czam-host h1, .czam-host h2, .czam-host h3, .czam-host h4 { font-family: var(--font-display), Oswald, Impact, sans-serif; text-transform: uppercase; letter-spacing: 0.02em; color: #EDEAE0; font-weight: 700; line-height: 1.1; margin: 0 0 12px; }
.czam-host h1 { font-size: 22px; } .czam-host h2 { font-size: 20px; } .czam-host h3, .czam-host h4 { font-size: 17px; }
.czam-host p { color: #83866F; line-height: 1.6; }
.czam-host a { color: #E8A63D; }
.czam-host label { color: #83866F; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; }
.czam-host input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]), .czam-host select, .czam-host textarea {
  min-height: 44px; max-width: 100%; background: #0A0C08; color: #EDEAE0; border: 1px solid #8A6425; border-radius: 0; padding: 0 12px; font: inherit; font-size: 14px; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
.czam-host textarea { padding: 10px 12px; min-height: 90px; }
.czam-host input:focus, .czam-host select:focus, .czam-host textarea:focus { border-color: #E8A63D; box-shadow: 0 0 0 3px rgba(232,166,61,0.15); }
.czam-host input[type="checkbox"], .czam-host input[type="radio"] { accent-color: #E8A63D; width: 16px; height: 16px; }
.czam-host input[type="file"] { color: #83866F; font-size: 13px; }
.czam-host input[type="file"]::file-selector-button { min-height: 40px; margin-inline-end: 12px; padding: 0 14px; border: 1px solid #8A6425; background: transparent; color: #E8A63D; font: inherit; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; cursor: pointer; }
.czam-host button { min-height: 40px; padding: 0 16px; border: 1px solid #8A6425; border-radius: 0; background: transparent; color: #EDEAE0; font: inherit; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: background-color 0.2s ease, border-color 0.2s ease, filter 0.2s ease; }
.czam-host button:hover:not(:disabled) { background: #171B10; border-color: #E8A63D; }
.czam-host button[type="submit"] { background: #E8A63D; border-color: #E8A63D; color: #0A0C08; font-weight: 700; }
.czam-host button[type="submit"]:hover:not(:disabled) { background: #E8A63D; filter: brightness(1.08); }
.czam-host button:disabled { opacity: 0.45; cursor: not-allowed; }
/* destructive buttons stay red */
.czam-host button[class*="delete"], .czam-host button[class*="ban"], .czam-host button[class*="danger"], .czam-host button[class*="reset"], .czam-host button[class*="remove"], .czam-danger button {
  border-color: rgba(248,113,113,0.6); color: #F87171; background: transparent; }
.czam-host button[class*="delete"]:hover:not(:disabled), .czam-host button[class*="ban"]:hover:not(:disabled), .czam-host button[class*="danger"]:hover:not(:disabled), .czam-host button[class*="reset"]:hover:not(:disabled), .czam-host button[class*="remove"]:hover:not(:disabled), .czam-danger button:hover:not(:disabled) {
  background: #DC2626; border-color: #DC2626; color: #fff; }
.czam-host table { width: 100%; border-collapse: collapse; font-size: 14px; }
.czam-host th { text-align: start; font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #83866F; padding: 10px 12px; border-bottom: 1px solid #3A4029; }
.czam-host td { padding: 10px 12px; border-bottom: 1px solid #272B1E; vertical-align: middle; }
.czam-host tr:hover td { background: #171B10; }
.czam-host hr { border: 0; border-top: 1px solid #272B1E; margin: 16px 0; }
.czam-host [class*="error"] { color: #F87171; }
.czam-host [class*="success"] { color: #8FBF4F; }
.czam-host img { border-radius: 9999px; }
.czam-row { transition: background-color 0.2s ease; }
.czam-row:hover { background-color: #171B10 !important; }
@media (prefers-reduced-motion: reduce) { .czam-in { animation: none !important; } .czam-row { transition: none !important; } }
`;

function Section({ id, icon: Icon, title, desc, children, danger, delay = 0 }: { id: string; icon: typeof Swords; title: string; desc?: string; children: ReactNode; danger?: boolean; delay?: number }) {
  return (
    <section
      id={id}
      className="czam-in scroll-mt-[calc(var(--cz-header-h,64px)+24px)] border"
      style={{ background: danger ? "linear-gradient(160deg, rgba(220,38,38,0.08), #12150E 55%)" : C.panel, borderColor: danger ? "rgba(220,38,38,0.5)" : C.line, animationDelay: `${delay}s` }}
    >
      <header className="flex flex-wrap items-center gap-3 border-b px-5 py-4 md:px-6" style={{ borderColor: danger ? "rgba(220,38,38,0.35)" : C.line }}>
        <span className="inline-flex h-10 w-10 items-center justify-center" style={{ border: `1px solid ${danger ? "rgba(220,38,38,0.6)" : C.amberDim}`, color: danger ? LOSS : C.amber }}>
          <Icon size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="cz-display text-2xl uppercase leading-none" style={{ fontWeight: 700, color: danger ? LOSS : C.paper }}>{title}</h2>
          {desc && <p className="mt-1 text-sm" style={{ color: C.muted }}>{desc}</p>}
        </div>
      </header>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function Stepper({ label, value, color, onMinus, onPlus, name }: { label: string; value: number; color: string; onMinus: () => void; onPlus: () => void; name: string }) {
  return (
    <div className="inline-flex items-center border" style={{ borderColor: C.lineStrong }}>
      <span className="px-2 text-[11px] uppercase tracking-widest" style={{ color: C.muted }}>{label}</span>
      <button onClick={onMinus} aria-label={`Remove one ${label === "W" ? "win" : "loss"} from ${name}`} className="inline-flex h-9 w-9 items-center justify-center border-s transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.muted }}>
        <Minus size={14} aria-hidden="true" />
      </button>
      <span className="min-w-[38px] text-center text-sm tabular-nums" style={{ color, fontWeight: 700 }}>{value}</span>
      <button onClick={onPlus} aria-label={`Add one ${label === "W" ? "win" : "loss"} to ${name}`} className="inline-flex h-9 w-9 items-center justify-center border-s transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.amber }}>
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const fb = useFeedback();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [adminUsername, setAdminUsername] = useState<string>("unknown");
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE_STEP);
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAccessAndLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("is_admin, username")
        .eq("id", user.id)
        .single();

      if (!myProfile?.is_admin) {
        router.push("/");
        return;
      }

      setAuthorized(true);
      setAdminUsername(myProfile.username ?? "unknown");

      const { data: allUsers } = await supabase
        .from("profiles")
        .select("id, username, banned, is_admin, is_team, is_owner, wins, losses, avatar_url")
        .order("username", { ascending: true });

      setUsers(allUsers ?? []);
      setLoading(false);
    }

    checkAccessAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight the section you're looking at in the side menu
  useEffect(() => {
    if (loading || typeof IntersectionObserver === "undefined") return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  async function toggleBan(id: string, current: boolean) {
    const target = users.find((u) => u.id === id);

    // Banning is a big action, so ask first. (Unbanning doesn't need a prompt.)
    if (!current) {
      const ok = await fb.confirm({
        title: `Ban ${target?.username ?? "this user"}?`,
        message: "Their account will be marked as banned until you unban them.",
        confirmLabel: "Ban",
        danger: true,
      });
      if (!ok) return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ banned: !current })
      .eq("id", id);

    if (error) {
      fb.error(`Couldn't update the ban: ${error.message}`);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, banned: !current } : u))
    );
    await logAdminAction(supabase, adminUsername, !current ? "ban_user" : "unban_user", {
      target_username: target?.username,
    });
    fb.success(`${target?.username ?? "User"} ${!current ? "banned" : "unbanned"}.`);
  }

  async function deleteAllMessages(id: string, username: string) {
    const confirmed = await fb.confirm({
      title: `Delete all messages from ${username}?`,
      message: "Every chat message they've posted will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete messages",
      danger: true,
    });
    if (!confirmed) return;

    const { error } = await supabase.from("messages").delete().eq("user_id", id);
    if (error) {
      fb.error(`Couldn't delete the messages: ${error.message}`);
      return;
    }

    await logAdminAction(supabase, adminUsername, "delete_all_messages", { target_username: username });
    fb.success(`Deleted all messages from ${username}.`);
  }

  async function toggleTeam(id: string, current: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_team: !current })
      .eq("id", id);

    if (error) {
      fb.error(`Couldn't update the team status: ${error.message}`);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_team: !current } : u))
    );
  }

  async function adjustWins(id: string, delta: number) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newWins = Math.max(0, user.wins + delta);

    const { error } = await supabase
      .from("profiles")
      .update({ wins: newWins })
      .eq("id", id);

    if (error) {
      fb.error(`Couldn't update wins: ${error.message}`);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, wins: newWins } : u))
    );
  }

  async function adjustLosses(id: string, delta: number) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newLosses = Math.max(0, user.losses + delta);

    const { error } = await supabase
      .from("profiles")
      .update({ losses: newLosses })
      .eq("id", id);

    if (error) {
      fb.error(`Couldn't update losses: ${error.message}`);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, losses: newLosses } : u))
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-12" style={{ background: C.void }}>
        <TankSpinner label="Loading admin panel..." />
      </main>
    );
  }

  if (!authorized) return null;

  const counts = {
    all: users.length,
    team: users.filter((u) => u.is_team).length,
    staff: users.filter((u) => u.is_admin || u.is_owner).length,
    banned: users.filter((u) => u.banned).length,
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "team" && u.is_team) ||
        (filter === "staff" && (u.is_admin || u.is_owner)) ||
        (filter === "banned" && u.banned))
  );

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen w-full pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{CSS}</style>

      {/* ================= HEADER ================= */}
      <header className="border-b" style={{ borderColor: C.line, background: "radial-gradient(ellipse 50% 120% at 90% 0%, rgba(232,166,61,0.10), transparent 60%)" }}>
        <div className={`${WRAP} flex flex-wrap items-end justify-between gap-4 pb-8 pt-12`}>
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <ShieldCheck size={14} aria-hidden="true" />
              Admin · signed in as <span style={{ color: C.paper }}>{adminUsername}</span>
            </div>
            <h1 className="cz-display mt-2 text-5xl uppercase leading-none md:text-6xl" style={{ fontWeight: 700 }}>
              Admin <span style={{ color: C.amber }}>tools</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/dashboard" className="inline-flex min-h-[44px] items-center gap-2 px-4 text-xs uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
              <LayoutDashboard size={15} aria-hidden="true" /> Command center
            </Link>
            <Link href="/admin/deleted-matches" className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper }}>
              <Trash2 size={15} aria-hidden="true" /> Deleted matches
            </Link>
            <Link href="/admin/audit-log" className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper }}>
              <ScrollText size={15} aria-hidden="true" /> Audit log
            </Link>
          </div>
        </div>
      </header>

      <div className={`${WRAP} mt-8 grid gap-8 lg:grid-cols-[230px_1fr]`}>
        {/* ================= SIDE MENU ================= */}
        <nav aria-label="Admin sections" className="lg:sticky lg:top-[calc(var(--cz-header-h,64px)+24px)] lg:self-start">
          {/* phones/tablets: scrollable chips */}
          <div className="sticky top-0 z-10 -mx-6 flex gap-2 overflow-x-auto px-6 py-2 lg:hidden" style={{ background: "rgba(10,12,8,0.94)", backdropFilter: "blur(6px)" }}>
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => jump(s.id)} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 border px-3 text-xs uppercase tracking-widest" style={{ borderColor: active === s.id ? C.amber : C.lineStrong, color: active === s.id ? C.amber : s.id === "danger" ? LOSS : C.paper, background: active === s.id ? "rgba(232,166,61,0.08)" : "transparent" }}>
                <s.icon size={14} aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </div>
          {/* desktop: vertical menu */}
          <ul className="hidden flex-col border lg:flex" style={{ borderColor: C.line, background: C.panel }}>
            {SECTIONS.map((s) => {
              const on = active === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => jump(s.id)}
                    aria-current={on ? "true" : undefined}
                    className="flex min-h-[48px] w-full items-center gap-3 px-4 text-start text-sm transition-colors hover:bg-[#171B10]"
                    style={{ borderInlineStart: `3px solid ${on ? (s.id === "danger" ? LOSS : C.amber) : "transparent"}`, color: on ? (s.id === "danger" ? LOSS : C.amber) : s.id === "danger" ? LOSS : C.paper, fontWeight: on ? 700 : 500, background: on ? "rgba(232,166,61,0.06)" : "transparent" }}
                  >
                    <s.icon size={16} aria-hidden="true" />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ================= CONTENT ================= */}
        <div ref={mainRef} className="flex min-w-0 flex-col gap-6">
          <Section id="log" icon={Swords} title="Log a match" desc="Record a result. Ratings update automatically.">
            <div className="czam-host admin-panel"><MatchForm allUsers={users.map((u) => ({ username: u.username }))} /></div>
          </Section>

          <Section id="matches" icon={ListChecks} title="Recent matches" desc="Edit, delete or restore recent results." delay={0.05}>
            <div className="czam-host admin-panel"><RecentMatchesAdmin adminUsername={adminUsername} /></div>
          </Section>

          <Section id="ratings" icon={Calculator} title="Ratings" desc="Rebuild every rating from the full match history." delay={0.1}>
            <div className="czam-host admin-panel"><RecalculateRatings adminUsername={adminUsername} /></div>
          </Section>

          <Section id="accounts" icon={UserCog} title="Accounts" desc="Merge a guest player into a real account, or join duplicate accounts." delay={0.15}>
            <div className="czam-host admin-panel flex flex-col gap-8">
              <MergeGuestIntoAccount adminUsername={adminUsername} />
              <MergeDuplicateAccounts adminUsername={adminUsername} />
            </div>
          </Section>

          {/* ================= MEMBERS ================= */}
          <Section id="members" icon={Users} title="Members" desc="Team roles, manual W/L corrections, chat cleanup and bans." delay={0.2}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="relative flex-[1_1_240px]">
                <span className="sr-only">Search username</span>
                <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
                <input
                  type="search"
                  placeholder="Search username..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShown(PAGE_STEP);
                  }}
                  className="min-h-[44px] w-full border border-[#8A6425] bg-[#0A0C08] pe-3 ps-9 text-sm text-[#EDEAE0] focus:border-[#E8A63D]"
                />
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter members">
                {(["all", "team", "staff", "banned"] as const).map((f) => {
                  const on = filter === f;
                  const isBan = f === "banned";
                  return (
                    <button
                      key={f}
                      aria-pressed={on}
                      onClick={() => {
                        setFilter(f);
                        setShown(PAGE_STEP);
                      }}
                      className="inline-flex min-h-[44px] items-center gap-2 border px-3 text-xs uppercase tracking-widest"
                      style={{ background: on ? (isBan ? DANGER : C.amber) : "transparent", color: on ? (isBan ? "#fff" : C.void) : isBan ? LOSS : C.paper, borderColor: on ? (isBan ? DANGER : C.amber) : isBan ? "rgba(248,113,113,0.5)" : C.amberDim, fontWeight: on ? 700 : 500 }}
                    >
                      {f}
                      <span className="tabular-nums" style={{ opacity: 0.7 }}>{counts[f]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
              {filtered.slice(0, shown).map((u) => (
                <div key={u.id} className="czam-row flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3" style={{ background: u.banned ? "rgba(220,38,38,0.06)" : C.panel }}>
                  <Link href={`/profile/${u.username}`} target="_blank" className="flex min-w-[200px] flex-1 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.avatar_url || "/default-avatar.svg"} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" style={{ border: `1px solid ${u.banned ? LOSS : C.lineStrong}`, opacity: u.banned ? 0.6 : 1 }} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] hover:underline" style={{ fontWeight: 600, textDecoration: u.banned ? "line-through" : "none" }}>{u.username}</span>
                        <ArrowUpRight size={12} style={{ color: C.muted }} aria-hidden="true" />
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {u.is_owner && <span className="inline-flex items-center gap-1 px-1.5 py-px text-[10px] uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}><Crown size={10} aria-hidden="true" />Owner</span>}
                        {u.is_admin && <span className="inline-flex items-center gap-1 border px-1.5 py-px text-[10px] uppercase tracking-widest" style={{ borderColor: C.amber, color: C.amber, fontWeight: 700 }}><ShieldCheck size={10} aria-hidden="true" />Admin</span>}
                        {u.is_team && <span className="inline-flex items-center gap-1 border px-1.5 py-px text-[10px] uppercase tracking-widest" style={{ borderColor: C.radar, color: C.radar, fontWeight: 700 }}><Star size={10} aria-hidden="true" />Team</span>}
                        {u.banned && <span className="inline-flex items-center gap-1 px-1.5 py-px text-[10px] uppercase tracking-widest" style={{ background: DANGER, color: "#fff", fontWeight: 700 }}><Ban size={10} aria-hidden="true" />Banned</span>}
                      </span>
                    </span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Stepper label="W" value={u.wins} color={C.radar} name={u.username} onMinus={() => adjustWins(u.id, -1)} onPlus={() => adjustWins(u.id, 1)} />
                    <Stepper label="L" value={u.losses} color={LOSS} name={u.username} onMinus={() => adjustLosses(u.id, -1)} onPlus={() => adjustLosses(u.id, 1)} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* team switch */}
                    <button
                      role="switch"
                      aria-checked={u.is_team}
                      onClick={() => toggleTeam(u.id, u.is_team)}
                      className="inline-flex min-h-[36px] items-center gap-2 border px-3 text-xs uppercase tracking-widest transition-colors"
                      style={{ borderColor: u.is_team ? C.radar : C.lineStrong, color: u.is_team ? C.radar : C.muted }}
                    >
                      <span className="relative inline-block h-4 w-7 rounded-full transition-colors" style={{ background: u.is_team ? "rgba(143,191,79,0.35)" : C.line }}>
                        <span className="absolute top-0.5 h-3 w-3 rounded-full transition-all" style={{ insetInlineStart: u.is_team ? 14 : 2, background: u.is_team ? C.radar : C.muted }} />
                      </span>
                      Team
                    </button>
                    <button
                      onClick={() => deleteAllMessages(u.id, u.username)}
                      title="Delete all chat messages"
                      aria-label={`Delete all chat messages from ${u.username}`}
                      className="inline-flex min-h-[36px] items-center gap-1.5 border px-3 text-xs uppercase tracking-widest transition-colors hover:bg-[rgba(220,38,38,0.12)]"
                      style={{ borderColor: "rgba(248,113,113,0.4)", color: LOSS }}
                    >
                      <MessageSquareX size={14} aria-hidden="true" />
                      Msgs
                    </button>
                    <button
                      onClick={() => toggleBan(u.id, u.banned)}
                      disabled={u.is_admin || u.is_owner}
                      title={u.is_admin || u.is_owner ? "Cannot ban an admin/owner" : undefined}
                      className="inline-flex min-h-[36px] min-w-[92px] items-center justify-center gap-1.5 px-3 text-xs uppercase tracking-widest transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                      style={u.banned ? { border: `1px solid ${C.radar}`, color: C.radar } : { background: DANGER, color: "#fff", fontWeight: 700 }}
                    >
                      {u.banned ? <Undo2 size={14} aria-hidden="true" /> : <Ban size={14} aria-hidden="true" />}
                      {u.banned ? "Unban" : "Ban"}
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <p className="px-4 py-10 text-center text-sm" style={{ background: C.panel, color: C.muted }}>No users found.</p>
              )}
            </div>

            {filtered.length > shown && (
              <div className="mt-4 flex justify-center">
                <button onClick={() => setShown((n) => n + PAGE_STEP)} className="inline-flex min-h-[44px] items-center gap-2 border px-6 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.amber }}>
                  Show more <span style={{ opacity: 0.7 }}>{filtered.length - shown}</span>
                </button>
              </div>
            )}
          </Section>

          {/* ================= DANGER ================= */}
          <Section id="danger" icon={AlertTriangle} title="Danger zone" desc="Season reset affects every player. A snapshot is saved to the audit log first." danger delay={0.25}>
            <div className="czam-host czam-danger admin-panel"><ResetSeasonRatings adminUsername={adminUsername} /></div>
          </Section>
        </div>
      </div>
    </main>
  );
}
