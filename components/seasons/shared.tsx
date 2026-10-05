"use client";

import Link from "next/link";
import { C } from "@/lib/theme";
import type { SeasonRow } from "@/lib/seasons";

export const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
export const PODIUM = [C.amber, "#C9CCC0", "#B87333"];

export const SEASON_CSS = `
@keyframes czse-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes czse-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes czse-pop { 0% { opacity: 0; transform: scale(0.5) translateY(10px); } 70% { transform: scale(1.08); } 100% { opacity: 1; transform: none; } }
@keyframes czse-live { 0% { box-shadow: 0 0 0 0 rgba(248,113,113,0.6); } 100% { box-shadow: 0 0 0 10px rgba(248,113,113,0); } }
@keyframes czse-rays { to { transform: rotate(360deg); } }
.czse-in { animation: czse-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czse-rise { transform-origin: bottom; animation: czse-rise 1s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czse-pop { animation: czse-pop 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czse-live { animation: czse-live 1.6s ease-out infinite; }
.czse-rays { animation: czse-rays 26s linear infinite; }
.czse-card { transition: transform 0.25s ease, border-color 0.25s ease; }
.czse-card:hover { transform: translateY(-5px); border-color: #8A6425 !important; }
@media (prefers-reduced-motion: reduce) { .czse-in, .czse-rise, .czse-pop, .czse-live, .czse-rays { animation: none !important; } .czse-card { transition: none !important; } .czse-card:hover { transform: none !important; } }
`;

export function LiveBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] uppercase tracking-widest" style={{ background: "#DC2626", color: "#fff", fontWeight: 700 }}>
      <span className="czse-live inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#fff" }} />
      {label}
    </span>
  );
}

export function Podium({ rows, avatars, delay = 0 }: { rows: SeasonRow[]; avatars: Record<string, string | null>; delay?: number }) {
  const order = [1, 0, 2].filter((i) => rows[i]);
  const heights = [150, 110, 84];
  return (
    <div className="flex items-end justify-center gap-3" dir="ltr">
      {order.map((i, k) => {
        const p = rows[i];
        return (
          <Link key={p.username} href={`/profile/${p.username}`} className="group flex w-1/3 max-w-[150px] flex-col items-center">
            <div className="czse-pop flex flex-col items-center" style={{ animationDelay: `${delay + 0.6 + k * 0.12}s` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatars[p.username] || "/default-avatar.svg"} alt="" className="rounded-full object-cover transition-transform group-hover:scale-105" style={{ width: i === 0 ? 68 : 54, height: i === 0 ? 68 : 54, border: `3px solid ${PODIUM[i]}`, boxShadow: i === 0 ? "0 0 24px rgba(232,166,61,0.45)" : "none" }} />
              <div className="mt-2 max-w-full truncate text-center text-sm group-hover:underline" style={{ fontWeight: 700 }}>{p.username}</div>
              <div className="cz-display text-xl tabular-nums leading-none" style={{ color: PODIUM[i], fontWeight: 700 }}>{p.rating}</div>
              <div className="mb-2 text-[11px] tabular-nums" style={{ color: C.muted }}>{p.wins}W · {p.losses}L</div>
            </div>
            <div className="czse-rise flex w-full justify-center pt-2" style={{ height: heights[i], animationDelay: `${delay + 0.15 + k * 0.1}s`, background: `linear-gradient(180deg, ${PODIUM[i]}33, ${PODIUM[i]}0d)`, borderTop: `3px solid ${PODIUM[i]}` }}>
              <span className="cz-display text-4xl" style={{ color: PODIUM[i], fontWeight: 700 }}>{i + 1}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
