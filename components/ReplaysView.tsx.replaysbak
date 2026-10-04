"use client";

import { Radio, Disc3, Download, ArrowUpRight } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Replay {
  title: string;
  players: string;
  file: string;
}

// Empty for now — add entries here once you have real replays to share.
// Example shape:
// { title: "China vs USA epic battle", players: "Commander vs player", file: "/replays/china-vs-usa.rep" },
const replays: Replay[] = [];

export default function ReplaysView() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: C.radar }}>
          <Radio size={13} className="cz-live" />
          <span>{t("common.fieldComms")}</span>
        </div>

        <h1
          className="cz-display uppercase mt-4 leading-[0.95]"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
        >
          {t("replays.titleLine1")}
          <br />
          <span style={{ color: C.amber }}>{t("replays.titleLine2")}</span>
        </h1>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 pt-6 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            {t("replays.recordsLabel")} <b style={{ color: C.paper }}>{String(replays.length).padStart(2, "0")}</b>
          </span>
          <span>
            {t("replays.statusLabel")} <b style={{ color: replays.length > 0 ? C.radar : C.muted }}>
              {replays.length > 0 ? t("replays.statusOnline") : t("replays.statusAwaiting")}
            </b>
          </span>
        </div>

        {replays.length === 0 ? (
          <div className="mt-14 py-16 text-center" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <Disc3 size={32} className="mx-auto" style={{ color: C.lineStrong }} />

            <h2 className="cz-display uppercase text-xl mt-5" style={{ fontWeight: 600 }}>
              {t("replays.noReplaysTitle")}
            </h2>

            <p className="text-sm mt-3 max-w-sm mx-auto" style={{ color: C.muted }}>
              {t("replays.noReplaysDesc")}
            </p>

            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-xs uppercase tracking-widest px-6 py-3"
              style={{ background: C.amber, color: C.void, fontWeight: 600 }}
            >
              {t("replays.submitReplay")}
              <ArrowUpRight size={14} />
            </a>
          </div>
        ) : (
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
                  <span>{t("replays.record")}</span>
                  <span>{t("replays.logPrefix")} {String(i + 1).padStart(2, "0")}</span>
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
                    {t("replays.downloadReplay")}
                  </span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
