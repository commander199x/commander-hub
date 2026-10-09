"use client";

import Link from "next/link";
import { Radio, ExternalLink, BellRing, PlayCircle, Clock } from "lucide-react";
import { C, TIKTOK_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useLive, tiktokLiveUrl } from "@/lib/live";

const WRAP = "mx-auto max-w-[1100px] px-6 md:px-10";
const RED = "#DC2626";

const TEXT = {
  en: {
    onAir: "On air", offAir: "Off air", liveTitle: "We're live on TikTok", offTitle: "Not live right now",
    liveSub: "Jump in, say hi in the chat and watch Generals Zero Hour at its best.", offSub: "Follow us on TikTok so you get a notification the moment we go live.",
    watch: "Watch on TikTok", follow: "Follow on TikTok", since: "Live since", until: "Scheduled until", videos: "Watch past videos",
    note: "TikTok streams can only be watched on TikTok — the button opens the stream in the app or a new tab.",
  },
  ar: {
    onAir: "على الهواء", offAir: "خارج البث", liveTitle: "نحن في بث مباشر على تيك توك", offTitle: "لا يوجد بث الآن",
    liveSub: "انضم، سلّم في الدردشة، وشاهد جنرالات الساعة الصفر في أفضل حالاتها.", offSub: "تابعنا على تيك توك لتصلك إشعارات فور بدء البث.",
    watch: "شاهد على تيك توك", follow: "تابع على تيك توك", since: "مباشر منذ", until: "حتى", videos: "شاهد الفيديوهات السابقة",
    note: "لا يمكن مشاهدة بث تيك توك إلا على تيك توك — الزر يفتح البث في التطبيق أو في تبويب جديد.",
  },
};

export default function LiveView() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const { state, live } = useLive();
  const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit" }) : "");

  return (
    <main className="min-h-screen w-full pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{`
        @keyframes czlv-wave { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes czlv-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .czlv-wave { animation: czlv-wave 2.4s ease-out infinite; }
        .czlv-in { animation: czlv-in 0.6s cubic-bezier(0.2,0.7,0.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .czlv-wave, .czlv-in { animation: none !important; } }
      `}</style>
      <section className="relative overflow-hidden border-b" style={{ borderColor: C.line, background: live ? "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(220,38,38,0.18), transparent 65%)" : "radial-gradient(ellipse 60% 70% at 50% 40%, rgba(232,166,61,0.08), transparent 65%)" }}>
        <div className={`${WRAP} flex flex-col items-center pb-16 pt-16 text-center md:pt-24`}>
          <div className="relative flex h-40 w-40 items-center justify-center" aria-hidden="true">
            {live && [0, 0.8, 1.6].map((d) => <span key={d} className="czlv-wave absolute inset-0 rounded-full" style={{ border: `2px solid ${RED}`, animationDelay: `${d}s` }} />)}
            <span className="relative flex h-24 w-24 items-center justify-center rounded-full" style={{ background: live ? RED : C.panel, border: `2px solid ${live ? RED : C.lineStrong}`, boxShadow: live ? "0 0 50px rgba(220,38,38,0.6)" : "none" }}>
              <Radio size={40} style={{ color: live ? "#fff" : C.muted }} />
            </span>
          </div>
          <div className="czlv-in mt-6 inline-flex items-center gap-2 px-3 py-1 text-[11px] uppercase tracking-[0.3em]" style={{ background: live ? RED : "transparent", border: live ? "none" : `1px solid ${C.lineStrong}`, color: live ? "#fff" : C.muted, fontWeight: 800 }}>
            {live ? tx.onAir : tx.offAir}
          </div>
          <h1 className="czlv-in cz-display mt-4 text-5xl uppercase leading-none md:text-7xl" style={{ fontWeight: 700, animationDelay: "0.08s" }}>{live ? state?.title || tx.liveTitle : tx.offTitle}</h1>
          <p className="czlv-in mt-4 max-w-xl text-base leading-relaxed" style={{ color: C.muted, animationDelay: "0.14s" }}>{live ? tx.liveSub : tx.offSub}</p>
          {live && state?.started_at && (
            <p className="czlv-in mt-3 inline-flex items-center gap-2 text-sm" style={{ color: C.muted, animationDelay: "0.18s" }}>
              <Clock size={14} aria-hidden="true" />{tx.since} {time(state.started_at)}{state.until ? ` · ${tx.until} ${time(state.until)}` : ""}
            </p>
          )}
          <div className="czlv-in mt-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: "0.22s" }}>
            <a href={live ? tiktokLiveUrl() : TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[56px] items-center gap-2.5 px-8 text-sm uppercase tracking-[0.14em] transition-[filter] hover:brightness-110" style={{ background: live ? RED : C.amber, color: live ? "#fff" : C.void, fontWeight: 800, boxShadow: live ? "0 0 30px rgba(220,38,38,0.45)" : "none" }}>
              {live ? <PlayCircle size={20} aria-hidden="true" /> : <BellRing size={18} aria-hidden="true" />}
              {live ? tx.watch : tx.follow}
              <ExternalLink size={15} aria-hidden="true" />
            </a>
            <Link href="/videos" className="inline-flex min-h-[56px] items-center gap-2 border px-6 text-sm uppercase tracking-[0.14em] transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper }}>
              {tx.videos}
            </Link>
          </div>
          <p className="mt-6 max-w-md text-xs" style={{ color: C.muted }}>{tx.note}</p>
        </div>
      </section>
    </main>
  );
}
