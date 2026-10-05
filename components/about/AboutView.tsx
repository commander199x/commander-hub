"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Swords, Wrench, Newspaper, Puzzle, Trophy, ArrowUpRight, Users, Disc3, Radio, Shield } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useHomeData } from "@/components/home/useHomeData";

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Field Comms",
    title: "About Commander",
    lead: "A headquarters for the Generals Zero Hour community.",
    story: [
      "Commander started as a home for Generals Zero Hour content — matches, strategy breakdowns, tutorials, and the kind of practical know-how that only comes from putting in the hours on the battlefield. Over time it grew into something bigger: a full headquarters for the community itself.",
      "Today, Commander brings together everything a Zero Hour player needs in one place — replays worth studying, maps and mods worth downloading, a leaderboard worth climbing, and a clan worth joining.",
    ],
    numbers: "By the numbers",
    members: "Members",
    matches: "Ranked matches",
    replays: "Replays archived",
    about: "What we're about",
    pillars: [
      ["Ranked Matches", "2v2, 3v3, 4v4, and FFA — tracked, rated, and ranked on the leaderboard."],
      ["Strategy & Tactics", "Content built to help every player improve, from build orders to mid-game reads."],
      ["Tutorials & Fixes", "Solutions for the common headaches of running an old game on modern hardware."],
      ["Mods & Tools", "A home for ShockWave, Generals Online, and the tools that support them."],
      ["Tournaments", "Events, replays, and a community that shows up to compete."],
    ],
    recruiting: "Recruiting",
    joinTitle: "Join the Army",
    joinText: "Generals Zero Hour has stayed alive because people like you kept showing up for it. If that's you, there's a seat waiting in the Commander clan.",
    joinDiscord: "Join Discord",
    apply: "Apply to the team",
  },
  ar: {
    eyebrow: "قناة الاتصال",
    title: "عن كوماندر",
    lead: "مقرّ قيادة لمجتمع جنرالات الساعة الصفر.",
    story: [
      "بدأ كوماندر كبيت لمحتوى جنرالات الساعة الصفر: مباريات، وتحليلات استراتيجية، وشروحات، وخبرة عملية لا تأتي إلا بساعات طويلة في ساحة المعركة. ومع الوقت تحوّل إلى شيء أكبر: مقرّ قيادة كامل للمجتمع نفسه.",
      "اليوم يجمع كوماندر كل ما يحتاجه لاعب الساعة الصفر في مكان واحد: إعادات تستحق الدراسة، وخرائط وتعديلات تستحق التحميل، ولوحة صدارة تستحق التسلّق، وكلان يستحق الانضمام.",
    ],
    numbers: "بالأرقام",
    members: "الأعضاء",
    matches: "مباريات مصنّفة",
    replays: "إعادات مؤرشفة",
    about: "ما الذي نمثّله",
    pillars: [
      ["مباريات مصنّفة", "2v2 و3v3 و4v4 وFFA، تُسجَّل وتُقيَّم وتُرتَّب على لوحة الصدارة."],
      ["استراتيجيات وتكتيكات", "محتوى يساعد كل لاعب على التطوّر، من ترتيب البناء إلى قراءة منتصف المباراة."],
      ["شروحات وحلول", "حلول للمشكلات الشائعة عند تشغيل لعبة قديمة على أجهزة حديثة."],
      ["تعديلات وأدوات", "بيت لـ ShockWave وGenerals Online والأدوات التي تدعمهما."],
      ["بطولات", "فعاليات وإعادات ومجتمع يحضر ليتنافس."],
    ],
    recruiting: "التجنيد مفتوح",
    joinTitle: "انضم إلى الجيش",
    joinText: "بقيت جنرالات الساعة الصفر حيّة لأن أشخاصاً مثلك استمروا في الحضور. إن كنت منهم، فهناك مقعد ينتظرك في كلان كوماندر.",
    joinDiscord: "انضم إلى ديسكورد",
    apply: "قدّم للفريق",
  },
};

const ICONS = [Swords, Puzzle, Wrench, Newspaper, Trophy];

const CSS = `
@keyframes cza-word { from { opacity: 0; transform: translateY(0.5em) rotate(2deg); filter: blur(4px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes cza-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@keyframes cza-sweep { to { transform: rotate(360deg); } }
@keyframes cza-shine { 0% { transform: translateX(-130%) skewX(-20deg); } 60%, 100% { transform: translateX(230%) skewX(-20deg); } }
.cza-word { display: inline-block; animation: cza-word 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.cza-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1); }
.cza-reveal.on { opacity: 1; transform: none; }
.cza-sweep { animation: cza-sweep 6s linear infinite; }
.cza-pillar { position: relative; overflow: hidden; transition: transform 0.3s ease, border-color 0.3s ease; }
.cza-pillar:hover { transform: translateY(-6px); border-color: #8A6425 !important; }
.cza-pillar .cza-num { transition: color 0.3s ease, transform 0.3s ease; }
.cza-pillar:hover .cza-num { color: rgba(232,166,61,0.22) !important; transform: scale(1.08); }
.cza-pillar .cza-icon { transition: transform 0.3s ease; }
.cza-pillar:hover .cza-icon { transform: rotate(-8deg) scale(1.12); }
.cza-cta { position: relative; overflow: hidden; }
.cza-cta::after { content: ""; position: absolute; top: 0; bottom: 0; width: 30%; background: linear-gradient(90deg, transparent, rgba(232,166,61,0.16), transparent); animation: cza-shine 4s ease-in-out infinite; pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  .cza-word, .cza-sweep, .cza-cta::after { animation: none !important; }
  .cza-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .cza-pillar, .cza-pillar .cza-num, .cza-pillar .cza-icon { transition: none !important; }
  .cza-pillar:hover, .cza-pillar:hover .cza-icon { transform: none !important; }
}
`;

function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return setOn(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setOn(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on] as const;
}

function CountUp({ value, run }: { value: number; run: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1400);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, run]);
  return <>{shown.toLocaleString("en")}</>;
}

export default function AboutView() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const data = useHomeData();
  const [storyRef, storyOn] = useInView<HTMLDivElement>();
  const [numRef, numOn] = useInView<HTMLDivElement>(0.3);
  const [pillRef, pillOn] = useInView<HTMLDivElement>(0.1);
  const [ctaRef, ctaOn] = useInView<HTMLDivElement>();

  const stats = [
    { icon: Users, label: tx.members, value: data.members },
    { icon: Swords, label: tx.matches, value: data.matches },
    { icon: Disc3, label: tx.replays, value: data.replays },
  ];

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{CSS}</style>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: C.line }}>
        <div aria-hidden="true" className="pointer-events-none absolute end-[-8%] top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 rounded-full md:block" style={{ border: `1px solid rgba(143,191,79,0.2)` }}>
          <div className="absolute inset-[20%] rounded-full" style={{ border: `1px solid ${C.line}` }} />
          <div className="absolute inset-[40%] rounded-full" style={{ border: `1px solid ${C.line}` }} />
          <div className="cza-sweep absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 300deg, rgba(143,191,79,0.22) 360deg)" }} />
          <Shield size={80} strokeWidth={1} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "rgba(232,166,61,0.35)" }} />
        </div>
        <div className={`${WRAP} relative pb-16 pt-16 md:pt-24`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Radio size={14} className="cz-live" aria-hidden="true" />
            {tx.eyebrow}
          </div>
          <h1 className="cz-display mt-3 uppercase leading-[0.9]" style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", fontWeight: 700 }} aria-label={tx.title}>
            {tx.title.split(" ").map((w, i) => (
              <span key={i} className="cza-word" style={{ animationDelay: `${0.1 + i * 0.12}s`, color: i === tx.title.split(" ").length - 1 ? C.amber : C.paper }} aria-hidden="true">
                {w}&nbsp;
              </span>
            ))}
          </h1>
          <p className="cza-word mt-5 max-w-xl text-lg md:text-xl" style={{ color: C.muted, animationDelay: "0.5s" }}>{tx.lead}</p>
        </div>
      </section>

      <div className={WRAP}>
        {/* ================= STORY ================= */}
        <div ref={storyRef} className={`cza-reveal mt-16 grid gap-8 lg:grid-cols-[1fr_1.4fr] ${storyOn ? "on" : ""}`}>
          <blockquote className="cz-display border-s-4 ps-6 text-3xl uppercase leading-tight md:text-4xl" style={{ borderColor: C.amber, fontWeight: 600 }}>
            {tx.lead}
          </blockquote>
          <div className="flex flex-col gap-5 text-base leading-relaxed md:text-lg" style={{ color: C.paper }}>
            {tx.story.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>

        {/* ================= NUMBERS ================= */}
        <section ref={numRef} className="mt-16">
          <h2 className="cz-display text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>{tx.numbers}</h2>
          <div className="mt-6 grid gap-px border sm:grid-cols-3" style={{ background: C.line, borderColor: C.line }}>
            {stats.map((s, i) => (
              <div key={s.label} className={`cza-reveal px-6 py-8 ${numOn ? "on" : ""}`} style={{ background: C.panel, transitionDelay: `${i * 0.12}s` }}>
                <s.icon size={22} style={{ color: C.amber }} aria-hidden="true" />
                <div className="cz-display mt-4 text-6xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>
                  {data.loaded ? <CountUp value={s.value} run={numOn} /> : "—"}
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= PILLARS ================= */}
        <section ref={pillRef} className="mt-16">
          <h2 className="cz-display text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>{tx.about}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tx.pillars.map(([title, desc], i) => {
              const Icon = ICONS[i];
              return (
                <div key={title} className={`cza-reveal ${pillOn ? "on" : ""}`} style={{ transitionDelay: `${i * 0.08}s` }}>
                  <div className="cza-pillar h-full border p-6" style={{ background: C.panel, borderColor: C.line }}>
                    <span className="cza-num cz-display pointer-events-none absolute -top-3 end-3 text-8xl leading-none" style={{ color: "rgba(58,64,41,0.45)", fontWeight: 700 }} aria-hidden="true">
                      0{i + 1}
                    </span>
                    <span className="cza-icon relative inline-flex h-12 w-12 items-center justify-center" style={{ border: `1px solid ${C.amberDim}`, color: C.amber }}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3 className="cz-display relative mt-5 text-2xl uppercase" style={{ fontWeight: 600 }}>{title}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= CTA ================= */}
        <div ref={ctaRef} className={`cza-reveal mt-16 ${ctaOn ? "on" : ""}`}>
          <div className="cza-cta flex flex-col gap-6 border p-6 md:flex-row md:items-center md:justify-between md:p-10" style={{ background: "linear-gradient(120deg, rgba(232,166,61,0.12), #12150E 50%)", borderColor: C.amberDim }}>
            <div>
              <span className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>{tx.recruiting}</span>
              <h3 className="cz-display mt-1 text-4xl uppercase md:text-5xl" style={{ fontWeight: 700 }}>{tx.joinTitle}</h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed" style={{ color: C.muted }}>{tx.joinText}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center gap-2 px-6 text-sm uppercase tracking-[0.12em]" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
                {tx.joinDiscord}
                <ArrowUpRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
              <Link href="/join" className="inline-flex min-h-[52px] items-center gap-2 border px-6 text-sm uppercase tracking-[0.12em] transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}>
                {tx.apply}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
