# Commander — Design System (MASTER)

> Source of truth for how commander.host looks and behaves.
> Place at: `design-system/commander/MASTER.md`
> When building any page: read this first. A page-specific override in
> `design-system/commander/pages/<page>.md` wins over this file.

Built from: your real `lib/theme.ts` tokens, the ui-ux-pro-max style / typography /
chart / UX data, and a WCAG contrast audit computed on the actual colors.

---

## 1. Identity

**What the site is:** the home of a Command & Conquer: Generals – Zero Hour clan —
matches, ranked ladders, replays, maps, mods, tournaments, Discord-centred community.
Audience: competitive PC strategy players, English and Arabic (RTL), many on phones.

**Visual direction:** *Tactical HUD on military-olive dark.*
Closest matches in the skill's style database: **HUD / Sci-Fi FUI** (1px lines, decorative
corner brackets, monospaced data) + **Dark Mode (OLED)**. The palette is distinctive and
deliberate: olive-black surfaces, amber for action, radar-green for "live / ok".

**Voice:** short, tactical, plain. Radio-comms flavour is fine in labels
("Field comms", "Return to base", "Advancing…"); error messages are literal and helpful.

**Not this:** neon purple "gaming RGB", cyan HUD, glitch effects, 3D, light mode,
blue-gray surfaces (they clash with the olive palette).

---

## 2. Color tokens (from `lib/theme.ts`)

| Token | Value | Use |
|---|---|---|
| `C.void` | `#0A0C08` | page background; text on amber/green fills |
| `C.panel` | `#12150E` | cards, tables, dialogs |
| `C.panelHover` | `#171B10` | hover / raised surface, alternating rows |
| `C.line` | `#272B1E` | decorative dividers only |
| `C.lineStrong` | `#3A4029` | stronger dividers, subtle card edges |
| `C.amber` | `#E8A63D` | primary accent, CTAs, links, ratings |
| `C.amberDim` | `#8A6425` | **borders of interactive controls**, large/decorative accents |
| `C.radar` | `#8FBF4F` | "live / active / ok" status |
| `C.paper` | `#EDEAE0` | body text |
| `C.muted` | `#83866F` | secondary text |

**Semantic colors (not in the theme file yet — add them):**
`success #22c55e` (wins, ✓) · `danger #ef4444` (text/icons) · `dangerFill #dc2626`
(button fill with white text) · `info #60a5fa` · `special #c084fc`.

### Contrast audit (WCAG; text needs 4.5:1, UI boundaries 3:1)

| Combination | Ratio | Verdict |
|---|---|---|
| paper on void / panel | 16.3 / 15.3 | pass |
| muted on void / panel / panelHover | 5.2 / 4.9 / 4.7 | pass — **barely** on panelHover |
| amber on void / panel | 9.3 / 8.7 | pass |
| radar on void / panel | 9.1 / 8.5 | pass |
| void text on amber / radar fill | 9.3 / 9.1 | pass |
| amberDim on void / panel | 3.7 / 3.5 | **UI/large only — never body text** |
| `line` / `lineStrong` on panel | 1.3 / 1.7 | decorative only (fine for dividers) |
| **muted with any CSS opacity** (0.5–0.8) | 2.2–3.6 | **fail — never combine** |
| `#666` / `#555` text on panel | 3.2 / 2.5 | **fail** |
| white on `#ef4444` | 3.8 | **fail** → use `#dc2626` (4.8) |
| `#ef4444` / `#22c55e` / `#60a5fa` / `#c084fc` text on panel | 4.9 / 8.1 / 7.3 / 7.0 | pass |

**Rules that follow from the audit**
1. **Never apply `opacity` to `C.muted` text.** It's already near the 4.5 limit. For a dimmer
   look use a different element (icon, border), not lower opacity.
2. **Form fields and ghost buttons must have a boundary ≥ 3:1.** The old `#333` borders on
   `#131313` are ~1.5:1. Use `1px solid C.amberDim` (3.5:1), amber on hover/focus.
3. Body text is only ever `C.paper` or `C.muted`. Nothing darker.
4. Color is never the only signal (keep ✓/✕ next to win/loss colors).

### One source of truth — hardcoded values → tokens

Many files (leaderboard, admin, forms, dialogs) hardcode hex values that don't match the
theme: a **different amber** (`#f5a623` vs the real `#E8A63D`), neutral grays instead of
olive, and blue-gray match rows copied from a reference screenshot. Map them like this:

| Hardcoded now | Replace with |
|---|---|
| `#f5a623` | `C.amber` (`#E8A63D`) |
| `#0a0a0a`, `#0a0c08` | `C.void` |
| `#0e0e0e`, `#111`, `#111111`, `#131313` (surfaces) | `C.panel` |
| `#1a1a1a`, `#1c222b` | `C.panelHover` |
| `#12161c`, `#0d1015` (blue-gray match rows) | `C.panel` / `C.void` alternating |
| `#222`, `#2a2a2a` (borders) | `C.line` |
| `#333`, `#444` (borders) | `C.lineStrong` (decorative) or `C.amberDim` (controls) |
| `#eee`, `#e6e6e6` | `C.paper` |
| `#888`, `#8a8a8a`, `#666`, `#555` (text) | `C.muted` |
| `#ef4444` button fill + white text | `#dc2626` + white |
| `#22c55e` | keep (win/success) |

Long term: expose the tokens as CSS variables (`--c-void`, `--c-panel`, …) in `globals.css`
so plain-CSS files (`leaderboard.css`, `admin.css`) use the same values as TSX.

---

## 3. Typography

- **Display / headings:** Oswald, uppercase, tight leading (in use).
- **Body / data:** JetBrains Mono — confirmed by the skill as the right pairing for sci-fi /
  strategy-game interfaces.
- **Arabic (RTL):** Cairo (display) and Tajawal (body) via `[dir="rtl"]` (wired).
- **Scale:** H1 `clamp(2.2rem, 5vw, 3.2rem)` · H2 `1.3–2rem` · H3 `1rem` · body `0.875–1rem` ·
  labels `0.7rem` uppercase, tracking `0.12em`.
- **Minimums:** body ≥ 14px, labels ≥ 11px (some `0.6rem` labels are too small),
  line-height 1.5–1.7 for paragraphs.
- Use tabular numerals for ratings and counts so columns don't jitter.

---

## 4. Layout & responsive

- Test at **375 / 768 / 1024 / 1440** px. No horizontal page scroll at any width.
- Widths: home `max-w-6xl`; data pages (leaderboard) `1100px`; text pages `~780px`.
- Spacing on a 4/8px scale; section gaps 40–64px.
- **Match table:** 8 columns at ≥ 768px; below 768px a **stacked card** (teams on top, then
  map · type · time · actions in one wrapped row). No reliance on page-level horizontal scroll.
- Reserve space for async content (stats strip, YouTube grid) to avoid layout jumps.

---

## 5. Components

**Panel** — 1px `C.line`, radius 0–4px, background `C.panel`. Interactive cards add the amber
**corner brackets** on hover (existing `cz-bracket`) — the brand's signature detail.

**Buttons**
| Kind | Style |
|---|---|
| Primary | `C.amber` fill, `C.void` text, uppercase, tracking 0.08em |
| Secondary | 1px `C.amberDim` outline → `C.amber` on hover, amber text |
| Danger | `#dc2626` fill, white text (delete, confirm dialogs) |
| Ghost / icon | transparent; **`aria-label` required**, hit area ≥ 44×44px |

**Inputs** — background `C.void`, `1px solid C.amberDim`, text `C.paper`, placeholder `C.muted`;
focus: `C.amber` border + 2px amber outline.
**Badges** — 1px outline, 11px uppercase (mode tags, Veteran/Active, OWNER).
**Feedback** — `FeedbackProvider` only: toasts for results, dialogs for confirms; destructive
confirms are red with Cancel focused. No `alert()` / `confirm()` / `prompt()`.
**Empty states** — one line of what's missing + one line of what to do.
**Loading** — tank loader for pages; skeleton blocks that reserve final size for sections.

---

## 6. Iconography

Use **Lucide SVG icons only** (already a dependency). Emoji render differently per device
and can't be themed.

| Now | Use |
|---|---|
| 🥇🥈🥉 | `Medal` / `Trophy`, colored gold / silver / bronze |
| 🔥 streak | `Flame` |
| ⚔️ Active | `Swords` |
| 🎖️ Veteran | `Award` |
| 🚩 report | `Flag` |
| ⬇ replay | `Download` |
| 🛡️ team | `Shield` |
| ✓ / ✕ | `Check` / `X` |

Decorative icons: `aria-hidden="true"`. Icon-only buttons: `aria-label`.

---

## 7. Motion

- Hover/press 150–300ms; entrances 400–700ms; transform + opacity only.
- **Everything non-essential stops under `prefers-reduced-motion: reduce`.**
  Done in: feedback dialogs/toasts, stats count-up.
  **Still to do:** hero entrance, logo glow pulse, tank loader, scroll fade-ins.
- Looping animation limited to the logo glow and the tank loader.

---

## 8. Accessibility checklist (before shipping any page)

- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 large text); **no opacity on muted text**
- [ ] Control boundaries ≥ 3:1 (inputs, ghost buttons)
- [ ] Visible `:focus-visible` ring on everything interactive — amber 2px, 2px offset
- [ ] Full keyboard operation; Esc closes dialogs
- [ ] Icon-only buttons have `aria-label`
- [ ] Touch targets ≥ 44×44px, ≥ 8px apart
- [ ] Images have alt text; decorative ones `alt=""`
- [ ] RTL works: layout mirrors, use logical properties, no hardcoded left/right
- [ ] Reduced motion respected
- [ ] No information conveyed by color alone

---

## 9. Charts (rating history)

Line chart, SVG (fine under 1000 points), `C.amber` line, ~20% area fill, dashed baseline at
the starting rating, hover/tap to inspect. ✓ matches the skill's guidance. Two series at once
would need different line styles **and** direct labels — never hue alone.

---

## 10. Prioritized backlog

**P0 — quick, high value (≈ 1–2 hours)**
1. Never use opacity on `C.muted`; replace `#666/#555/#444` text with `C.muted`.
2. Danger buttons: `#ef4444` → `#dc2626` with white text.
3. Inputs / ghost-button borders → `C.amberDim` (≥ 3:1).
4. Global `:focus-visible` amber outline.
5. `aria-label` on icon-only buttons (report flag, close ✕, menu).

**P1 — visible polish (≈ half a day)**
6. Hardcoded hex → tokens using the mapping table above (fixes the amber mismatch and the
   blue-gray match rows in one pass).
7. Emoji → Lucide icons (leaderboard first, then profile and header).
8. Honour reduced-motion in hero, logo glow, tank loader, scroll fade-ins.
9. Mobile card layout for Recent Matches; 44px targets for report/delete.

**P2 — structure**
10. Tokens as CSS variables in `globals.css`.
11. Arabic parity for pages still English-only (leaderboard, profile).
12. Skeleton loaders for stats strip, YouTube grid, leaderboard.

---

## 11. How to use this with Claude Code

> "Read `design-system/commander/MASTER.md`, then apply it to `<page or component>`.
> Use the `C` tokens from `lib/theme.ts`. Keep the existing olive/amber tactical theme.
> Don't change behavior, only presentation."

For a single page, also create `design-system/commander/pages/<page>.md` containing only
the rules that differ from this file.
