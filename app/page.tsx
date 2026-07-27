import Link from "next/link";
import { Film, FolderOpen, Video, Trophy, Radio, ArrowUpRight } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";

const OPS = [
  { icon: Film, title: "Replay library", description: "Download professional Zero Hour matches.", href: "/replays", tag: "Archive" },
  { icon: FolderOpen, title: "Downloads", description: "Maps, mods, tools and files.", href: "/downloads", tag: "Supply" },
  { icon: Video, title: "Videos", description: "TikTok, YouTube and streams.", href: "/videos", tag: "Comms" },
  { icon: Trophy, title: "Tournaments", description: "Events, rankings and winners.", href: "/tournaments", tag: "Rankings" },
];

export default function Home() {
  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <section
        className="relative h-[520px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/images/banner.png')" }}
      >
        <div className="absolute inset-0" style={{ background: `${C.void}CC` }} />
        <div className="absolute inset-0 opacity-40 cz-grid-bg" />

        <div className="relative text-center px-6">
          <div className="flex items-center justify-center gap-2 text-xs tracking-widest uppercase mb-6" style={{ color: C.radar }}>
            <Radio size={13} className="cz-live" />
            <span>Field comms &middot; Generals Zero Hour</span>
          </div>

          <img
            src="/images/commander-logo.png"
            alt="Commander logo"
            className="w-32 h-32 mx-auto object-cover"
            style={{ border: `2px solid ${C.amber}` }}
          />

          <h1
            className="cz-display uppercase mt-6 leading-[0.95]"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
          >
            Commander
          </h1>

          <p className="text-sm md:text-base mt-3 uppercase tracking-widest" style={{ color: C.muted }}>
            Generals Zero Hour community
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
        <div className="text-center">
          <h2 className="cz-display uppercase text-3xl md:text-4xl" style={{ fontWeight: 600 }}>
            Generals Zero Hour headquarters
          </h2>

          <p className="text-xs md:text-sm mt-4 uppercase tracking-widest" style={{ color: C.muted }}>
            Replays &middot; Strategies &middot; Clan &middot; Tournaments &middot; Community
          </p>

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 text-xs uppercase tracking-widest px-6 py-3"
            style={{ background: C.amber, color: C.void, fontWeight: 600 }}
          >
            Join our clan
            <ArrowUpRight size={14} />
          </a>
        </div>

        <div
          className="mt-6 pt-6 flex items-center justify-center gap-x-10 gap-y-2 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            Status <b style={{ color: C.radar }}>Broadcasting</b>
          </span>
          <span>
            Sectors <b style={{ color: C.paper }}>{OPS.length}</b>
          </span>
        </div>
        <a
          href="/join"
          className="cz-card group relative block p-6 mt-8"
          style={{ background: C.panel, border: `1px solid ${C.amber}` }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: C.radar }}>
                Recruiting
              </span>
              <h3 className="cz-display uppercase text-xl mt-1" style={{ color: C.paper, fontWeight: 600 }}>
                Join our team
              </h3>
              <p className="text-xs mt-2" style={{ color: C.muted }}>
                Looking to compete, contribute, or help run the clan? Apply now.
              </p>
            </div>

            <span
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-6 py-3 shrink-0"
              style={{ background: C.amber, color: C.void, fontWeight: 600 }}
            >
              Apply
              <ArrowUpRight size={14} />
            </span>
          </div>
        </a>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {OPS.map((op) => {
            const Icon = op.icon;
            return (
              <Link
                key={op.title}
                href={op.href}
                className="cz-card group relative block p-5"
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
                  <span>{op.tag}</span>
                </div>

                <Icon size={22} style={{ color: C.amber }} />

                <h3 className="text-base mt-4" style={{ color: C.paper, fontWeight: 500 }}>
                  {op.title}
                </h3>

                <p className="text-xs mt-2" style={{ color: C.muted }}>
                  {op.description}
                </p>

                <div
                  className="flex items-center justify-between mt-5 pt-3 text-xs uppercase tracking-widest"
                  style={{ borderTop: `1px solid ${C.line}`, color: C.amber }}
                >
                  <span>Enter</span>
                  <ArrowUpRight size={14} />
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
