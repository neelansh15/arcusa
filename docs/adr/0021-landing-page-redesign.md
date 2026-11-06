# 0021. Landing page redesign: big, bold, simple, animated

- Status: accepted
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

## Revisions after devil's advocate review (2026-11-07)
Accepted with these changes. They override anything above that conflicts.
1. **Claims allowed (the only ones).** One stock, a mock NVDA token (`mNVDA` on Sepolia, `wNVDA` on Arc). One home chain (Ethereum Sepolia). One settlement chain (Arc testnet). USDC is "digital dollars", and the FAQ says once that it is a dollar-pegged stablecoin. Wording of the disclaimer is ADR 0016: "Testnet demo. Not a security, no real shares, no real value." Say "mock stock token" in the hero area, the calculator and the FAQ. Do not name any token provider and do not use provider names or logos. Other chains and tickers are not drawn at all (no Soon tiles, no named tickers): a single "More stocks and chains are on the roadmap" line that links to the roadmap doc.
2. **No marquee, no ticker strip.** Cut (accessibility and unshipped-asset claims).
3. **Price source.** Delete the old `LiveQuote` (it fakes random prices and changes). New `useIndicativeQuote()` calls only `/api/price`, once plus a 30 second poll, 3 second abort. If it fails, show a static, labelled "Sample price" and never call anything "live" unless the quote is under 60 seconds old. Do not load `/api/ticks` and do not use `useMarket` or `useQuote` on the landing (no Arc RPC load). Label the price "indicative", never name the upstream.
4. **Calculator.** Uses only the indicative price. Output is "about X NVDA. Estimate: fees and slippage not included." No fee number is shown. No prefill into `/trade`; the button just opens `/trade`.
5. **No speed or "one tap" claims.** First use needs an approval and then the trade, so step titles say "Tap Buy" only with the note "The first time you also approve USDC". No "seconds". The bridge tile draws exactly one source dot (Sepolia) and says demo.
6. **Server and client boundaries.** `sections.tsx` stays a server component. Client islands only: `Reveal`, `CountUp`, `HeroQuote`, `Calculator`, `StepTracker`, `GlowTile`, `PhoneShowcase`, `LandingLive` (offscreen pausing). `copy.ts` is a plain module. Counts render their final value on the server and animate only after mount; the animated copy is `aria-hidden` and the final value is in the DOM for assistive tech.
7. **Reveal fail-safe.** `lp-js` is added only after the first observer callback; content already in view at mount is revealed immediately; a 2.5 second timeout reveals the rest; reduced motion skips hiding entirely.
8. **Scroll story.** `position: sticky` plus an IntersectionObserver per step (rootMargin -45% 0 -45% 0), desktop only; stacked and not sticky on mobile. All three step texts stay in the DOM and the sticky visual comes after them in DOM order. No scroll-driven animation timelines. Check that no wrapper has `overflow` other than visible.
9. **Glow and hover.** One `pointermove` per tile setting two CSS variables, only under `(hover: hover) and (pointer: fine)`, animating a pseudo-element's opacity and transform. Off under reduced motion. In the light theme the glow is used only behind the CTA panel at low opacity.
10. **Motion budget.** One hero loop (the chart line draws, then idles) plus reveal-once animations. The phone showcase and bento graphics animate on first entering view and then rest; none loop forever. All looping CSS pauses offscreen via a shared observer toggling `data-live` and on `visibilitychange`. FAQ uses native `details` with only a chevron rotate (no height animation).
11. **Layout stability.** Fixed heights for the hero mock, price block and calculator output so the live price and fonts do not shift layout. The `h1` is the LCP.
12. **Nav and links.** Reuse `SiteNav` and the app header look. Landing-only anchors (`#how`, `#faq`) are added next to it. "Under the hood" links point to `/docs/how-it-works`, `/docs/risks`, `/docs/contracts` and `/docs/roadmap`.
13. **Metadata.** Fix `app/layout.tsx` (remove "from many chains"), add `openGraph` and `twitter` metadata and a generated OG image, keep `icon.svg`.
14. **Hero mock.** Built from the app's own tokens and shapes, captioned "Illustration".
15. **Order.** The claims table is built first as `copy.ts` with a source comment next to each claim, so every later section reads from audited copy. Verification is a checklist inside each task; T-051 is the final sweep. Cut line if time runs short: cursor glow and phone cycling first, then the sticky story (fall back to stacked), keeping the hero, the story, the calculator, the FAQ, the CTA and the metadata.
