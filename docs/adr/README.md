# Architecture decision records

One file per decision: `NNNN-short-title.md`, copied from `0000-template.md`. Statuses: proposed, accepted, rejected, superseded. Accepted ADRs are immutable; supersede them with a new ADR.

## Index
| ADR | Title | Status |
| - | - | - |
| [0001](0001-stock-token-bridging-path.md) | Bridging path for the stock token: Bridge Kit by token id, raw CrossChainTokenService as fallback | superseded by 0013 |
| [0002](0002-stock-token-model-and-issuer.md) | Stock token model: native CrossChainToken issued by arcusa, synthetic and USDC-backed on testnet | superseded by 0012 |
| [0003](0003-usdc-bridge-in-with-forwarding.md) | USDC bridge-in: Bridge Kit with the Forwarding Service, fee paid on source | accepted |
| [0004](0004-price-oracle.md) | Price oracle: Pyth equity price relayed by our backend into an arcusa oracle contract | superseded by 0015 |
| [0005](0005-trading-and-settlement.md) | Trading and settlement: oracle-priced mint and redeem against USDC on Arc | superseded by 0014 |
| [0006](0006-arc-studio-workflow.md) | Arc Studio as the starting point; laptop drives it through the CLI and pulls code into this repo | accepted |
| [0007](0007-track-targeting-and-demo-scope.md) | Track targeting and demo scope | superseded by 0017 |
| [0008](0008-frontend-stack-and-wallet.md) | Frontend, stack and wallet | proposed (T-003, T-006) |
| [0009](0009-compliance-stance-testnet-demo.md) | Compliance and legal stance for the testnet demo | superseded by 0016 |
| [0010](0010-repo-structure.md) | Repo structure | accepted |
| [0011](0011-indexer-post-mvp.md) | Indexer for holdings, trades and history (post-MVP) | proposed (spike T-020, post-MVP) |
| [0012](0012-provider-token-lock-and-wrap.md) | Asset model: provider tokens locked on their home chain, wrapped on Arc | proposed (spikes T-022, T-023) |
| [0013](0013-wrapped-token-bridging-path.md) | Bridging path for the wrapped stock token | proposed (spike T-024) |
| [0014](0014-trading-against-pre-positioned-inventory.md) | Trading: oracle-priced market against pre-positioned inventory | proposed (review T-032) |
| [0015](0015-price-parity-and-off-hours-policy.md) | Price parity and off-hours policy | proposed (spike T-025) |
| [0016](0016-compliance-provider-tokens.md) | Compliance and legal stance with provider tokens | proposed |
| [0017](0017-demo-scope-with-wrapped-token.md) | Demo scope with the wrapped token | proposed |

Note: ADRs 0008, 0010 and 0011 still say `tAAPL`. Read it as the wrapped token `wAAPL` (ADR 0012).
