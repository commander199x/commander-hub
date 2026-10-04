#!/usr/bin/env node
/*
 * Commander Hub — homepage v2 (lower sections)
 *   node install-home-v2.js          install
 *   node install-home-v2.js --undo   restore the previous app/page.tsx
 * Run from the project root (next to package.json).
 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const P = (r) => path.join(ROOT, r);
const PAGE = 'app/page.tsx';
const BAK = 'app/page.tsx.home2bak';
const TEMPLATE = "\"use client\";\n\nimport Link from \"next/link\";\nimport type { ReactNode } from \"react\";\nimport { FolderOpen, Video, Info, Mail, ArrowUpRight, Heart } from \"lucide-react\";\nimport { C } from \"@/lib/theme\";\nimport LiveBanner from \"@/components/LiveBanner\";\nimport NewsFeed from \"@/components/NewsFeed\";\nimport YouTubeSection from \"@/components/YouTubeSection\";\nimport FadeIn from \"@/components/FadeIn\";\nimport CinematicHero from \"@/components/home/CinematicHero\";\nimport FactsStrip from \"@/components/home/FactsStrip\";\nimport WaysIn from \"@/components/home/WaysIn\";\nimport FrontLine from \"@/components/home/FrontLine\";\nimport JoinBanner from \"@/components/home/JoinBanner\";\nimport { useHomeData } from \"@/components/home/useHomeData\";\nimport { useLanguage } from \"@/lib/i18n/LanguageContext\";\nimport { HOME_TEXT } from \"@/components/home/homeText\";\nimport \"@/app/animations.css\";\n\n// One container for every section below the hero, matched to the cinematic\n// sections (detected by install-home-v2.js) so all left edges line up.\nconst WRAP = \"__WRAP__\";\n\n// New copy for this layout. Arabic needs a native review.\nconst LOCAL = {\n  en: { latestEyebrow: \"Clan news\", moreTitle: \"More of the hub\" },\n  ar: { latestEyebrow: \"أخبار الكلان\", moreTitle: \"المزيد في الموقع\" },\n} as const;\n\nfunction SectionHead({\n  eyebrow,\n  title,\n  action,\n}: {\n  eyebrow: string;\n  title: string;\n  action?: ReactNode;\n}) {\n  return (\n    <div className=\"mb-8 flex flex-wrap items-end justify-between gap-4\">\n      <div>\n        <div className=\"text-[11px] uppercase tracking-[0.24em]\" style={{ color: C.radar }}>\n          {eyebrow}\n        </div>\n        <h2\n          className=\"cz-display mt-2 text-3xl uppercase leading-none md:text-5xl\"\n          style={{ color: C.paper, fontWeight: 600 }}\n        >\n          {title}\n        </h2>\n      </div>\n      {action}\n    </div>\n  );\n}\n\nexport default function Home() {\n  const { t, locale } = useLanguage();\n  const lang = locale === \"ar\" ? \"ar\" : \"en\";\n  const text = HOME_TEXT[lang];\n  const local = LOCAL[lang];\n  const data = useHomeData(); // one shared fetch for the hero, the radar and the podium\n\n  // The ladder, replays and tournaments are covered by \"Three ways in\";\n  // these are lighter secondary links, so they get a quiet strip, not a second card grid.\n  const MORE = [\n    { icon: FolderOpen, title: t(\"home.opsDownloadsTitle\"), description: t(\"home.opsDownloadsDesc\"), href: \"/downloads\" },\n    { icon: Video, title: t(\"home.opsVideosTitle\"), description: t(\"home.opsVideosDesc\"), href: \"/videos\" },\n    { icon: Info, title: t(\"home.opsAboutTitle\"), description: t(\"home.opsAboutDesc\"), href: \"/about\" },\n    { icon: Mail, title: t(\"home.opsContactTitle\"), description: t(\"home.opsContactDesc\"), href: \"/contact\" },\n  ];\n\n  return (\n    <main className=\"min-h-screen w-full\" style={{ background: C.void }}>\n      <CinematicHero data={data} />\n      <FactsStrip />\n\n      <div className={WRAP}>\n        <FadeIn>\n          <div className=\"mt-10 empty:hidden\">\n            <LiveBanner />\n          </div>\n        </FadeIn>\n      </div>\n\n      <WaysIn />\n      <FrontLine data={data} />\n\n      <div className={WRAP}>\n        {/* LATEST */}\n        <section className=\"py-14 md:py-20\">\n          <FadeIn>\n            <SectionHead\n              eyebrow={local.latestEyebrow}\n              title={t(\"home.latest\")}\n              action={\n                <Link\n                  href=\"/news\"\n                  className=\"inline-flex items-center gap-2 py-2 text-sm uppercase tracking-widest\"\n                  style={{ color: C.amber }}\n                >\n                  {t(\"home.viewAll\")}\n                  <ArrowUpRight size={16} className=\"rtl:-scale-x-100\" aria-hidden=\"true\" />\n                </Link>\n              }\n            />\n            <NewsFeed limit={3} />\n          </FadeIn>\n        </section>\n\n        {/* YOUTUBE (has its own heading) */}\n        <section className=\"py-14 md:py-20\" style={{ borderTop: `1px solid ${C.line}` }}>\n          <FadeIn>\n            <YouTubeSection />\n          </FadeIn>\n        </section>\n\n        {/* MORE — one quiet strip; 1px gaps over a line-coloured background draw the dividers (RTL-safe) */}\n        <section className=\"py-14 md:py-20\" style={{ borderTop: `1px solid ${C.line}` }}>\n          <FadeIn>\n            <SectionHead eyebrow={text.exploreEyebrow} title={local.moreTitle} />\n            <nav\n              aria-label={local.moreTitle}\n              className=\"grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4\"\n              style={{ background: C.line, border: `1px solid ${C.line}` }}\n            >\n              {MORE.map((item) => {\n                const Icon = item.icon;\n                return (\n                  <Link\n                    key={item.href}\n                    href={item.href}\n                    className=\"group flex items-start gap-4 p-6 transition-colors\"\n                    style={{ background: C.panel }}\n                    onMouseEnter={(e) => (e.currentTarget.style.background = C.panelHover)}\n                    onMouseLeave={(e) => (e.currentTarget.style.background = C.panel)}\n                  >\n                    <Icon size={22} className=\"mt-0.5 shrink-0\" style={{ color: C.amber }} aria-hidden=\"true\" />\n                    <div className=\"min-w-0 flex-1\">\n                      <div className=\"flex items-center justify-between gap-2\">\n                        <h3 className=\"text-base\" style={{ color: C.paper, fontWeight: 500 }}>\n                          {item.title}\n                        </h3>\n                        <ArrowUpRight\n                          size={16}\n                          aria-hidden=\"true\"\n                          className=\"shrink-0 transition-transform group-hover:-translate-y-0.5 rtl:-scale-x-100\"\n                          style={{ color: C.amberDim }}\n                        />\n                      </div>\n                      <p className=\"mt-1.5 text-sm leading-relaxed\" style={{ color: C.muted }}>\n                        {item.description}\n                      </p>\n                    </div>\n                  </Link>\n                );\n              })}\n            </nav>\n          </FadeIn>\n        </section>\n\n        {/* SUPPORT — amber like every other action; green stays reserved for \"live\" */}\n        <section className=\"pb-16 md:pb-24\">\n          <FadeIn>\n            <Link\n              href=\"/donate\"\n              className=\"group flex flex-col gap-6 p-6 transition-colors md:flex-row md:items-center md:justify-between md:p-8\"\n              style={{ background: C.panel, border: `1px solid ${C.line}` }}\n              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.amberDim)}\n              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}\n            >\n              <div className=\"flex items-start gap-4\">\n                <Heart size={24} className=\"mt-1 shrink-0\" style={{ color: C.amber }} aria-hidden=\"true\" />\n                <div>\n                  <div className=\"text-[11px] uppercase tracking-[0.24em]\" style={{ color: C.muted }}>\n                    {t(\"home.supportUs\")}\n                  </div>\n                  <h3\n                    className=\"cz-display mt-1 text-2xl uppercase md:text-3xl\"\n                    style={{ color: C.paper, fontWeight: 600 }}\n                  >\n                    {t(\"home.donateTitle\")}\n                  </h3>\n                  <p className=\"mt-2 max-w-xl text-sm leading-relaxed\" style={{ color: C.muted }}>\n                    {t(\"home.donateDesc\")}\n                  </p>\n                </div>\n              </div>\n              <span\n                className=\"inline-flex shrink-0 items-center justify-center gap-2 border border-[#E8A63D] px-6 py-3 text-sm uppercase tracking-widest text-[#E8A63D] transition-colors group-hover:bg-[#E8A63D] group-hover:text-[#0A0C08]\"\n              >\n                {t(\"home.donate\")}\n                <ArrowUpRight size={16} className=\"rtl:-scale-x-100\" aria-hidden=\"true\" />\n              </span>\n            </Link>\n          </FadeIn>\n        </section>\n      </div>\n\n      <JoinBanner />\n    </main>\n  );\n}\n";
const FALLBACK = 'mx-auto max-w-6xl px-6 md:px-10';

if (!fs.existsSync(P('package.json'))) { console.error('Run this next to package.json.'); process.exit(1); }

if (process.argv.includes('--undo')) {
  if (!fs.existsSync(P(BAK))) { console.error('No backup found (' + BAK + ').'); process.exit(1); }
  fs.copyFileSync(P(BAK), P(PAGE));
  console.log('Restored ' + PAGE + ' from ' + BAK);
  process.exit(0);
}

const cur = fs.readFileSync(P(PAGE), 'utf8');
if (!cur.includes('CinematicHero') && !process.argv.includes('--force')) {
  console.error('app/page.tsx is not the Cinematic homepage. Aborting (use --force to override).');
  process.exit(1);
}

// ---- detect the container the cinematic sections use
function detectWrap() {
  const read = (r) => (fs.existsSync(P(r)) ? fs.readFileSync(P(r), 'utf8') : '');
  const sources = ['components/home/WaysIn.tsx', 'components/home/FrontLine.tsx', 'components/home/JoinBanner.tsx'].map(read).join('\n');
  const css = read('app/cinematic.css');
  // a) a CSS class with max-width + auto margins, used in WaysIn/FrontLine
  const containerClasses = new Set();
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim(), body = m[2];
    if (/max-width\s*:/.test(body) && /margin(-inline)?\s*:[^;]*auto/.test(body)) {
      for (const c of sel.matchAll(/^\.([A-Za-z0-9_-]+)$/gm)) containerClasses.add(c[1]);
      const single = sel.match(/^\.([A-Za-z0-9_-]+)$/); if (single) containerClasses.add(single[1]);
    }
  }
  for (const m of sources.matchAll(/className=["'`{]+([^"'`}]+)/g)) {
    for (const tok of m[1].split(/\s+/)) if (containerClasses.has(tok)) return { wrap: tok, how: 'CSS class .' + tok + ' from app/cinematic.css' };
  }
  // b) Tailwind container classes in WaysIn/FrontLine
  for (const m of sources.matchAll(/className=["'`]([^"'`]+)["'`]/g)) {
    const toks = m[1].split(/\s+/);
    if (toks.includes('mx-auto') && toks.some((x) => /^max-w-/.test(x))) {
      const keep = toks.filter((x) => /^(mx-auto|w-full|max-w-.+|(sm:|md:|lg:|xl:)?px-.+)$/.test(x));
      return { wrap: keep.join(' '), how: 'Tailwind classes from the cinematic components' };
    }
  }
  return null;
}
const found = detectWrap();
const WRAP = found ? found.wrap : FALLBACK;

const out = TEMPLATE.replace('__WRAP__', WRAP);
if (!fs.existsSync(P(BAK))) fs.copyFileSync(P(PAGE), P(BAK));
fs.writeFileSync(P(PAGE), out, 'utf8');

const check = fs.readFileSync(P(PAGE), 'utf8');
const okWrite = check === out && check.includes('SectionHead') && !check.includes('__WRAP__');
console.log('\n' + (okWrite ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✘\x1b[0m') + ' ' + PAGE + ' written and verified');
console.log('  backup: ' + BAK + '  (undo: node install-home-v2.js --undo)');
if (found) console.log('\x1b[32m✔\x1b[0m container matched to cinematic sections: "' + WRAP + '"  [' + found.how + ']');
else console.log('\x1b[33m!\x1b[0m could not detect the cinematic container; used "' + FALLBACK + '".\n  Edges may still not line up: send me components/home/WaysIn.tsx and app/cinematic.css.');
console.log('\nNow: stop node, delete .next, npm run dev, check localhost:3000 (EN and AR).\n');
if (!okWrite) process.exit(1);
