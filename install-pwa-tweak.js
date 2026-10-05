#!/usr/bin/env node
// Commander Hub — Install card: shows after 8s, hidden on iPhone/Safari
//   node install-pwa-tweak.js          install
//   node install-pwa-tweak.js --undo   restore the previous files
// Works under any file name, e.g. node "install-pwa-tweak (1).js"
const fs = require('fs'), path = require('path');
const ROOT = process.cwd(), P = (r) => path.join(ROOT, r);
const FILES = [{"path": "components/PwaRegister.tsx", "src": "\"use client\";\n\nimport { useEffect, useState } from \"react\";\nimport { Download, X, Share, SquarePlus } from \"lucide-react\";\nimport { C } from \"@/lib/theme\";\nimport { useLanguage } from \"@/lib/i18n/LanguageContext\";\n\n// Registers the service worker (production only) and offers \"Install the app\"\n// — a real install button on Android/desktop, short instructions on iPhone/iPad.\n\ntype BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: \"accepted\" | \"dismissed\" }> };\n\nconst DISMISS_KEY = \"cz-install-dismissed-at\";\nconst DISMISS_DAYS = 14;\nconst SHOW_AFTER_MS = 8_000; // how long after the browser allows installing before our card appears\n// iPhone/iPad (Safari) can't show an install button, only \"Share → Add to Home Screen\" instructions.\n// Turned off for now — set to true to show those instructions again.\nconst SHOW_IOS_HINT = false;\n\nconst TEXT = {\n  en: { title: \"Install Commander\", text: \"Add the app to your home screen — opens full screen, one tap away.\", install: \"Install\", later: \"Not now\", close: \"Close\", ios1: \"Tap\", ios2: \"Share\", ios3: \"then\", ios4: \"Add to Home Screen\" },\n  ar: { title: \"ثبّت تطبيق كوماندر\", text: \"أضف التطبيق إلى شاشتك الرئيسية — يفتح بملء الشاشة وبضغطة واحدة.\", install: \"تثبيت\", later: \"ليس الآن\", close: \"إغلاق\", ios1: \"اضغط\", ios2: \"مشاركة\", ios3: \"ثم\", ios4: \"إضافة إلى الشاشة الرئيسية\" },\n};\n\nfunction recentlyDismissed() {\n  try {\n    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);\n    return at > 0 && Date.now() - at < DISMISS_DAYS * 86400000;\n  } catch {\n    return false;\n  }\n}\n\nexport default function PwaRegister() {\n  const { locale } = useLanguage();\n  const tx = TEXT[locale === \"ar\" ? \"ar\" : \"en\"];\n  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);\n  const [mode, setMode] = useState<\"none\" | \"prompt\" | \"ios\">(\"none\");\n\n  useEffect(() => {\n    if (process.env.NODE_ENV === \"production\" && \"serviceWorker\" in navigator) {\n      navigator.serviceWorker.register(\"/sw.js\").catch((err) => console.warn(\"[pwa] service worker failed:\", err));\n    }\n\n    const standalone =\n      window.matchMedia?.(\"(display-mode: standalone)\").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;\n    if (standalone || recentlyDismissed()) return;\n\n    const onPrompt = (e: Event) => {\n      e.preventDefault();\n      setDeferred(e as BeforeInstallPromptEvent);\n    };\n    window.addEventListener(\"beforeinstallprompt\", onPrompt);\n\n    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === \"MacIntel\" && navigator.maxTouchPoints > 1);\n    const timer = SHOW_IOS_HINT && isIos ? setTimeout(() => setMode((m) => (m === \"none\" ? \"ios\" : m)), SHOW_AFTER_MS) : undefined;\n    return () => {\n      window.removeEventListener(\"beforeinstallprompt\", onPrompt);\n      if (timer) clearTimeout(timer);\n    };\n  }, []);\n\n  // Android/desktop: show our card a little while after the browser says the app is installable\n  useEffect(() => {\n    if (!deferred) return;\n    const timer = setTimeout(() => setMode(\"prompt\"), SHOW_AFTER_MS);\n    return () => clearTimeout(timer);\n  }, [deferred]);\n\n  function dismiss() {\n    try {\n      localStorage.setItem(DISMISS_KEY, String(Date.now()));\n    } catch {}\n    setMode(\"none\");\n  }\n\n  async function install() {\n    if (!deferred) return;\n    await deferred.prompt();\n    await deferred.userChoice.catch(() => null);\n    setDeferred(null);\n    setMode(\"none\");\n  }\n\n  if (mode === \"none\") return null;\n\n  return (\n    <div\n      role=\"dialog\"\n      aria-label={tx.title}\n      className=\"fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md border p-4 sm:inset-x-auto sm:end-6 sm:bottom-6\"\n      style={{ background: \"rgba(18,21,14,0.97)\", borderColor: C.amberDim, boxShadow: \"0 18px 50px rgba(0,0,0,0.55)\", animation: \"czpwa-in 0.4s cubic-bezier(0.2,0.7,0.2,1) both\" }}\n    >\n      <style>{`@keyframes czpwa-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { [aria-label=\"${tx.title}\"] { animation: none !important; } }`}</style>\n      <div className=\"flex items-start gap-3\">\n        {/* eslint-disable-next-line @next/next/no-img-element */}\n        <img src=\"/icons/icon-192.png\" alt=\"\" width={48} height={48} className=\"shrink-0\" />\n        <div className=\"min-w-0 flex-1\">\n          <div className=\"cz-display text-lg uppercase leading-tight\" style={{ color: C.paper, fontWeight: 700 }}>{tx.title}</div>\n          {mode === \"prompt\" ? (\n            <p className=\"mt-1 text-sm\" style={{ color: C.muted }}>{tx.text}</p>\n          ) : (\n            <p className=\"mt-1 flex flex-wrap items-center gap-1 text-sm\" style={{ color: C.muted }}>\n              {tx.ios1} <Share size={15} style={{ color: C.amber }} aria-hidden=\"true\" /> <b style={{ color: C.paper }}>{tx.ios2}</b> {tx.ios3}{\" \"}\n              <SquarePlus size={15} style={{ color: C.amber }} aria-hidden=\"true\" /> <b style={{ color: C.paper }}>{tx.ios4}</b>\n            </p>\n          )}\n        </div>\n        <button onClick={dismiss} aria-label={tx.close} className=\"inline-flex h-9 w-9 shrink-0 items-center justify-center\" style={{ color: C.muted }}>\n          <X size={17} aria-hidden=\"true\" />\n        </button>\n      </div>\n      {mode === \"prompt\" && (\n        <div className=\"mt-4 flex gap-2\">\n          <button onClick={install} className=\"inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 text-xs uppercase tracking-[0.14em]\" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>\n            <Download size={15} aria-hidden=\"true\" />\n            {tx.install}\n          </button>\n          <button onClick={dismiss} className=\"inline-flex min-h-[44px] items-center justify-center border px-4 text-xs uppercase tracking-[0.14em]\" style={{ borderColor: C.lineStrong, color: C.muted }}>\n            {tx.later}\n          </button>\n        </div>\n      )}\n    </div>\n  );\n}\n", "sig": "export default function PwaRegister", "drop": [], "skipIf": []}];
const SUFFIX = '.pwatweakbak', NEWMARK = '.pwatweaknew';
const g = (s) => '\x1b[32m' + s + '\x1b[0m', r = (s) => '\x1b[31m' + s + '\x1b[0m';
if (!fs.existsSync(P('package.json'))) { console.error(r('Run this from the commander-hub folder (next to package.json).')); process.exit(1); }

if (process.argv.includes('--undo')) {
  for (const f of FILES) {
    if (fs.existsSync(P(f.path) + SUFFIX)) { fs.copyFileSync(P(f.path) + SUFFIX, P(f.path)); fs.unlinkSync(P(f.path) + SUFFIX); console.log(g('✔') + ' restored ' + f.path); }
    else if (fs.existsSync(P(f.path) + NEWMARK)) { fs.unlinkSync(P(f.path)); fs.unlinkSync(P(f.path) + NEWMARK); console.log(g('✔') + ' removed ' + f.path); }
  }
  console.log('\nClean restart to see the previous version.');
  process.exit(0);
}

// 1) check everything before writing anything
const fns = (s) => [...s.matchAll(/(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g)].map((m) => m[1]);
const tables = (s) => [...s.matchAll(/\.from\(\s*["'`]([A-Za-z0-9_]+)["'`]/g)].map((m) => m[1]);
const imports = (s) => [...s.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
const allNew = FILES.map((f) => f.src).join('\n');
const newSets = { fns: new Set(fns(allNew)), tables: new Set(tables(allNew)), imports: new Set(imports(allNew)) };
const problems = [];
// Files that would clash with something you already have are skipped, not forced
for (const f of FILES) {
  const clash = (f.skipIf || []).find((p) => fs.existsSync(P(p)));
  if (clash) { f.skip = clash; }
}
for (const f of FILES) {
  if (f.skip) continue;
  if (!f.sig) continue; // brand-new file
  if (!fs.existsSync(P(f.path))) { problems.push(f.path + ' not found'); continue; }
  const cur = fs.readFileSync(P(f.path), 'utf8');
  if (f.enc !== 'base64' && cur === f.src) continue;
  if (!cur.includes(f.sig)) { problems.push(f.path + ' has unexpected contents (missing "' + f.sig + '")'); continue; }
  for (const x of fns(cur)) if (!newSets.fns.has(x)) problems.push(f.path + ': function ' + x + ' would be lost');
  for (const x of tables(cur)) if (!newSets.tables.has(x)) problems.push(f.path + ': table "' + x + '" would no longer be used');
  for (const x of imports(cur)) if (!newSets.imports.has(x) && !(f.drop || []).includes(x)) problems.push(f.path + ': import "' + x + '" would be lost');
}
if (problems.length) {
  console.error(r('Nothing was changed:'));
  problems.forEach((p) => console.error('  - ' + p));
  console.error('Send this list to Claude.');
  process.exit(1);
}

// 2) back up and write
let ok = true;
for (const f of FILES) {
  if (f.skip) { console.log('\x1b[33m!\x1b[0m skipped ' + f.path + ' (you already have ' + f.skip + ')'); continue; }
  fs.mkdirSync(path.dirname(P(f.path)), { recursive: true });
  const content = f.enc === 'base64' ? Buffer.from(f.src, 'base64') : Buffer.from(f.src, 'utf8');
  const same = (p) => fs.existsSync(p) && Buffer.compare(fs.readFileSync(p), content) === 0;
  const existed = fs.existsSync(P(f.path));
  if (existed && !fs.existsSync(P(f.path) + SUFFIX) && !fs.existsSync(P(f.path) + NEWMARK) && !same(P(f.path))) fs.copyFileSync(P(f.path), P(f.path) + SUFFIX);
  if (!existed) fs.writeFileSync(P(f.path) + NEWMARK, '');
  fs.writeFileSync(P(f.path), content);
  const good = same(P(f.path));
  ok = ok && good;
  console.log((good ? g('✔') : r('✘')) + ' ' + f.path + (existed ? '' : '  (new)'));
}
if (!ok) { console.error(r('\nA file did not verify. Run with --undo.')); process.exit(1); }
console.log(g('\nInstalled.') + ' Now do a clean restart:');
console.log('  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force');
console.log('  Remove-Item -Recurse -Force .next');
console.log('  npm run dev');
console.log('Then push and test on your Android phone. Undo: node install-pwa-tweak.js --undo\n');
