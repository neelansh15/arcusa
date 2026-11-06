# 0020. Visual redesign: dark-first theme to match the LumaTrade reference, light mode kept

- Status: proposed
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

**Pages.** Trade (T-042), then bridge, docs and toast (T-043), then landing theme only (T-044), then a verification pass in both themes and on mobile (T-045). Landing copy and structure are replaced later from another reference, so landing work is tokens, nav and the SVG graphics only.

## Consequences
- ADR 0019's note "keep the light theme" is superseded by this ADR for the visual theme; its layout decisions stand.
- "Positive" becomes lime (dark) or olive (light), not blue.
- Every hard-coded hex in CSS, `chart.tsx` and `landing/graphics.tsx` is replaced by a token. Done when `grep` for hex colours in app source returns only `theme.css`.
- The lime accent changes the brand feel from blue. The favicon and the logo dot change colour.
- Not verified: final font choice, final lime value, contrast ratios (target WCAG AA 4.5:1 for text, 3:1 for UI), chart theming on switch.
