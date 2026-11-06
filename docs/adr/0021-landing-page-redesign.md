# 0021. Landing page redesign: big, bold, simple, animated

- Status: proposed
- Date: 2026-11-07
- Deciders: user, laptop

## Context
The app side (trade, bridge, docs) now has the dark-first lime theme (ADR 0020). The home page still reads like a technical pitch: a small hero, a six-feature grid, a four-step list, a bridge table. The user wants a landing page as good as the app: big and bold, very simple language, animations and graphics that explain the product, modern features, and an appealing look. Their framing: "it's basically a very simple US stocks app". Copy for the home page may be refined later from another reference, so the structure must be easy to re-word.

## Audit of the current landing
| Area | Now | Problem |
|---|---|---|
| Hero | 60px headline, long paragraph, small candle card | Not bold; explains with jargon (CCTP, Bridge Kit, oracle-anchored) |
| Story | Feature grid and 4 steps in text | Nothing moves; the user has to read to understand |
| Visuals | One static candlestick SVG | No product shown; the phone experience is invisible |
| Interaction | None | No way to "feel" the product without a wallet |
| Shapes | Hairline grid, 4 to 10px radii | Does not match the app's rounded cards and pills |
| Motion | Reveal on scroll only, depends on IntersectionObserver | If the observer never fires, the page stays blank (seen in the in-app browser) |
| Honesty | Good disclaimer in the footer | Hero copy mentions many chains in the present tense |

## Options considered
1. Re-skin the current sections only: cheap, still reads technical.
2. New page structure with simple copy, product-shaped graphics, CSS and SVG animation, no new dependencies.
3. Adopt an animation library (framer-motion, GSAP) and a 3D hero: higher polish ceiling, adds bundle weight and time, and risks reduced-motion and mobile problems.

## Decision
Option 2.

**Voice.** Plain words, short sentences, a Kraken-like confidence. "USDC" is explained once ("digital dollars"). Words like CCTP, oracle, attestation move down to one "Under the hood" strip that links to the docs. Headline candidates: "US stocks. Paid in USDC." with the sub-line "Buy tokenized stocks with digital dollars. One balance, one tap, settled on Arc."

**Page structure (one page, top to bottom).**
1. **Hero.** Giant headline (clamp 52px to 112px), sub-line, two buttons (Open the app, How it works), "Testnet demo, no real money" note. Right side: the real trade card rebuilt as a static, animated mock (price counts up to the live quote, chart line draws itself, Buy button pulses, a lime glow blob behind). Live indicative price from `usePrice`, labelled as such, with a safe fallback when the feed is down.
2. **Ticker strip.** A slow marquee under the hero: NVDA (live) followed by greyed "Soon" tiles for other tickers. Soon tiles are labelled and not clickable (ADR 0018 rule: no claims about unshipped assets). Paused for reduced motion.
3. **How it works in 3 steps (scroll story).** "1 Add USDC", "2 Pick a stock", "3 Tap Buy". A sticky visual on one side changes with the active step: coins drop into a wallet, a stock card is selected, a button press produces a success check. On mobile the steps stack with one small animation each.
4. **Bento grid, "Why it feels simple".** Six tiles of different sizes, each with a tiny animated graphic and a one-line promise: One balance (USDC is price and gas), A price you can check (oracle pulse), See the cost first (bid, ask and spread slider), Works on your phone (mini phone), Bring funds in (chain dots flowing to Arc, labelled demo: Sepolia only), It's all on-chain (a receipt with an explorer link). Tiles have a cursor-follow glow on desktop.
5. **Try it.** An interactive calculator: type or slide a USDC amount and see "You get about X NVDA" using the live indicative quote, with the fee shown separately as an estimate. No wallet needed. A button opens the app with the same amount prefilled via a query parameter (read by the ticket in a later task if cheap, otherwise the button just opens `/trade`).
6. **Phone showcase.** A phone frame cycling through the real mobile screens as animated mocks: price and chart, the Buy sheet sliding up, the success state. Pauses when offscreen.
7. **Plain-English FAQ.** Native `<details>`: What is this? Is it real money? What is USDC? Why Arc? What stocks can I buy? Can I lose money here? What are the risks? Answers reuse facts from the docs and ADR 0016.
8. **Final CTA.** A big rounded lime panel, "Try it in a minute", the same button, the testnet note.
9. **Footer.** Links, "Under the hood" links to docs, and the existing full disclaimer.

**Look.** Same tokens as the app. Big rounded shells (44px) alternate with open canvas sections. A `--glow` token (lime in both themes, lower opacity in light) drives hero and CTA glows. Type: Figtree, headings 700 to 800, tight tracking. Section rhythm 120px desktop, 72px mobile. The nav matches the app header (pill links, theme button, lime button).

**Animation rules.**
- CSS and SVG only plus one small hook for reveal, count-up and active-step tracking. No new dependencies.
- Animate only `transform` and `opacity` (plus SVG stroke-dashoffset for the line draw).
- Everything is visible by default. The reveal system hides content only after JS confirms it can observe, reveals anything already in view immediately, and has a 2.5 second safety reveal (fixes the blank page seen when IntersectionObserver never fires).
- `prefers-reduced-motion`: no marquee, no loops, final states shown.
- Looping animations are paused when offscreen (`animation-play-state` set by the observer).

**Honesty rules (carry ADR 0016, 0017, 0018).**
- Say "testnet demo" and "no real money" in the hero, the calculator, the CTA and the footer.
- The stock is a token that tracks NVDA, not a share. No "own real shares" language.
- No invented numbers: no volume, user count, TVL, speed claims or fee claims beyond what the app reads live or the docs state. Live figures are labelled "indicative".
- Other chains and other tickers are shown only as "Soon" or "Roadmap". Only Ethereum Sepolia to Arc is demoed.
- The calculator is an estimate, not a quote.

## Consequences
- `landing/sections.tsx`, `graphics.tsx`, `effects.tsx` and `landing.css` are largely rewritten. `Logo`, `SiteNav`, `LiveQuote` logic and the theme tokens are reused.
- The landing becomes a client-heavy page (animation hooks). Server-render the static copy, hydrate small islands.
- The copy is isolated in a single `copy.ts` so a later re-word from another reference is one file.
- Not verified: live feed availability on the landing in production, prefilled-amount handoff to the ticket, performance on low-end phones.

## Tasks
T-047 foundation, hero and ticker; T-048 how-it-works story and bento; T-049 calculator and phone showcase; T-050 FAQ, final CTA, footer and copy audit; T-051 verification.
