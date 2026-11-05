# 0006. Arc Studio as the starting point; laptop drives it through the Arc Studio CLI and pulls code into this repo

- Status: accepted
- Date: 2026-11-06
- Deciders: alle, user

## Context
Every Arc track at ETHGlobal Mumbai requires Arc Studio "as the starting point". Each submission must include a shareable Arc Studio project URL that judges can open, and Studio must be shown in the demo. The laptop agent (Claude Code) does the building. We need both to hold.

Sources (fetched 2026-11-06 IST):
- ETHGlobal Mumbai event page, Arc section of the tracks list: https://ethglobal.com/events/mumbai
  - "Every Arc [track] requires using Arc Studio as the starting point."
  - Qualification requirements for each Arc track:
    - "Built in Arc Studio. Include a shareable Arc Studio project URL that judges can open, and show Studio in your demo."
    - A working frontend and backend, plus an architecture diagram.
    - A video demo and presentation.
    - A link to the GitHub repo.
- Arc Studio overview: https://docs.arc.io/ai/arc-studio.md
  - Studio can be used in the browser, through the CLI, or from a coding agent.
  - It "builds and deploys to Arc testnet ... does not deploy to mainnet".
  - The sandbox can reach only allowlisted hosts (npm, GitHub, Circle APIs, Hugging Face, Netlify).
  - Code can be exported by pushing to GitHub.
  - Chat modes are Build, Plan and Smart Contract.
- Arc Studio CLI reference: https://docs.arc.io/ai/arc-studio-cli.md
  - `npm install -g @circle-fin/arc-studio-cli`. Commands include:
    - `arc-studio login` (use `--paste` on headless machines)
    - `arc-studio skills install --tool claude-code`
    - `arc-studio run "<prompt>" --session <name> --output json`
    - `arc-studio pull` (non-destructive; skips locally edited files)
    - `arc-studio deployments`
    - `arc-studio open`
  - `arc-studio clone` works only with **public** repos.
  - A contract deploy can take 5-20 minutes.
- Arc Studio troubleshooting: https://docs.arc.io/ai/arc-studio-troubleshooting.md
  - Daily and 30-day usage limits apply, and so does a limit on active sandboxes.
  - Idle sandboxes pause after about 30 minutes.
  - A one-time paid `upgrade` is available.

## Options considered
1. **Build everything in the Studio browser UI, then export to GitHub**
   - Pros: strongest Studio story.
   - Cons: the laptop agent cannot work there; export targets a repo Studio creates (not checked), so merging into this repo is manual.
2. **Build everything on the laptop with Claude Code and skip Studio**
   - Pros: fastest for us.
   - Cons: disqualifies us from every Arc track.
3. **Hybrid**
   - Create the Studio app first and do the Arc-side contracts and app scaffold through Studio.
   - The laptop drives Studio with the `arc-studio` CLI, registered as a Claude Code skill, and pulls the output into this repo with `arc-studio pull`.
   - Sepolia-side work (token deployment, scripts) is done on the laptop with Foundry and viem, because Studio deploys to Arc testnet only.
   - Pros: meets the requirement; Studio holds a real build history; the repo stays the source of truth.
   - Cons: two places hold code, so drift is possible; Studio usage limits.

## Decision
Use option 3.
- The first build action is creating the Studio app (T-003). The shareable project URL goes in README.md.
- Arc-side contracts (`PriceOracle` and the market contract) and the first UI scaffold are generated in Studio. Smart Contract mode is used for the contracts.
- `arc-studio pull` lands Studio output in `app/` and `contracts/arc/`. See ADR 0010.
- Edits made on the laptop are pushed back to Studio by prompting it, or Studio is re-synced before the demo, so the Studio project reflects the final app. The README must say plainly which parts were built where.

## Consequences
- The user must have an Arc Studio account. Login uses a browser device link, so the user has to approve it on the laptop.
- Studio cannot `clone` this private repo. Studio stays the origin of the Arc-side code, and we pull from it.
- Plan around Studio usage limits. Do not burn turns on things the laptop can do locally.

## Not verified
- How "Push to GitHub" from Studio behaves (new repo or existing repo).
- Whether a shareable project URL exposes code or only the preview to judges.
- The exact structure of Studio-generated projects (framework and folders).
