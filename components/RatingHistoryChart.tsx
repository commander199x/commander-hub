"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";

type MatchRow = {
  mode: string;
  created_at: string;
  rating_changes: Record<string, number> | null;
};

type Point = { rating: number; delta: number; date: string; label: string };

const START_RATING = 1000;
const W = 640;
const H = 240;
const PAD = { l: 46, r: 18, t: 18, b: 30 };

// Replays the player's matches in order, adding up each match's rating
// change, to get their rating after every game.
function buildSeries(rows: MatchRow[], username: string, view: "team" | "ffa"): Point[] {
  const points: Point[] = [{ rating: START_RATING, delta: 0, date: "", label: "Start" }];
  let rating = START_RATING;

  for (const m of rows) {
    const isFfa = m.mode === "ffa";
    if ((view === "ffa") !== isFfa) continue;

    const delta = m.rating_changes?.[username];
    if (typeof delta !== "number") continue;

    rating += delta;
    points.push({ rating, delta, date: m.created_at, label: `Match ${points.length}` });
  }
  return points;
}

export default function RatingHistoryChart({ username }: { username: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<MatchRow[] | null>(null);
  const [view, setView] = useState<"team" | "ffa">("team");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setHover(null);

    async function load() {
      const { data } = await supabase
        .from("matches")
        .select("mode, created_at, rating_changes")
        .contains("participants", [username])
        .order("created_at", { ascending: true });
      if (!cancelled) setRows((data ?? []) as MatchRow[]);
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [supabase, username]);

  const team = useMemo(() => (rows ? buildSeries(rows, username, "team") : []), [rows, username]);
  const ffa = useMemo(() => (rows ? buildSeries(rows, username, "ffa") : []), [rows, username]);

  // If they've only played FFA, open on the FFA tab.
  useEffect(() => {
    if (rows && team.length <= 1 && ffa.length > 1) setView("ffa");
  }, [rows, team.length, ffa.length]);

  const series = view === "team" ? team : ffa;
  const n = series.length;

  const sectionStyle = {
    background: C.panel,
    border: `1px solid ${C.line}`,
    padding: "1.1rem 1.25rem",
    marginTop: "1.5rem",
  } as const;

  const tabButton = (active: boolean) =>
    ({
      background: active ? C.amber : "none",
      color: active ? C.void : C.muted,
      border: `1px solid ${C.amber}`,
      padding: "0.2rem 0.7rem",
      fontSize: "0.7rem",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: active ? 700 : 400,
    }) as const;

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
      <h3 className="cz-display uppercase" style={{ fontSize: "1.05rem", fontWeight: 600, color: C.paper }}>
        Rating history
      </h3>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <button type="button" style={tabButton(view === "team")} onClick={() => { setView("team"); setHover(null); }}>
          Team
        </button>
        <button type="button" style={tabButton(view === "ffa")} onClick={() => { setView("ffa"); setHover(null); }}>
          FFA
        </button>
      </div>
    </div>
  );

  if (rows === null) {
    return (
      <section style={sectionStyle}>
        {header}
        <div style={{ height: 160, opacity: 0.4, color: C.muted, fontSize: "0.8rem" }}>Loading…</div>
      </section>
    );
  }

  if (n <= 1) {
    return (
      <section style={sectionStyle}>
        {header}
        <p style={{ color: C.muted, fontSize: "0.82rem", padding: "1.2rem 0" }}>
          No {view === "team" ? "team" : "FFA"} matches with rating data yet. Once this player has played, their
          rating over time will show up here.
        </p>
      </section>
    );
  }

  const ratings = series.map((p) => p.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const pad = Math.max(10, (max - min) * 0.15);
  const lo = min - pad;
  const hi = max + pad;

  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (i * plotW) / (n - 1);
  const y = (r: number) => PAD.t + ((hi - r) / (hi - lo)) * plotH;

  const linePath = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.rating).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)} ${(H - PAD.b).toFixed(1)} L${x(0).toFixed(1)} ${(H - PAD.b).toFixed(1)} Z`;

  const ticks = [0, 1, 2, 3].map((k) => Math.round(lo + ((hi - lo) * k) / 3));

  const current = ratings[n - 1];
  const net = current - START_RATING;
  const firstDate = series.find((p) => p.date)?.date;
  const lastDate = series[n - 1].date;

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((relX - PAD.l) / plotW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  }

  const hovered = hover !== null ? series[hover] : null;

  return (
    <section style={sectionStyle}>
      {header}

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        {[
          { label: "Current", value: String(current), color: C.amber },
          { label: "Peak", value: String(max), color: C.paper },
          { label: "Lowest", value: String(min), color: C.paper },
          {
            label: "Net change",
            value: `${net >= 0 ? "+" : ""}${net}`,
            color: net >= 0 ? "#22c55e" : "#ef4444",
          },
        ].map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted }}>
              {stat.label}
            </div>
            <div className="cz-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Rating history chart, current rating ${current}`}
        style={{ width: "100%", height: "auto", display: "block", touchAction: "pan-y" }}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rh-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.amber} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.amber} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={C.line} strokeWidth="1" />
            <text x={PAD.l - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill={C.muted}>
              {t}
            </text>
          </g>
        ))}

        {START_RATING > lo && START_RATING < hi && (
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(START_RATING)}
            y2={y(START_RATING)}
            stroke={C.muted}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
        )}

        <path d={areaPath} fill="url(#rh-area)" />
        <path d={linePath} fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {series.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.rating)}
            r={i === n - 1 || i === hover ? 4.5 : n > 40 ? 0 : 2.5}
            fill={i === hover ? C.paper : C.amber}
          />
        ))}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke={C.paper} strokeWidth="1" opacity="0.35" />
        )}

        {firstDate && (
          <text x={PAD.l} y={H - 8} fontSize="10" fill={C.muted}>
            {new Date(firstDate).toLocaleDateString()}
          </text>
        )}
        {lastDate && n > 2 && (
          <text x={W - PAD.r} y={H - 8} fontSize="10" fill={C.muted} textAnchor="end">
            {new Date(lastDate).toLocaleDateString()}
          </text>
        )}
      </svg>

      <p style={{ fontSize: "0.75rem", color: hovered ? C.paper : C.muted, marginTop: "0.5rem", minHeight: "1.1rem" }}>
        {hovered
          ? `${hovered.label}${hovered.date ? ` · ${new Date(hovered.date).toLocaleDateString()}` : ""} · ${hovered.rating}${
              hovered.delta ? ` (${hovered.delta > 0 ? "+" : ""}${hovered.delta})` : ""
            }`
          : "Hover or tap the chart to see a specific match."}
      </p>
    </section>
  );
}
