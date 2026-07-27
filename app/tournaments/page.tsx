import { Radio, Trophy } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  PALETTE — kept identical across every page in the site.            */
/*  Change one, change all.                                            */
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

type Status = "Registration Open" | "Coming Soon" | "Active";

interface Event {
  name: string;
  status: Status;
  info: string;
}

const events: Event[] = [
  {
    name: "Commander Tournament 2026",
    status: "Registration Open",
    info: "1v1 and team battles.",
  },
  {
    name: "Clan Championship",
    status: "Coming Soon",
    info: "International Generals Zero Hour event.",
  },
  {
    name: "Weekly Community War",
    status: "Active",
    info: "Play with the best players.",
  },
];

/* Status → accent color and whether the live-pulse dot should animate */
const STATUS_STYLE: Record<Status, { color: string; live: boolean }> = {
  "Registration Open": { color: C.radar, live: true },
  Active: { color: C.radar, live: true },
  "Coming Soon": { color: C.muted, live: false },
};

export default function Tournaments() {
  const activeCount = events.filter((e) => e.status !== "Coming Soon").length;

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
          <span style={{ color: C.amber }}>Tournaments</span>
        </h1>

        <p className="text-sm mt-4 uppercase tracking-widest" style={{ color: C.muted }}>
          Events &middot; Rankings &middot; Winners &middot; Clan wars
        </p>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 pt-6 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            Events <b style={{ color: C.paper }}>{String(events.length).padStart(2, "0")}</b>
          </span>
          <span>
            Open now <b style={{ color: C.radar }}>{String(activeCount).padStart(2, "0")}</b>
          </span>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* GRID                                                        */}
        {/* ---------------------------------------------------------- */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {events.map((event) => {
            const style = STATUS_STYLE[event.status];
            return (
              <div
                key={event.name}
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

                <div className="flex items-center justify-between mb-5">
                  <Trophy size={24} style={{ color: C.amber }} />
                  <span
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-1"
                    style={{ border: `1px solid ${C.lineStrong}`, color: style.color }}
                  >
                    <span
                      className={style.live ? "cz-live" : ""}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: style.color,
                        display: "inline-block",
                      }}
                    />
                    {event.status}
                  </span>
                </div>

                <h2 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
                  {event.name}
                </h2>

                <p className="text-xs mt-3" style={{ color: C.muted }}>
                  {event.info}
                </p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
