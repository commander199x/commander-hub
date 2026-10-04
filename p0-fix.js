#!/usr/bin/env node
/*
 * Commander Hub — P0 design-system pass (round 1)
 *
 * Run from the project root (next to package.json):
 *   node p0-fix.js            -> applies safe global fixes + writes p0-report.txt
 *   node p0-fix.js --dry-run  -> only writes the report, changes nothing
 *
 * SAFE FIXES (backed up as *.p0bak before any write, idempotent):
 *   1. Global amber :focus-visible ring (beats inline outline:none)
 *   2. prefers-reduced-motion for ALL animations/transitions
 *   3. Adds C.danger / C.dangerHover tokens to lib/theme.ts
 *
 * AUDIT ONLY (listed in p0-report.txt, nothing changed):
 *   opacity on C.muted, hardcoded hex, off-palette reds, icon-only buttons
 *   without aria-label, emoji, removed outlines, control borders.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const TOKENS = {
  void: '#0A0C08', panel: '#12150E', panelHover: '#171B10', line: '#272B1E',
  lineStrong: '#3A4029', amber: '#E8A63D', amberDim: '#8A6425', radar: '#8FBF4F',
  paper: '#EDEAE0', muted: '#83866F', danger: '#DC2626', dangerHover: '#B91C1C',
};
const HEX_TO_TOKEN = Object.fromEntries(Object.entries(TOKENS).map(([k, v]) => [v.toUpperCase(), k]));
const REDS = ['#EF4444', '#F87171', '#B91C1C', '#E53E3E', '#FF0000', '#F00', '#FF4444', '#FC8181', '#C53030', '#991B1B', '#DC2626', '#FF6B6B', '#E74C3C'];

const log = (...a) => console.log(...a);
const ok = (m) => log('  \x1b[32m✔\x1b[0m ' + m);
const warn = (m) => log('  \x1b[33m!\x1b[0m ' + m);
const changes = [];
const manual = [];

// ---------------------------------------------------------------- sanity
const pkgPath = path.join(ROOT, 'package.json');
if (!fs.existsSync(pkgPath) || !/"next"/.test(fs.readFileSync(pkgPath, 'utf8'))) {
  console.error('\x1b[31mRun this from the commander-hub folder (next to package.json).\x1b[0m');
  process.exit(1);
}
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
function write(rel, content) {
  const abs = path.join(ROOT, rel);
  if (DRY) return;
  if (fs.existsSync(abs) && !fs.existsSync(abs + '.p0bak')) fs.copyFileSync(abs, abs + '.p0bak');
  fs.writeFileSync(abs, content, 'utf8');
}

log(`\nCommander Hub P0 pass ${DRY ? '(DRY RUN — no files changed)' : ''}\n`);

// ---------------------------------------------------------------- fix 1+2: global CSS
const START = '/* === commander-p0 start (managed by p0-fix.js) === */';
const END = '/* === commander-p0 end === */';
const P0_CSS = `${START}
/* Visible keyboard focus everywhere. !important so inline outline:none can't hide it. */
:focus-visible {
  outline: 2px solid ${TOKENS.amber} !important;
  outline-offset: 2px !important;
}
/* No ring on mouse click, only on keyboard navigation. */
:focus:not(:focus-visible) {
  outline: none;
}
/* Respect the OS "reduce motion" setting for every animation on the site. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
${END}`;

const layoutRel = ['app/layout.tsx', 'src/app/layout.tsx', 'app/layout.jsx'].find(exists);
let cssRel = ['app/globals.css', 'src/app/globals.css', 'styles/globals.css'].find(exists);
if (!cssRel && layoutRel) {
  const m = read(layoutRel).match(/import\s+['"](\.{1,2}\/[^'"]+\.css)['"]/);
  if (m) cssRel = path.posix.join(path.posix.dirname(layoutRel), m[1]);
}
if (cssRel) {
  let css = read(cssRel);
  if (css.includes(START)) {
    css = css.replace(new RegExp(escapeRe(START) + '[\\s\\S]*?' + escapeRe(END)), P0_CSS);
    changes.push(`${cssRel}: refreshed focus ring + reduced-motion block`);
  } else {
    css = css.replace(/\s*$/, '\n\n') + P0_CSS + '\n';
    changes.push(`${cssRel}: added focus ring + reduced-motion block`);
  }
  write(cssRel, css);
  ok(changes[changes.length - 1]);
} else if (layoutRel) {
  const newCss = path.posix.join(path.posix.dirname(layoutRel), 'commander-p0.css');
  write(newCss, P0_CSS + '\n');
  let layout = read(layoutRel);
  if (!layout.includes('commander-p0.css')) {
    const imports = [...layout.matchAll(/^import[^\n]*\n/gm)];
    const at = imports.length ? imports[imports.length - 1].index + imports[imports.length - 1][0].length : 0;
    layout = layout.slice(0, at) + "import './commander-p0.css';\n" + layout.slice(at);
    write(layoutRel, layout);
  }
  changes.push(`created ${newCss} and imported it in ${layoutRel}`);
  ok(changes[changes.length - 1]);
} else {
  manual.push('Could not find globals.css or app/layout.tsx — add the focus/reduced-motion CSS manually.');
  warn(manual[manual.length - 1]);
}

// ---------------------------------------------------------------- fix 3: danger tokens
const themeRel = ['lib/theme.ts', 'src/lib/theme.ts'].find(exists);
if (!themeRel) {
  manual.push('lib/theme.ts not found — add danger: "#DC2626", dangerHover: "#B91C1C" to C by hand.');
  warn(manual[manual.length - 1]);
} else {
  let t = read(themeRel);
  const decl = t.match(/const\s+C\s*(:\s*[^=]+)?=\s*\{/);
  if (/\bdanger\s*:/.test(t)) {
    ok(`${themeRel}: danger token already present`);
  } else if (!decl) {
    manual.push(`${themeRel}: couldn't find "const C = {" — add danger/dangerHover by hand.`);
    warn(manual[manual.length - 1]);
  } else if (decl[1]) {
    manual.push(`${themeRel}: C has a type annotation (${decl[1].trim()}) — add danger/dangerHover to that type AND the object by hand.`);
    warn(manual[manual.length - 1]);
  } else {
    const m = t.match(/^([ \t]*)muted\s*:\s*(['"])#83866F\2/im);
    if (!m) {
      manual.push(`${themeRel}: "muted" line not found — add danger/dangerHover by hand.`);
      warn(manual[manual.length - 1]);
    } else {
      const [line, indent, q] = m;
      let at = m.index + line.length;
      const rest = t.slice(at);
      const comma = rest.match(/^\s*,/);
      let insert;
      if (comma) { at += comma[0].length; insert = ''; } else { insert = ','; }
      insert += `\n${indent}danger: ${q}${TOKENS.danger}${q},\n${indent}dangerHover: ${q}${TOKENS.dangerHover}${q},`;
      t = t.slice(0, at) + insert + t.slice(at);
      write(themeRel, t);
      changes.push(`${themeRel}: added C.danger (#DC2626) and C.dangerHover (#B91C1C)`);
      ok(changes[changes.length - 1]);
    }
  }
}

// ---------------------------------------------------------------- audit
log('\nScanning code…');
const SCAN_DIRS = ['app', 'components', 'lib', 'src'].filter(exists);
const SKIP = new Set(['node_modules', '.next', '.git', 'public']);
const files = [];
for (const d of SCAN_DIRS) (function walk(dir) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) walk(rel);
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) files.push(rel);
  }
})(d);

const F = { muted: [], hex: [], red: [], iconBtn: [], maybeBtn: [], emoji: [], outline: [], border: [] };
const isThemeFile = (f) => /(^|\/)lib\/theme\.ts$/.test(f);
const EMOJI = /\p{Extended_Pictographic}/u;
const EMOJI_G = /\p{Extended_Pictographic}\uFE0F?/gu;
const EMOJI_IGNORE = /^[\u00A9\u00AE\u2122\u2190-\u21FF]$/;

for (const f of files) {
  const src = read(f);
  const lines = src.split(/\r?\n/);
  lines.forEach((ln, i) => {
    const at = `${f}:${i + 1}`;
    const trimmed = ln.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    // 1. opacity / alpha on muted
    const near = lines.slice(Math.max(0, i - 2), i + 3).join(' ');
    if (/C\.muted\}?[0-9a-fA-F]{2}\b|C\.muted\s*\+\s*['"`][0-9a-fA-F]{2}|#83866F[0-9a-fA-F]{2}/i.test(ln) ||
        (/C\.muted|#83866F/i.test(ln) && /opacity\s*[:=]\s*['"{]?\s*0?\.\d/.test(near))) {
      F.muted.push(`${at}  ${trimmed.slice(0, 110)}`);
    }

    // 2/3. hex colours
    if (!isThemeFile(f)) {
      for (const hm of ln.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
        const hex = hm[0].toUpperCase();
        if (/^#\d{3}$/.test(hex) && /\[#|issue|#\d/.test(ln) && !/color|bg|border|fill|stroke/i.test(ln)) continue;
        const base = hex.length === 9 ? hex.slice(0, 7) : hex;
        if (REDS.includes(base) || /^#(F|E|D|C|B)[0-9A-F]{1}[0-4][0-9A-F][0-4][0-9A-F]$/.test(base) && parseInt(base.slice(1, 3), 16) > 0xB0 && parseInt(base.slice(3, 5), 16) < 0x70) {
          F.red.push(`${at}  ${hex} → C.danger`);
        } else {
          const tok = HEX_TO_TOKEN[base];
          F.hex.push(`${at}  ${hex}${tok ? ` → C.${tok}${hex.length === 9 ? ' (+alpha)' : ''}` : '  (no token)'}`);
        }
      }
      if (/(['"`])(red|crimson|tomato)\1/.test(ln) && /color|background|border/i.test(ln)) F.red.push(`${at}  named red → C.danger`);
    }

    // 4. emoji
    if (EMOJI.test(ln)) {
      const em = [...ln.matchAll(EMOJI_G)].map((x) => x[0]).filter((c) => !EMOJI_IGNORE.test(c.replace('\uFE0F', '')));
      if (em.length) F.emoji.push(`${at}  ${[...new Set(em)].join(' ')}   ${trimmed.slice(0, 80)}`);
    }

    // 5. outline removed
    if (/outline\s*:\s*['"]?(none|0)\b|\boutline-none\b|outlineStyle\s*:\s*['"]none/.test(ln)) {
      F.outline.push(`${at}  ${trimmed.slice(0, 100)}`);
    }

    // 6. control borders not using amberDim
    if (/<(input|select|textarea)\b/.test(ln)) {
      const block = lines.slice(i, i + 8).join(' ');
      const b = block.match(/border(Color)?\s*:\s*[`'"]?[^,}]*?(C\.(\w+)|#[0-9a-fA-F]{6})/);
      if (b && !/amberDim|#8A6425/i.test(b[0])) F.border.push(`${at}  ${b[0].slice(0, 70)} → C.amberDim`);
    }
  });

  // 7. icon-only buttons
  if (/\.(tsx|jsx)$/.test(f)) {
    let idx = 0;
    while ((idx = src.indexOf('<button', idx)) !== -1) {
      const tagEnd = findTagEnd(src, idx + 7);
      if (tagEnd === -1) break;
      const attrs = src.slice(idx, tagEnd);
      const selfClosing = attrs.endsWith('/');
      const close = selfClosing ? tagEnd : src.indexOf('</button>', tagEnd);
      const inner = selfClosing || close === -1 ? '' : src.slice(tagEnd + 1, close);
      const lineNo = src.slice(0, idx).split('\n').length;
      if (!/aria-label|aria-labelledby|\btitle=/.test(attrs)) {
        const stripped = stripJsxTags(inner).replace(/\s+/g, '');
        const noEmoji = stripped.replace(EMOJI_G, '').replace(/[×✕✖✓✔+\-–—<>‹›«»…·•|/\\]/g, '');
        if (noEmoji === '') F.iconBtn.push(`${f}:${lineNo}  icon-only <button> without aria-label`);
        else if (/^(\{[^}]*\})+$/.test(noEmoji) && !/\bt\(|text|label|name|title|children/i.test(noEmoji))
          F.maybeBtn.push(`${f}:${lineNo}  <button> shows only ${noEmoji.slice(0, 50)} — check it has readable text`);
      }
      idx = close === -1 ? tagEnd : close + 1;
    }
  }
}

function findTagEnd(s, i) {
  let depth = 0, q = null;
  for (; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q && s[i - 1] !== '\\') q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return s[i - 1] === '/' ? i : i;
  }
  return -1;
}
function stripJsxTags(s) {
  let out = '', i = 0;
  while (i < s.length) {
    if (s[i] === '<' && /[A-Za-z/>]/.test(s[i + 1] || '')) { const e = findTagEnd(s, i + 1); if (e === -1) break; i = e + 1; continue; }
    out += s[i++];
  }
  return out;
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------------------------------------------------------------- report
const SECTIONS = [
  ['muted', 'C.muted with opacity/alpha (P0: remove — use full-strength C.muted)'],
  ['red', 'Off-palette reds (P0: use C.danger / C.dangerHover)'],
  ['iconBtn', 'Icon-only buttons missing aria-label (P0)'],
  ['maybeBtn', 'Buttons that may lack readable text (check)'],
  ['outline', 'Focus outline removed (global ring now overrides, but clean these up)'],
  ['border', 'Form controls not using C.amberDim borders (P0)'],
  ['emoji', 'Emoji in UI (next: swap for Lucide icons)'],
  ['hex', 'Hardcoded hex colours outside lib/theme.ts (next: swap for tokens)'],
];
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const hasLucide = !!({ ...pkg.dependencies, ...pkg.devDependencies })['lucide-react'];

let rep = `COMMANDER HUB — P0 REPORT  (${new Date().toISOString()})${DRY ? '  [DRY RUN]' : ''}\n`;
rep += `Scanned ${files.length} files in: ${SCAN_DIRS.join(', ')}\nlucide-react installed: ${hasLucide ? 'yes' : 'NO'}\n\n`;
rep += `APPLIED:\n${changes.length ? changes.map((c) => '  - ' + c).join('\n') : '  (none)'}\n`;
if (manual.length) rep += `\nNEEDS MANUAL ACTION:\n${manual.map((c) => '  - ' + c).join('\n')}\n`;
rep += '\nSUMMARY:\n' + SECTIONS.map(([k, t]) => `  ${String(F[k].length).padStart(4)}  ${t}`).join('\n') + '\n';
for (const [k, t] of SECTIONS) {
  if (!F[k].length) continue;
  rep += `\n\n=== ${t} — ${F[k].length} ===\n` + F[k].join('\n');
}
const filesWithMost = {};
for (const k of Object.keys(F)) for (const e of F[k]) { const file = e.split(':')[0]; filesWithMost[file] = (filesWithMost[file] || 0) + 1; }
rep += '\n\n=== Files with the most findings ===\n' + Object.entries(filesWithMost).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([f, n]) => `  ${String(n).padStart(4)}  ${f}`).join('\n') + '\n';

fs.writeFileSync(path.join(ROOT, 'p0-report.txt'), rep, 'utf8');

log('\nSummary:');
for (const [k, t] of SECTIONS) log(`  ${String(F[k].length).padStart(4)}  ${t}`);
log(`\nFull list written to \x1b[36mp0-report.txt\x1b[0m`);
if (!DRY && changes.length) log('Backups saved next to changed files as *.p0bak');
log('\nNext: full clean restart, check localhost:3000, then upload p0-report.txt in chat.\n');
