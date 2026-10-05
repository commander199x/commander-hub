import type { Metadata } from "next";
import { Swords, Wrench, Newspaper, Puzzle, Trophy, ArrowUpRight } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import "@/app/animations.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind Commander — a Generals Zero Hour community built around matches, strategy, and staying connected on and off the battlefield.",
};

const PILLARS = [
  {
    icon: Swords,
    title: "Ranked Matches",
    description: "2v2, 3v3, 4v4, and FFA — tracked, rated, and ranked on the leaderboard.",
  },
  {
    icon: Puzzle,
    title: "Strategy & Tactics",
    description: "Content built to help every player improve, from build orders to mid-game reads.",
  },
  {
    icon: Wrench,
    title: "Tutorials & Fixes",
    description: "Solutions for the common headaches of running an old game on modern hardware.",
  },
  {
    icon: Newspaper,
    title: "Mods & Tools",
    description: "A home for ShockWave, Generals Online, and the tools that support them.",
  },
  {
    icon: Trophy,
    title: "Tournaments",
    description: "Events, replays, and a community that shows up to compete.",
  },
];

export default function AboutPage() {
  return (
    <main className="cz-grid-bg" style={{ minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
        <span
          style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: C.radar,
          }}
        >
          Field Comms
        </span>
        <h1
          className="cz-display uppercase"
          style={{ fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 700, margin: "0.5rem 0 1.5rem" }}
        >
          About Commander
        </h1>

        <div
          className="cz-card"
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            padding: "1.75rem",
            marginBottom: "3rem",
          }}
        >
          <p style={{ lineHeight: 1.8, color: C.paper, marginBottom: "1.1rem" }}>
            Commander started as a home for Generals Zero Hour content — matches, strategy
            breakdowns, tutorials, and the kind of practical know-how that only comes from
            putting in the hours on the battlefield. Over time it grew into something bigger:
            a full headquarters for the community itself.
          </p>
          <p style={{ lineHeight: 1.8, color: C.paper }}>
            Today, Commander brings together everything a Zero Hour player needs in one
            place — replays worth studying, maps and mods worth downloading, a leaderboard
            worth climbing, and a clan worth joining.
          </p>
        </div>

        <h2 className="cz-display uppercase text-2xl mb-6" style={{ fontWeight: 600 }}>
          What we're about
        </h2>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="cz-card cz-hover-lift group relative block p-5"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
              >
                {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map(
                  (pos) => (
                    <span
                      key={pos}
                      className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      style={{ borderColor: C.amber }}
                    />
                  )
                )}

                <Icon size={22} style={{ color: C.amber }} />

                <h3 className="text-base mt-4" style={{ color: C.paper, fontWeight: 500 }}>
                  {pillar.title}
                </h3>

                <p className="text-xs mt-2" style={{ color: C.muted }}>
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </section>

        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cz-card cz-hover-lift group relative block p-6"
          style={{ background: C.panel, border: `1px solid ${C.amber}` }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: C.radar }}>
                Recruiting
              </span>
              <h3 className="cz-display uppercase text-xl mt-1" style={{ color: C.paper, fontWeight: 600 }}>
                Join the Army
              </h3>
              <p className="text-xs mt-2" style={{ color: C.muted, maxWidth: "480px" }}>
                Generals Zero Hour has stayed alive because people like you kept showing up
                for it. If that's you, there's a seat waiting in the Commander clan.
              </p>
            </div>

            <span
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-6 py-3 shrink-0"
              style={{ background: C.amber, color: C.void, fontWeight: 600 }}
            >
              Join Discord
              <ArrowUpRight size={14} />
            </span>
          </div>
        </a>
      </div>
    </main>
  );
}