import { C } from "@/lib/theme";

const DISPLAY = "var(--font-display), 'Oswald', sans-serif";

function Frame({ id, glow = C.amber, children }: { id: string; glow?: string; children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 300"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="55%" r="65%">
          <stop offset="0" stopColor={glow} stopOpacity="0.2" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={C.panel} />
      <rect width="400" height="300" fill={`url(#${id})`} />
      {children}
    </svg>
  );
}

/** A podium on a grid — "play ranked". */
export function LadderArt() {
  const bars = [
    { x: 70, h: 110, n: "2", c: "#C0C0C0", top: false },
    { x: 155, h: 160, n: "1", c: C.amber, top: true },
    { x: 240, h: 110, n: "3", c: "#CD7F32", top: false },
  ];
  return (
    <Frame id="art-ladder">
      {Array.from({ length: 17 }, (_, i) => (
        <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="300" stroke={C.line} />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 25} x2="400" y2={i * 25} stroke={C.line} />
      ))}
      {bars.map((b) => {
        const y = 250 - b.h;
        return (
          <g key={b.n}>
            <rect x={b.x} y={y} width="90" height={b.h} fill={b.top ? "rgba(232,166,61,0.14)" : C.panelHover} stroke={b.c} strokeWidth={b.top ? 2 : 1} />
            <text x={b.x + 45} y={y + 52} textAnchor="middle" fontSize="48" fontWeight="700" fill={b.c} style={{ fontFamily: DISPLAY }}>
              {b.n}
            </text>
            <circle cx={b.x + 45} cy={y - 22} r="14" fill="none" stroke={b.c} strokeWidth="2" />
          </g>
        );
      })}
      <line x1="40" y1="250" x2="360" y2="250" stroke={C.amber} strokeWidth="2" />
    </Frame>
  );
}

/** A film strip with a playhead and waveform — "study replays". */
export function ReplayArt() {
  return (
    <Frame id="art-replay" glow={C.radar}>
      {Array.from({ length: 6 }, (_, i) => {
        const x = 24 + i * 60;
        const active = i === 3;
        return (
          <g key={i}>
            <rect x={x} y="70" width="52" height="72" fill={active ? "rgba(232,166,61,0.12)" : C.panelHover} stroke={active ? C.amber : C.lineStrong} strokeWidth={active ? 2 : 1} />
            {[60, 146].map((hy) => (
              <g key={hy}>
                <rect x={x + 6} y={hy} width="8" height="6" fill={C.lineStrong} />
                <rect x={x + 22} y={hy} width="8" height="6" fill={C.lineStrong} />
                <rect x={x + 38} y={hy} width="8" height="6" fill={C.lineStrong} />
              </g>
            ))}
            <path d={`M${x + 10} 120 l10 -22 8 14 6 -8 8 16z`} fill="none" stroke={active ? C.amber : C.radar} strokeOpacity="0.8" strokeWidth="1.5" />
          </g>
        );
      })}
      <line x1="24" y1="190" x2="376" y2="190" stroke={C.lineStrong} strokeWidth="2" />
      <line x1="24" y1="190" x2="204" y2="190" stroke={C.amber} strokeWidth="2" />
      {Array.from({ length: 45 }, (_, i) => {
        const x = 24 + i * 8;
        const h = 6 + Math.abs(Math.sin(i * 0.7) * 18) + Math.abs(Math.sin(i * 0.23) * 10);
        const played = x < 204;
        return (
          <line key={i} x1={x} y1={248 - h / 2} x2={x} y2={248 + h / 2} stroke={played ? C.amber : C.muted} strokeWidth="3" strokeOpacity={played ? 0.9 : 0.55} />
        );
      })}
      <line x1="204" y1="44" x2="204" y2="276" stroke={C.amber} strokeWidth="2" />
      <path d="M194 38 h20 l-10 12z" fill={C.amber} />
    </Frame>
  );
}

/** A tournament bracket with the winning path lit — "compete". */
export function BracketArt() {
  const slots = Array.from({ length: 8 }, (_, i) => 40 + i * 30);
  const r2 = [0, 1, 2, 3].map((i) => (slots[2 * i] + slots[2 * i + 1]) / 2);
  const r3 = [0, 1].map((i) => (r2[2 * i] + r2[2 * i + 1]) / 2);
  const fin = (r3[0] + r3[1]) / 2;

  const slot = (x: number, y: number, w: number, hl: boolean, key: string) => (
    <rect key={key} x={x} y={y - 9} width={w} height="18" fill={C.panelHover} stroke={hl ? C.amber : C.lineStrong} strokeWidth={hl ? 1.6 : 1} />
  );
  const conn = (x1: number, y1: number, x2: number, y2: number, hl: boolean, key: string) => (
    <polyline key={key} points={`${x1},${y1} ${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`} fill="none" stroke={hl ? C.amber : C.lineStrong} strokeWidth={hl ? 1.6 : 1} />
  );

  return (
    <Frame id="art-bracket">
      {slots.map((y, i) => slot(30, y, 76, i === 0, `a${i}`))}
      {r2.map((y, i) => slot(140, y, 76, i === 0, `b${i}`))}
      {r3.map((y, i) => slot(250, y, 76, i === 0, `c${i}`))}
      {slot(336, fin, 54, true, "fin")}
      {[0, 1, 2, 3].flatMap((i) => [conn(106, slots[2 * i], 140, r2[i], i === 0, `c1-${i}`), conn(106, slots[2 * i + 1], 140, r2[i], false, `c2-${i}`)])}
      {[0, 1].flatMap((i) => [conn(216, r2[2 * i], 250, r3[i], i === 0, `d1-${i}`), conn(216, r2[2 * i + 1], 250, r3[i], false, `d2-${i}`)])}
      {conn(326, r3[0], 336, fin, true, "e1")}
      {conn(326, r3[1], 336, fin, false, "e2")}
      <g transform={`translate(351 ${fin - 30})`} fill="none" stroke={C.amber} strokeWidth="1.6" strokeLinecap="round">
        <path d="M6 14H3.5a2 2 0 0 1 0-4H6" />
        <path d="M18 14h2.5a2 2 0 0 0 0-4H18" />
        <path d="M6 8h12v5a6 6 0 0 1-12 0z" />
        <path d="M9 21h6" />
      </g>
    </Frame>
  );
}
