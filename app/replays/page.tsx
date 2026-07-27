import { Radio, Disc3, Download, ArrowUpRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  PALETTE — kept identical across app/page.tsx, app/videos/page.tsx,*/
/*  app/downloads/page.tsx and this file. Change one, change all.     */
/* ------------------------------------------------------------------ */

const C = {
  void: "#0A0C08",
  panel: "#12150E",
  line: "#272B1E",
  lineStrong: "#3A4029",
  amber: "#E8A63D",
  radar: "#8FBF4F",
  paper: "#EDEAE0",
  muted: "#83866F",
};

interface Replay {
  title: string;
  players: string;
  file: string;
}

const replays: Replay[] = [
  {
    title: "China vs USA epic battle",
    players: "Commander vs player",
    file: "/replays/china-vs-usa.rep",
  },
  {
    title: "GLA tournament match",
    players: "Clan war match",
    file: "/replays/gla-match.rep",
  },
  {
    title: "1v1 pro gameplay",
    players: "Ranked battle",
    file: "/replays/pro-game.rep",
  },
];

export default function Replays() {
  return (
    <main
      className="min-h-screen w-full"
      style={{
        background: C.void,
        color: C.paper,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        backgroundImage: `linear-gradient(${C.line}22 1px, transparent 1px), linear-gradient(90deg, ${C.line}22 1px, transparent 1px)`,
        backgroundSize: "42px 42px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .cz-display { font-family: 'Oswald', sans-serif; }
        @keyframes cz-blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
        .cz-live { animation: cz-blink 1.6s ease-in-out infinite; }
        .cz-card:hover .cz-bracket { opacity: 1; }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        {/* ---------------------------------------------------------- */}
        {/* HEADER                                                      */}
        {/* ---------------------------------------------------------- */}
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: C.radar }}>
          <Radio size={13} className="cz-live" />
          <span>Field comms &middot; Generals Zero Hour</span>
        </div>

        <h1
          className="cz-display uppercase mt-4 leading-[0.95]"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
        >
          Replay
          <br />
          <span style={{ color: C.amber }}>Library</span>
        </h1>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 pt-6 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            Records <b style={{ color: C.paper }}>{String(replays.length).padStart(2, "0")}</b>
          </span>
          <span>
            Status <b style={{ color: C.radar }}>Archive online</b>
          </span>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* GRID                                                        */}
        {/* ---------------------------------------------------------- */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {replays.map((replay, i) => (
            <div
              key={replay.title}
              className="cz-card group relative p-5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map(
                (pos) => (
                  <span
                    key={pos}
                    className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 transition-opacity duration-300`}
                    style={{ borderColor: C.amber }}
                  />
                )
              )}

              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest mb-5" style={{ color: C.muted }}>
                <span>Record</span>
                <span>Log {String(i + 1).padStart(2, "0")}</span>
              </div>

              <Disc3 size={26} style={{ color: C.amber }} />

              <h2 className="text-[15px] mt-4" style={{ color: C.paper, fontWeight: 500 }}>
                {replay.title}
              </h2>

              <p className="text-xs mt-2" style={{ color: C.muted }}>
                {replay.players}
              </p>

              <a
                href={replay.file}
                download
                className="flex items-center justify-between mt-5 pt-3 text-xs uppercase tracking-widest transition-colors"
                style={{ borderTop: `1px solid ${C.line}`, color: C.amber }}
              >
                <span className="flex items-center gap-2">
                  <Download size={13} />
                  Download replay
                </span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
