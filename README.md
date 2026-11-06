# arcusa

**US stocks, settled on Arc.** A stock terminal for non-US users: fund with USDC, bridge in with Circle, trade tokenized equities on Arc.

![Arc](https://img.shields.io/badge/chain-Arc-6C5CE7?style=for-the-badge)
![Circle CCTP](https://img.shields.io/badge/bridge-Circle%20CCTP-00B2A9?style=for-the-badge)
![Bridge Kit](https://img.shields.io/badge/SDK-Bridge%20Kit-2775CA?style=for-the-badge)
![USDC](https://img.shields.io/badge/settlement-USDC-2775CA?style=for-the-badge)
![Tokenized Stocks](https://img.shields.io/badge/assets-tokenized%20stocks-F39C12?style=for-the-badge)
![ETHGlobal Mumbai](https://img.shields.io/badge/hackathon-ETHGlobal%20Mumbai-E84393?style=for-the-badge)
![Status](https://img.shields.io/badge/status-planning-F1C40F?style=for-the-badge)

## Built in Arc Studio

Arc Studio project (shareable): https://studio.arc.io/app/efb4a3b8-92a8-41d3-993a-5d254dc32258

What was built where, plainly:

| Part | Where it was built |
| --- | --- |
| `PriceOracle` and `InventoryMarket` contracts, their Foundry tests (101 passing as reported by Studio) and four testnet deployments (NVDA and TSLA oracle and market) | **Arc Studio** (Smart Contract mode, driven with the Arc Studio CLI). Output is in [`contracts/arc/studio/`](./contracts/arc/studio/); addresses in [`deployments/arc-testnet.json`](./deployments/arc-testnet.json) under `studio`. |
| Trading app (Next.js), bridge page, docs | Written in this repo with Claude Code. The Studio project also holds an earlier UI scaffold (Vite). |
| Mock stock tokens on Sepolia, wrapped tokens on Arc | Deployed by script; the wrapped tokens use Circle's CCTPx ownerless token manager. |
| Price service and oracle relayer | Written in this repo (`services/price`), run on a server. |

Status today: the app still trades against the first set of contracts (same source, deployed by script). Switching the app to the Studio-deployed set needs the owner setup and inventory move (T-056) and the app switch (T-057).

## Table of contents

- [Plan](./PLAN.md)
