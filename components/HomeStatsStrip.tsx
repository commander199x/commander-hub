"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Stats = { members: number; matches: number; replays: number; activeWeek: number };

// Text lives here so this works in both languages with no translations.ts edits.
const TEXT = {
  en: {
    members: "Members",
    matches: "Matches played",
    replays: "Replays shared",
    active: "Active this week",
  },
  ar: {
    members: "الأعضاء",
    matches: "المباريات",
    replays: "الإعادات",
    active: "نشطون هذا الأسبوع",
  },
} as const;

// Counts up from 0 to the target (skipped for people who prefer reduced motion).
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function StatCard({ value, label }: { value: number; label: string }) {
  const shown = useCountUp(value);
  return (
    <div
      className="cz-card"
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        padding: "1rem 1.1rem",
        textAlign: "center",
      }}
    >
      <div
        className="cz-display"
        style={{ fontSize: "1.9rem", fontWeight: 700, color: C.amber, lineHeight: 1.1 }}
      >
        {shown.toLocaleString("en")}
      </div>
      <div
        style={{
          marginTop: "0.35rem",
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: C.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function HomeStatsStrip() {
  const supabase = createClient();
  const { locale } = useLanguage();
  const text = TEXT[locale === "ar" ? "ar" : "en"];
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [membersRes, matchesRes, replaysRes, recentRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).or("banned.is.null,banned.eq.false"),
        supabase.from("matches").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }).not("replay_url", "is", null),
        supabase.from("matches").select("participants").gte("created_at", weekAgo),
      ]);

      const activePlayers = new Set<string>();
      for (const row of (recentRes.data ?? []) as { participants: string[] }[]) {
        for (const name of row.participants) activePlayers.add(name);
      }

      if (!cancelled) {
        setStats({
          members: membersRes.count ?? 0,
          matches: matchesRes.count ?? 0,
          replays: replaysRes.count ?? 0,
          activeWeek: activePlayers.size,
        });
      }
    }

    load().catch(() => {
      if (!cancelled) setStats({ members: 0, matches: 0, replays: 0, activeWeek: 0 });
    });

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Reserve the space while loading so the page doesn't jump.
  if (stats === null) {
    return <div aria-hidden style={{ minHeight: 96, marginTop: "2rem" }} />;
  }

  // Only show a stat once it has something worth showing — a "0" card
  // looks worse than no card.
  const items = [
    { key: "members", value: stats.members, label: text.members },
    { key: "matches", value: stats.matches, label: text.matches },
    { key: "replays", value: stats.replays, label: text.replays },
    { key: "active", value: stats.activeWeek, label: text.active },
  ].filter((item) => item.value > 0);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "1rem",
        marginTop: "2rem",
      }}
    >
      {items.map((item) => (
        <StatCard key={item.key} value={item.value} label={item.label} />
      ))}
    </div>
  );
}
