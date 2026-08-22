"use client";

import { Radio, Trophy, ArrowUpRight } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Flip this to false once you have a real tournament to show — the full
// event grid below is untouched and ready to go the moment you do.
const COMING_SOON = true;

type Status = "Registration Open" | "Coming Soon" | "Active";

interface Event {
  name: string;
  status: Status;
  info: string;
}

const events: Event[] = [
  { name: "Commander Tournament 2026", status: "Registration Open", info: "1v1 and team battles." },
  { name: "Clan Championship", status: "Coming Soon", info: "International Generals Zero Hour event." },
  { name: "Weekly Community War", status: "Active", info: "Play with the best players." },
];

const STATUS_STYLE: Record<Status, { color: string; live: boolean }> = {
  "Registration Open": { color: C.radar, live: true },
  Active: { color: C.radar, live: true },
  "Coming Soon": { color: C.muted, live: false },
};

export default function TournamentsView() {
  const { t } = useLanguage();

  const STATUS_LABEL: Record<Status, string> = {
    "Registration Open": t("tournaments.statusRegistrationOpen"),
    Active: t("tournaments.statusActive"),
    "Coming Soon": t("tournaments.statusComingSoon"),
  };

  if (COMING_SOON) {
    return (
      <main className="min-h-screen w-full cz-grid-bg flex items-center justify-center">
        <div className="max-w-lg mx-auto px-6 text-center py-24">
          <div className="flex items-center justify-center gap-2 text-xs tracking-widest uppercase mb-6" style={{ color: C.radar }}>
            <Radio size={13} className="cz-live" />
            <span>{t("common.fieldComms")}</span>
          </div>

          <Trophy size={40} className="mx-auto" style={{ color: C.amber }} />

          <h1
            className="cz-display uppercase mt-6 leading-[0.95]"
            style={{ fontSize: "clamp(2.4rem, 6vw, 3.6rem)", fontWeight: 700, letterSpacing: "0.01em" }}
          >
            {t("tournaments.title")}
            <br />
            <span style={{ color: C.amber }}>{t("tournaments.comingSoon")}</span>
          </h1>

          <p className="text-sm mt-6" style={{ color: C.muted }}>
            {t("tournaments.comingSoonDesc")}
          </p>

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 text-xs uppercase tracking-widest px-6 py-3"
            style={{ background: C.amber, color: C.void, fontWeight: 600 }}
          >
            {t("tournaments.getNotified")}
            <ArrowUpRight size={14} />
          </a>
        </div>
      </main>
    );
  }

  const activeCount = events.filter((e) => e.status !== "Coming Soon").length;

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
          <span style={{ color: C.amber }}>{t("tournaments.title")}</span>
        </h1>

        <p className="text-sm mt-4 uppercase tracking-widest" style={{ color: C.muted }}>
          {t("tournaments.tags")}
        </p>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 pt-6 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            {t("tournaments.eventsLabel")} <b style={{ color: C.paper }}>{String(events.length).padStart(2, "0")}</b>
          </span>
          <span>
            {t("tournaments.openNowLabel")} <b style={{ color: C.radar }}>{String(activeCount).padStart(2, "0")}</b>
          </span>
        </div>

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
                      style={{ width: 6, height: 6, borderRadius: "50%", background: style.color, display: "inline-block" }}
                    />
                    {STATUS_LABEL[event.status]}
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
