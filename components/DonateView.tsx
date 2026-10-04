"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, ArrowUpRight, Server, Trophy, Wrench, ShieldCheck, Star, Crown, Gift, Heart, Target } from "lucide-react";
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

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";

const CSS = `
@keyframes czdn-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes czdn-stripes { from { background-position: 0 0; } to { background-position: 40px 0; } }
@keyframes czdn-border { to { transform: rotate(360deg); } }
@keyframes czdn-float { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-6px) rotate(4deg); } }
@keyframes czdn-pulse { 0% { box-shadow: 0 0 0 0 rgba(232,166,61,0.55); } 100% { box-shadow: 0 0 0 18px rgba(232,166,61,0); } }
@keyframes czdn-shine { 0% { transform: translateX(-130%) skewX(-20deg); } 60%, 100% { transform: translateX(230%) skewX(-20deg); } }
@keyframes czdn-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes czdn-heart { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.18); } 30% { transform: scale(1); } 45% { transform: scale(1.12); } }
.czdn-in { animation: czdn-in 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czdn-bar { width: 0; transition: width 1.6s cubic-bezier(0.2, 0.7, 0.2, 1); background-image: linear-gradient(45deg, rgba(10,12,8,0.18) 25%, transparent 25%, transparent 50%, rgba(10,12,8,0.18) 50%, rgba(10,12,8,0.18) 75%, transparent 75%); background-size: 40px 40px; animation: czdn-stripes 1.2s linear infinite; }
.czdn-ring { position: relative; overflow: hidden; }
.czdn-ring::before { content: ""; position: absolute; inset: -150%; background: conic-gradient(from 0deg, transparent 0deg, #E8A63D 40deg, transparent 90deg, transparent 180deg, #8FBF4F 220deg, transparent 270deg); animation: czdn-border 5s linear infinite; }
.czdn-ring > .czdn-ring-inner { position: relative; }
.czdn-float { animation: czdn-float 3.4s ease-in-out infinite; }
.czdn-cta { position: relative; overflow: hidden; animation: czdn-pulse 2s ease-out infinite; }
.czdn-cta::after { content: ""; position: absolute; top: 0; bottom: 0; width: 35%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent); animation: czdn-shine 3s ease-in-out infinite; }
.czdn-card { transition: transform 0.3s ease, border-color 0.3s ease; }
.czdn-card:hover { transform: translateY(-4px); border-color: #8A6425 !important; }
.czdn-card:hover .czdn-icon { transform: scale(1.12) rotate(-6deg); }
.czdn-icon { transition: transform 0.3s ease; }
.czdn-marquee { display: flex; width: max-content; animation: czdn-marquee 40s linear infinite; }
.czdn-marquee-wrap:hover .czdn-marquee { animation-play-state: paused; }
[dir="rtl"] .czdn-marquee { animation-direction: reverse; }
.czdn-heart { animation: czdn-heart 1.8s ease-in-out infinite; transform-origin: center; }
@media (prefers-reduced-motion: reduce) {
  .czdn-in, .czdn-bar, .czdn-ring::before, .czdn-float, .czdn-cta, .czdn-cta::after, .czdn-heart { animation: none !important; }
  .czdn-bar { transition: none !important; }
  .czdn-marquee { animation: none !important; flex-wrap: wrap; width: auto; }
  .czdn-card, .czdn-icon { transition: none !important; }
  .czdn-card:hover, .czdn-card:hover .czdn-icon { transform: none !important; }
}
`;

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return setInView(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

function CountUp({ value, run }: { value: number; run: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1500);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, run]);
  return <>{shown.toLocaleString("en")}</>;
}

export default function DonateView() {
  const { t } = useLanguage();
  const [goalRef, goalIn] = useInView<HTMLDivElement>();
  const names = SUPPORTERS.map((s) => s.name);
  const marquee = names.length >= 6;

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{CSS}</style>

      {/* ================= HERO ================= */}
      <header className="relative overflow-hidden border-b" style={{ borderColor: C.line }}>
        <div aria-hidden="true" className="pointer-events-none absolute end-[-6%] top-1/2 hidden -translate-y-1/2 md:block">
          <Heart size={340} strokeWidth={0.6} className="czdn-heart" style={{ color: "rgba(232,166,61,0.10)" }} />
        </div>
        <div className={`${WRAP} relative pb-12 pt-14 md:pt-20`}>
          <div className="czdn-in flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Radio size={14} className="cz-live" aria-hidden="true" />
            <span>{t("common.fieldComms")}</span>
          </div>
          <h1 className="czdn-in cz-display mt-3 uppercase leading-[0.92]" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, animationDelay: "0.08s" }}>
            {t("donate.titleLine1")} <span style={{ color: C.amber }}>{t("donate.titleLine2")}</span>
          </h1>
          <p className="czdn-in mt-5 max-w-xl text-base leading-relaxed" style={{ color: C.muted, animationDelay: "0.16s" }}>
            {t("donate.intro")}
          </p>
          <a
            href={CREATORS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="czdn-cta czdn-in mt-8 inline-flex min-h-[56px] items-center gap-2.5 px-8 text-sm uppercase tracking-[0.12em]"
            style={{ background: C.amber, color: C.void, fontWeight: 700, animationDelay: "0.24s" }}
          >
            <Heart size={17} fill="currentColor" aria-hidden="true" />
            {t("donate.donateViaCreators")}
            <ArrowUpRight size={16} className="rtl:-scale-x-100" aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className={`${WRAP} mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]`}>
        <div className="flex flex-col gap-6">
          {/* ================= GOAL ================= */}
          <section ref={goalRef} className="czdn-in border p-6 md:p-8" style={{ background: C.panel, borderColor: C.line }}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.2em]">
              <span className="inline-flex items-center gap-2" style={{ color: C.radar }}>
                <Target size={14} aria-hidden="true" />
                {t("donate.currentGoal")}
              </span>
              <span className="cz-display text-3xl tracking-normal tabular-nums" style={{ color: C.paper, fontWeight: 700 }} dir="ltr">
                $<CountUp value={RAISED} run={goalIn} /> <span className="text-xl" style={{ color: C.muted }}>/ ${GOAL}</span>
              </span>
            </div>
            <h2 className="cz-display mt-3 text-2xl uppercase md:text-3xl" style={{ fontWeight: 600 }}>
              {GOAL_LABEL}
            </h2>
            <div className="mt-6 h-4 w-full overflow-hidden" style={{ background: C.void, border: `1px solid ${C.lineStrong}` }} dir="ltr">
              <div
                className="czdn-bar h-full"
                style={{ width: goalIn ? `${Math.max(progressPct, progressPct > 0 ? 3 : 0)}%` : 0, backgroundColor: C.amber, boxShadow: "0 0 18px rgba(232,166,61,0.5)" }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-widest" style={{ color: C.muted }}>
              <span>
                <span className="cz-display text-xl tracking-normal" style={{ color: C.amber, fontWeight: 700 }}>
                  <CountUp value={progressPct} run={goalIn} />%
                </span>{" "}
                {t("donate.funded").replace(/^%\s*/, "")}
              </span>
            </div>
          </section>

          {/* ================= WHERE IT GOES ================= */}
          <section className="czdn-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="cz-display mb-4 text-2xl uppercase" style={{ fontWeight: 600 }}>
              {t("donate.whereItGoes")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {FUND_USES.map((use) => {
                const Icon = use.icon;
                return (
                  <div key={use.labelKey} className="czdn-card border p-5" style={{ background: C.panel, borderColor: C.line }}>
                    <span className="czdn-icon inline-flex h-11 w-11 items-center justify-center" style={{ border: `1px solid ${C.amberDim}`, color: C.amber }}>
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-sm" style={{ color: C.paper, fontWeight: 600 }}>
                      {t(use.labelKey)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest" style={{ color: C.muted }}>
                      <span className="cz-display text-lg tracking-normal" style={{ color: C.amber, fontWeight: 700 }}>{use.amount}</span> {t(use.cadenceKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="czdn-in flex items-start gap-3 border p-4" style={{ background: C.panel, borderColor: C.line, animationDelay: "0.2s" }}>
            <ShieldCheck size={18} style={{ color: C.radar, marginTop: 2 }} aria-hidden="true" />
            <p className="text-sm" style={{ color: C.muted }}>
              {t("donate.trustNote")}{" "}
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline" style={{ color: C.amber }}>
                {t("donate.discord")}
              </a>{" "}
              {t("donate.trustNoteEnd")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* ================= TOP SUPPORTER ================= */}
          {TOP_DONATOR && (
            <div className="czdn-ring czdn-in p-[1.5px]" style={{ animationDelay: "0.05s" }}>
              <div className="czdn-ring-inner flex items-center gap-5 p-6" style={{ background: "linear-gradient(140deg, #1d1a10, #12150E 60%)" }}>
                <span className="czdn-float flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(232,166,61,0.14)", border: `1px solid ${C.amberDim}`, boxShadow: "0 0 30px rgba(232,166,61,0.3)" }}>
                  <Crown size={30} style={{ color: C.amber }} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: C.amber }}>
                    {t("donate.topSupporter")}
                  </span>
                  <p className="cz-display mt-1 truncate text-3xl uppercase leading-none" style={{ fontWeight: 700 }}>
                    {TOP_DONATOR.name}
                  </p>
                  {TOP_DONATOR.amount && (
                    <p className="mt-1 text-sm" style={{ color: C.amber, fontWeight: 600 }}>{TOP_DONATOR.amount}</p>
                  )}
                  {TOP_DONATOR.message && (
                    <p className="mt-2 text-sm italic" style={{ color: C.muted }}>“{TOP_DONATOR.message}”</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= DONATE CARD ================= */}
          <div className="czdn-in border p-6" style={{ background: "linear-gradient(160deg, rgba(232,166,61,0.10), #12150E 55%)", borderColor: C.amberDim, animationDelay: "0.12s" }}>
            <div className="mb-4 flex items-center justify-between">
              <Gift size={24} style={{ color: C.amber }} aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.radar }}>
                <span className="cz-blink inline-block h-1.5 w-1.5 rounded-full" style={{ background: C.radar }} />
                {t("donate.instant")}
              </span>
            </div>
            <h2 className="cz-display text-2xl uppercase" style={{ fontWeight: 600 }}>
              {t("donate.creatorsTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
              {t("donate.creatorsDesc")}
            </p>
            <a
              href={CREATORS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="czdn-cta mt-5 flex min-h-[52px] items-center justify-center gap-2 text-xs uppercase tracking-widest"
              style={{ background: C.amber, color: C.void, fontWeight: 700 }}
            >
              {t("donate.donateViaCreators")}
              <ArrowUpRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* ================= ROLL OF HONOR ================= */}
      {names.length > 0 && (
        <section className={`${WRAP} mt-14`}>
          <h2 className="cz-display flex items-center gap-2.5 text-3xl uppercase" style={{ fontWeight: 600 }}>
            <Star size={20} style={{ color: C.amber }} aria-hidden="true" />
            {t("donate.rollOfHonor")}
          </h2>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>{t("donate.rollOfHonorDesc")}</p>

          {marquee ? (
            <div className="czdn-marquee-wrap relative mt-6 overflow-hidden border py-4" style={{ borderColor: C.line, background: C.panel, maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
              <div className="czdn-marquee gap-3 px-3">
                {[...names, ...names].map((n, i) => (
                  <span key={i} aria-hidden={i >= names.length} className="inline-flex shrink-0 items-center gap-2 border px-4 py-2 text-sm" style={{ borderColor: C.lineStrong, color: C.paper }}>
                    <Star size={12} style={{ color: C.amber }} aria-hidden="true" />
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-2">
              {names.map((n, i) => (
                <span key={n} className="czdn-in inline-flex items-center gap-2 border px-4 py-2 text-sm" style={{ borderColor: C.lineStrong, color: C.paper, animationDelay: `${i * 0.06}s` }}>
                  <Star size={12} style={{ color: C.amber }} aria-hidden="true" />
                  {n}
                </span>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
