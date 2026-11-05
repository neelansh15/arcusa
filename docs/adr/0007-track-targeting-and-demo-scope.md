# 0007. Track targeting and demo scope

- Status: accepted
- Date: 2026-11-06
- Deciders: alle, user

## Context
We need to decide which ETHGlobal Mumbai problem statement arcusa targets, and what the demo must show to meet it.

Sources (fetched 2026-11-06 IST): ETHGlobal Mumbai event page, tracks list, https://ethglobal.com/events/mumbai.

Arc tracks that fit arcusa:
- **"Best Use of Bridge Kit for Non-USDC Assets, Built in Arc Studio"**
  - Wording: "Use Arc Studio to build an application, protocol, or developer tool that uses CCTP via Bridge Kit for non-USDC assets to make assets meaningfully crosschain."
  - It looks for "applications that move non-USDC assets across chains in a single, simple user flow", "protocols or developer tools that make a new asset crosschain", and "crosschain flows that settle or pair with USDC or EURC on Arc".
  - Linked resource: https://developers.circle.com/cctp/expanded-assets
- **"Best DeFi / Onchain Finance App Built End to End in Arc Studio"**
  - Wording: "Build a DeFi or onchain finance application on Arc, using USDC or EURC for settlement."
  - It looks for "trading apps, including trading with tokenized real-world assets (RWAs)".

Shared qualification requirements for both:
- Built in Arc Studio, with a shareable Studio project URL, and Studio shown in the demo.
- A working frontend and backend, plus an architecture diagram.
- A video demo and presentation.
- A GitHub repo link.
- "Please state which bounty you're submitting for."

Other tracks on the same page that are stretch only:
- Chainlink "Best use of Chainlink CCIP 2.0": CCIP must make a state change in our contracts.
- ENS.
- Definitive.

Not found on the page: the submission deadline, and whether one project can enter more than one Arc track.

## Options considered
1. **Primary: Bridge Kit for non-USDC assets**
   - Pros: arcusa's core feature (a new stock asset made crosschain with CCTPx, settled against USDC on Arc) matches all three things the track looks for.
   - Cons: depends on the Bridge Kit custom-token route working (ADR 0001).
2. **Primary: DeFi / onchain finance**
   - Pros: the trading terminal fits "trading with tokenized RWAs".
   - Cons: a larger field; our token is synthetic, which judges may count against us.
3. **Both Arc tracks**
   - Unknown whether this is allowed. Ask the organisers or the user.

## Decision
- Target option 1 as the primary track. Keep the DeFi track as the alternative if Bridge Kit custom-token routing fails, or if more than one Arc track is allowed (question for the user, T-001).
- CCIP, ENS, Definitive and Stablecoin FX stay stretch items. Do not start them before the MVP demo works end to end.

MVP demo scope, in order:
1. Fresh wallet: bridge USDC from Ethereum Sepolia to Arc testnet with Bridge Kit and Forwarding (ADR 0003).
2. The terminal shows the AAPL price, the market status and the user's balances.
3. Buy tAAPL with USDC on Arc (ADR 0005).
4. Bridge tAAPL from Arc to Sepolia with Bridge Kit by token id (ADR 0001), and show the balance on Sepolia.
5. If time allows: bridge back and sell.
6. Show the Arc Studio project, and show the architecture diagram.

Out of scope for the MVP: more than one stock, indexer and history (ADR 0011), mainnet, real-share backing, KYC.

## Consequences
- Submission materials must name the track explicitly and include the Studio URL, the diagram, the video and the repo link.
- The repo is private today, and the track asks for a repo link. The user must decide on visibility or judge access before submission (T-001).

## Not verified
- The submission deadline and the judging time.
- Whether a project can enter more than one Arc track.
- Whether a self-issued synthetic stock token is acceptable to the Arc judges. Asking the Arc team at the venue is the quickest check.
