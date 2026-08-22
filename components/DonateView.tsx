"use client";

import { Radio, ArrowUpRight, Server, Trophy, Wrench, ShieldCheck, Star, Crown, Gift } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { TOP_DONATOR, SUPPORTERS } from "@/lib/donors-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const CREATORS_URL = "https://creators.sa/commander199x";

interface FundUse {
  icon: typeof Server;
  labelKey: string;
  amount: string;
  cadenceKey: string;
}

// TODO: replace with your real cost breakdown
const FUND_USES: FundUse[] = [
  { icon: Server, labelKey: "donate.fundHosting", amount: "$200", cadenceKey: "donate.perMonth" },
  { icon: Trophy, labelKey: "donate.fundPrizes", amount: "$500", cadenceKey: "donate.perEvent" },
  { icon: Wrench, labelKey: "donate.fundTools", amount: "$100", cadenceKey: "donate.perMonth" },
];

// TODO: update these two numbers by hand as donations come in
const GOAL_LABEL = "Summer 2026 tournament prize pool"; // TODO: replace with your real current goal
const RAISED = 0; // TODO
const GOAL = 200; // TODO
const progressPct = Math.min(100, Math.round((RAISED / GOAL) * 100));

export default function DonateView() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: C.radar }}>
          <Radio size={13} className="cz-live" />
          <span>{t("common.fieldComms")}</span>
        </div>

        <h1
          className="cz-display uppercase mt-4 leading-[0.95]"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
        >
          {t("donate.titleLine1")}
          <br />
          <span style={{ color: C.amber }}>{t("donate.titleLine2")}</span>
        </h1>

        <p className="text-sm mt-6 max-w-lg" style={{ color: C.muted }}>
          {t("donate.intro")}
        </p>

        {TOP_DONATOR && (
          <div
            className="mt-10 p-6 flex items-center gap-4"
            style={{ background: `${C.amber}14`, border: `1px solid ${C.amber}` }}
          >
            <Crown size={28} style={{ color: C.amber }} />
            <div>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: C.amber }}>
                {t("donate.topSupporter")}
              </span>
              <p className="text-base mt-0.5" style={{ color: C.paper, fontWeight: 600 }}>
                {TOP_DONATOR.name}
                {TOP_DONATOR.amount && (
                  <span className="ms-2 text-sm" style={{ color: C.amber }}>
                    {TOP_DONATOR.amount}
                  </span>
                )}
              </p>
              {TOP_DONATOR.message && (
                <p className="text-xs mt-1" style={{ color: C.muted }}>
                  {TOP_DONATOR.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between text-xs uppercase tracking-widest">
            <span style={{ color: C.muted }}>{t("donate.currentGoal")}</span>
            <span style={{ color: C.paper }}>
              ${RAISED} <span style={{ color: C.muted }}>/ ${GOAL}</span>
            </span>
          </div>

          <h2 className="text-[15px] mt-2" style={{ color: C.paper, fontWeight: 500 }}>
            {GOAL_LABEL}
          </h2>

          <div className="mt-4 h-2 w-full" style={{ background: C.void, border: `1px solid ${C.lineStrong}` }}>
            <div
              className="h-full transition-all"
              style={{ width: `${progressPct}%`, background: C.amber }}
            />
          </div>

          <p className="text-[11px] uppercase tracking-widest mt-2" style={{ color: C.muted }}>
            {progressPct}{t("donate.funded")}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-12 mb-4">
          <h2 className="cz-display uppercase text-xl" style={{ fontWeight: 600 }}>
            {t("donate.whereItGoes")}
          </h2>
        </div>

        <section className="grid sm:grid-cols-3 gap-4">
          {FUND_USES.map((use) => {
            const Icon = use.icon;
            return (
              <div key={use.labelKey} className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <Icon size={18} style={{ color: C.amber }} />
                <p className="text-xs mt-3" style={{ color: C.paper, fontWeight: 500 }}>
                  {t(use.labelKey)}
                </p>
                <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: C.muted }}>
                  {use.amount} {t(use.cadenceKey)}
                </p>
              </div>
            );
          })}
        </section>

        <div className="mt-12" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Gift size={20} style={{ color: C.amber }} />
              <span
                className="text-[10px] uppercase tracking-widest px-2 py-1"
                style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}
              >
                {t("donate.instant")}
              </span>
            </div>

            <h2 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
              {t("donate.creatorsTitle")}
            </h2>
            <p className="text-xs mt-2" style={{ color: C.muted }}>
              {t("donate.creatorsDesc")}
            </p>

            <a
              href={CREATORS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 text-xs uppercase tracking-widest px-6 py-3"
              style={{ background: C.amber, color: C.void, fontWeight: 600 }}
            >
              {t("donate.donateViaCreators")}
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3 mt-8 p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <ShieldCheck size={16} style={{ color: C.radar, marginTop: 2 }} />
          <p className="text-xs" style={{ color: C.muted }}>
            {t("donate.trustNote")}{" "}
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.amber }}>
              {t("donate.discord")}
            </a>{" "}
            {t("donate.trustNoteEnd")}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-12 mb-4">
          <Star size={16} style={{ color: C.amber }} />
          <h2 className="cz-display uppercase text-xl" style={{ fontWeight: 600 }}>
            {t("donate.rollOfHonor")}
          </h2>
        </div>

        <p className="text-xs mb-4" style={{ color: C.muted }}>
          {t("donate.rollOfHonorDesc")}
        </p>

        <div className="flex flex-wrap gap-2 mb-14">
          {SUPPORTERS.map((supporter) => (
            <span
              key={supporter.name}
              className="text-xs px-3 py-2"
              style={{ border: `1px solid ${C.lineStrong}`, color: C.paper }}
            >
              {supporter.name}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
