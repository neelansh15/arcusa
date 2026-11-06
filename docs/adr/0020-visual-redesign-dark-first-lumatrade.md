# 0020. Visual redesign: dark-first theme to match the LumaTrade reference, light mode kept

- Status: accepted
- Date: 2026-11-07
- Deciders: user, laptop

## Context
ADR 0019 set the layout. The built UI (light, blue, Inter plus JetBrains Mono, hairline borders) does not look like the LumaTrade reference the user shared. The user wants visual parity, dark by default, a light mode developed alongside, the whole site (trade, bridge, docs, home) on the same theme, and the home page content to be replaced later from another reference. This ADR covers look and feel only. No contract, bridge or trading logic changes.

## Audit: reference vs current build
| Area | LumaTrade reference | Current build |
|---|---|---|
| Canvas | Near-black app canvas (about #101216) | White page, #f4f6f9 behind cards |
| Cards | Tonal elevation: cards a step lighter than canvas, almost no borders, radius about 28 to 32px, padding about 32px | White cards with 1px borders, radius 20px, padding 20 to 24px |
| Accent | One lime (about #c3dc4e). Used for the primary CTA fill (dark text), active tab text, active chip, positive change, chart line | Blue #2563eb for everything, including "positive" |
| Up / down | Lime up; warm red or amber down | Blue up; muted red down |
| Typeface | One geometric humanist sans (Google-Sans like) for text and for all numbers | Inter for text, JetBrains Mono for prices, balances and inputs |
| Type scale | Price about 56px semibold; amounts about 52px; token name 28px; labels 14 to 15px muted; table text 17px | Price 38px; amounts 28px; labels 11 to 13px |
| Chart | Smooth line, lime to amber gradient, warm dark area fill, no vertical grid, faint or no horizontal grid, y labels on the left, dashed crosshair with a glowing dot, white pill tooltip | Right y axis, horizontal grid lines, hairline blue line, dark pill tooltip |
| Header | Inside the shell, logo left, nav centered, wallet chip (pill with address) plus lime pill button | Full-width bar with a bottom border, nav next to logo, badges, small buttons |
| Controls | Pill tabs with lime text for the active one, pill range chips, round icon buttons (refresh, settings), dark circle swap button with a ring | Filled blue tab, grey pills, plain swap button |
| Table | Logo, price, amount, coloured status pills (olive, purple, teal), no row borders | Plain rows with borders, one pill colour |
| Panel | Pay and receive cards, then lime CTA, then an outlined summary card: big available balance with a delta pill, and a three column row (estimate fee, you receive, spread) | Position card, ticket, six-row summary |
| Page frame | Dribbble mockup: lime page around a rounded dark shell | n/a (real site, full-bleed) |

## Options considered
1. Re-skin by overriding colours per page: fastest, but the three CSS files already hold about 46 hard-coded hex values, so dark and light would drift.
2. Semantic tokens in one `theme.css` (dark default, light via `data-theme`), replace every hard-coded colour with a token, then restyle components against the tokens.
3. Adopt a UI kit (Tailwind, shadcn): large migration, no time.

## Decision
Option 2.

**Tokens (`app/src/app/theme.css`).** Keep the existing variable names (`--bg --panel --panel2 --line --line2 --text --muted --pos --neg --warn --accent --accent2`) so the current CSS keeps working, and add `--canvas`, `--card`, `--card-inner`, `--accent-fill`, `--on-accent`, `--accent-text`, `--accent-soft`, `--pos-soft`, `--neg-soft`, `--warn-soft`, `--shadow`, `--r-card`, `--r-inner`, `--font-num`. Landing's `--l-*` tokens become aliases of the same tokens.
- Dark (default): canvas #0d0f13, card #161920, inner card #1e222b, line rgba(255,255,255,.07), text #f2f4f7, muted #8b93a1, accent fill #c3dc4e with text #10130a, pos #c3dc4e, neg #ff6b6b, warn #e0b040.
- Light: canvas #eef1f5, card #ffffff, inner #f3f5f8, line #e3e6ec, text #0d0f13, muted #5b6472, accent fill stays lime #c3dc4e with dark text; because lime text on white is unreadable, `--accent-text` and `--pos` become olive #4d7c0f, `--neg` #c0392b.
- Exact values are tuned by eye against the reference during T-041; the roles above are the decision.

**Switching.** `<html data-theme="dark|light">`. Default dark regardless of system setting for now. An inline script in `<head>` sets it from `localStorage["arcusa.theme"]` before paint (guarded with try/catch). A sun/moon button in the header toggles it. `color-scheme` is set per theme.

**Type.** Replace Inter and JetBrains Mono with one sans (Figtree or DM Sans, whichever is closer by eye, through `next/font`), with `font-variant-numeric: tabular-nums` on numbers. JetBrains Mono remains only for addresses, hashes and code. Scale up as in the table.

**Shape and spacing.** Card radius 28px, inner card 22px, pills 999px. Tonal elevation, borders only on the summary card and inputs. Trade page gets a centered shell, max width 1280px, with generous padding (32px).

**Chart.** Colours read from the CSS tokens at runtime and re-applied when `data-theme` changes. Left price scale, no vertical grid, faint horizontal grid, dashed crosshair, white pill tooltip, lime line, area fill fading to transparent. A true lime-to-amber gradient stroke is not supported by lightweight-charts without a custom plugin, so the line is solid lime (known gap).

**Components.** Header: centered nav, wallet pill, theme button, Pro switch. Ticket: text tabs with accent for the active one, tokens with larger icons, dark round swap button with a ring, lime pill CTA, outlined summary card with three columns (estimated spread cost, you receive, spread). Slippage tolerance, execution price and max per trade move to a "Details" disclosure in the summary card. Position becomes the "Available balance" block (value, delta pill omitted unless real). Market table gets per-row coloured status pills.

**Pages.** Foundation (T-041), trade shell, header and chart (T-042), ticket and panels (T-043), bridge and toast (T-044), docs and landing theme (T-045), verification (T-046). Landing copy and structure are replaced later from another reference, so landing work is tokens, nav and the SVG graphics only.

## Consequences
- ADR 0019's note "keep the light theme" is superseded by this ADR for the visual theme; its layout decisions stand.
- "Positive" becomes lime (dark) or olive (light), not blue.
- Every hard-coded hex in CSS, `chart.tsx` and `landing/graphics.tsx` is replaced by a token. Done when `grep` for hex colours in app source returns only `theme.css`.
- The lime accent changes the brand feel from blue. The favicon and the logo dot change colour.
- Not verified: final font choice, final lime value, contrast ratios (target WCAG AA 4.5:1 for text, 3:1 for UI), chart theming on switch.

## Revisions after devil's advocate review (2026-11-07)
Accepted with these changes. They override anything above that conflicts.
1. **Priority.** The user asked for this redesign explicitly on 2026-11-07, so it runs ahead of the parked phase 2 list in `TASKS.md`. It touches only `app/` styling and components. It must not touch `packages/bridge`, `contracts/` or the trade and bridge logic, so it does not block T-033 to T-036. Demo-critical subset: T-041 to T-044. T-045 (docs, landing) comes after those are verified.
2. **Colour inventory.** The real count is 58 hex values (35 in `globals.css`, 18 in `landing.css`, 5 in `docs.css`) plus `rgba()` calls and canvas options in `chart.tsx` and fills in `landing/graphics.tsx`. Done criterion: no hex or rgb colour literal outside `theme.css`, the chart theme reader and the logo and favicon SVGs.
3. **Chart theming.** lightweight-charts needs resolved colour strings, not `var()`. Chart tokens are therefore plain hex or rgba in `theme.css` (no `color-mix`, no `oklch`). A reader calls `getComputedStyle(document.documentElement)` on mount and again from a `MutationObserver` on `data-theme`, then `applyOptions` on the chart and series (v5.2.1 supports this). Candle colours and the falling and rising line colours go through the same reader. The crosshair marker is a ring dot, not a glow (the library has no glow). Gradient stroke stays a known gap.
4. **Token names.** `--accent` becomes the text and link colour (lime in dark, olive in light). `--accent-fill` is the button fill and `--on-accent` the text on it. `--accent-soft` is a tinted background. Compound fixes in T-041: `button.primary` and `.tk-*` CTAs use `--accent-fill`/`--on-accent`; `.chart-tip` uses `--tip-bg`/`--tip-text` (not `--text`); `docs.css` line 2, `landing.css` line 3 and `.docs-side a.on` background use tokens; `html, body` background is `--canvas`.
5. **Layout model.** The current page uses 1px grid-gap hairlines and a `100vh` no-scroll terminal. The trade page is already on the card layout from ADR 0019 (page scrolls), so the shell is restyled, not rewritten. T-042 acceptance includes re-verifying the T-039 mobile sheet, the sticky buy bar, and the sticky docs sidebar offsets, with before and after screenshots.
6. **Theme switching details.** `<html suppressHydrationWarning>`. The inline head script sets `data-theme` before paint. The theme button renders a neutral state until mounted. The chart theme read also runs once on mount. `prefers-reduced-motion` disables the new gradients and transitions.
7. **Fonts.** Figtree through `next/font/google` (available). Remove the unused Space Grotesk (`--font-display`) and the hard-coded `"Inter"` fallback in `landing.css`. Audit the 17 `var(--font-mono)` uses: numbers move to `--font-num` (the sans with `tabular-nums`); mono stays for addresses, hashes and code.
8. **Concrete shape values.** `--r-card: 28px`, `--r-inner: 22px`, `--r-pill: 999px`, `--font-num: var(--font-body)`. Global `button` rules (6px radius, panel fill) get a reset in T-041 so pill styles do not fight them.
9. **Contrast.** Muted text stays at 12px or larger on dark. Pro stats and bridge labels that are 10 to 11px uppercase use `--text-2` (a step brighter than `--muted`). T-046 includes a computed contrast table for the main text, muted, accent, pos, neg and warn pairs in both themes.
10. **Honest status pills.** Per-row coloured pills only for real states: oracle session (Regular, Pre-market and so on), feed Live or Stale, demo mode. No decorative statuses.
11. **Ticket.** Slippage, execution price and max per trade stay visible (a compact secondary row under the three-column summary), not hidden in a disclosure. Acceptance for T-043 includes a real buy and sell on Arc testnet in both themes or an explicit "not run" in Result.
12. **Task order.** T-041 lands in one commit with the app fully working in dark and light before anything else. The favicon `app/src/app/icon.svg` and the logo SVG are listed explicitly.
