"use client";

import { useMemo } from "react";
import { C } from "@/lib/theme";

export type RadarLeader = { name: string; rating: number };

type Props = {
  /** Unique per instance on a page (used for SVG ids). */
  uid: string;
  /** Top players, rank 1 first. Without them the radar is purely decorative. */
  leaders?: RadarLeader[];
  /** Hide from screen readers (use for background art). */
  decorative?: boolean;
};

const MONO = "var(--font-mono), ui-monospace, monospace";

// Fixed blip positions (in the 600x600 scope) for ranks 1, 2 and 3.
const LEADER_SPOTS = [
  { x: 352, y: 206 },
  { x: 214, y: 334 },
  { x: 412, y: 384 },
];
const MINOR_BLIPS: [number, number][] = [
  [180, 200], [262, 146], [436, 282], [332, 478], [148, 402], [472, 172], [384, 118], [240, 444],
];

// A wobbly closed curve — stacked together they read as topographic contours.
function contourPath(k: number, base: number, ox = 330, oy = 280): string {
  const pts: string[] = [];
  for (let t = 0; t < 360; t += 4) {
    const a = (t * Math.PI) / 180;
    const r = base + 14 * Math.sin(3 * a + k) + 8 * Math.sin(5 * a + 2 * k) + 5 * Math.sin(7 * a - k);
    pts.push(`${(ox + r * Math.cos(a)).toFixed(1)},${(oy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

export default function RadarScope({ uid, leaders = [], decorative = false }: Props) {
  const contours = useMemo(() => [40, 78, 116, 154, 192, 230].map((base, k) => contourPath(k, base)), []);
  const ticks = useMemo(() => Array.from({ length: 72 }, (_, i) => i * 5), []);
  const ringText = "GENERALS ZERO HOUR · COMMANDER · RANKED LADDER · ".repeat(2);

  const shown = leaders.slice(0, 3);
  const label =
    shown.length > 0
      ? `Radar scope showing the top commanders: ${shown.map((l) => `${l.name} ${l.rating}`).join(", ")}`
      : "Decorative radar scope";

  return (
    <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-30 -30 660 660"
        width="100%"
        height="100%"
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative ? true : undefined}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={C.radar} stopOpacity="0.22" />
            <stop offset="1" stopColor={C.radar} stopOpacity="0" />
          </radialGradient>
          <path id={`${uid}-ring`} d="M300,300 m-314,0 a314,314 0 1,1 628,0 a314,314 0 1,1 -628,0" />
        </defs>

        <circle cx="300" cy="300" r="296" fill={`url(#${uid}-glow)`} />

        {contours.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={C.radar} strokeOpacity="0.17" strokeWidth="1" />
        ))}

        {[296, 236, 176, 116, 56].map((r) => (
          <circle
            key={r}
            cx="300"
            cy="300"
            r={r}
            fill="none"
            stroke={r === 296 ? C.radar : C.lineStrong}
            strokeOpacity={r === 296 ? 0.55 : 1}
            strokeWidth="1"
          />
        ))}
        <line x1="4" y1="300" x2="596" y2="300" stroke={C.lineStrong} />
        <line x1="300" y1="4" x2="300" y2="596" stroke={C.lineStrong} />

        {ticks.map((deg) => {
          const major = deg % 30 === 0;
          return (
            <line
              key={deg}
              x1="300"
              y1="4"
              x2="300"
              y2={major ? 16 : 10}
              stroke={C.radar}
              strokeOpacity={major ? 0.7 : 0.28}
              transform={`rotate(${deg} 300 300)`}
            />
          );
        })}

        {[
          ["N", 300, -4],
          ["E", 612, 304],
          ["S", 300, 616],
          ["W", -12, 304],
        ].map(([t, x, y]) => (
          <text key={String(t)} x={x} y={y} textAnchor="middle" fontSize="12" fontWeight="600" fill={C.muted} style={{ fontFamily: MONO }}>
            {t}
          </text>
        ))}

        <text fontSize="10" letterSpacing="9.2" fill={C.muted} style={{ fontFamily: MONO }}>
          <textPath href={`#${uid}-ring`}>{ringText}</textPath>
        </text>

        {shown.length === 3 && (
          <polygon
            points={LEADER_SPOTS.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={C.amber}
            fillOpacity="0.04"
            stroke={C.amber}
            strokeOpacity="0.5"
            strokeDasharray="5 6"
          />
        )}

        {MINOR_BLIPS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill={C.radar} fillOpacity="0.85" />
        ))}

        {(shown.length > 0 ? shown : LEADER_SPOTS.map(() => null)).map((leader, i) => {
          const { x, y } = LEADER_SPOTS[i];
          return (
            <g key={i}>
              <circle className="cz-ping" style={{ animationDelay: `${i * 0.8}s` }} cx={x} cy={y} r="9" fill="none" stroke={C.amber} strokeWidth="1.5" />
              <circle cx={x} cy={y} r="6" fill={C.amber} />
              <circle cx={x} cy={y} r="11" fill="none" stroke={C.amber} strokeOpacity="0.45" />
              {leader && (
                <>
                  <line x1={x + 12} y1={y - 10} x2={x + 34} y2={y - 26} stroke={C.amber} strokeOpacity="0.6" />
                  <text x={x + 38} y={y - 27} fontSize="13" fontWeight="700" fill={C.paper} style={{ fontFamily: MONO }}>
                    {leader.name.toUpperCase().slice(0, 12)}
                  </text>
                  <text x={x + 38} y={y - 12} fontSize="12" fill={C.amber} style={{ fontFamily: MONO }}>
                    {leader.rating}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* The rotating sweep beam, clipped to the scope's outer ring. */}
      <div
        aria-hidden="true"
        className="cz-sweep"
        style={{
          position: "absolute",
          left: "5.15%",
          top: "5.15%",
          width: "89.7%",
          height: "89.7%",
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 296deg, rgba(143,191,79,0.30) 350deg, rgba(143,191,79,0.65) 360deg)",
        }}
      />
    </div>
  );
}
