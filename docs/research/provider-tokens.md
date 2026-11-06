# Research: can real provider tokens be locked and wrapped? (T-023)

Related: ADR 0012 (provider token lock and wrap), ADR 0016 (compliance for provider tokens).

All sources were fetched on 2026-11-06 (UTC). The first Ondo fetch was at about 00:20 UTC. On-chain reads used Ethereum mainnet blocks 26352183 to 26352206 (publicnode RPC) and Arc mainnet block about 29752151 (https://rpc.mainnet.arc.io, chainId 5042). This work was read-only. No transactions were sent; transfers were only simulated with `eth_call`.

## Short answer

| Provider | Can a contract we do not control hold it? | Can it be locked and wrapped through CCTPx ownerless? |
| --- | --- | --- |
| Ondo Global Markets (NVDAon) | **Yes.** The token has a deny-list, not an allowlist. | **Yes, and someone has already done it on mainnet** (see below). The issuer can still freeze the backing. |
| xStocks (NVDAx) | **Yes.** The only check is the Chainalysis sanctions oracle plus a global pause. | **Unknown, and probably unsafe.** The token rebases (`balanceOf` changes with a multiplier), which breaks 1:1 lock accounting. It is not registered in CCTPx today. |

## Ondo Global Markets: NVDAon

| Item | Value | Source |
| --- | --- | --- |
| Chain (home) | Ethereum mainnet. Also on BSC `0xa9ee28c80f960b889dfbd1902055218cba016f75`, Solana `gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo`, HyperEVM `0xB989ad9b91886b1Aaed8DaADb26F028b29b40945`, Robinhood Chain `0xf1b95ae4e7700b962714702ea53784dc8492a856` | GM token CSV linked from docs.ondo.finance/addresses |
| Token address | `0x2D1F7226Bd1F780AF6B9A49DCC0aE00E8Df4bDEE` | same; on-chain name "NVIDIA (Ondo Tokenized)", symbol NVDAon |
| Decimals | **18** (on chain; this confirms the assumption in ADR 0012) | `decimals()` |
| Total supply | 85694584639284670094835 (about 85,694.58) | `totalSupply()` |
| Contract | BeaconProxy. Beacon `0x985462c9aa4d6c3ad59ae6e1e9c0c11347ed1598` (owner `0x3715b2154d2ff4c5b027c7a1f734b53f27bc34f1`). Implementation `0xebbcb2cee51c2fee4062c9c1270dcb98b0b22250` is `GMToken`, verified on Sourcify (full match, solc 0.8.16). The issuer can upgrade it. | Sourcify v2 |
| Transfer hooks | `_beforeTokenTransfer` first calls `_checkTokenIsPaused`. It then calls `compliance.checkIsCompliant` for `msg.sender` (if it is neither `from` nor `to`), for `from` (if not zero) and for `to` (if not zero). | GMToken source |
| Who can hold or receive | Anyone not on the deny-list. The compliance contract is `0x54a8757c2FEF8649830b158a8C19D3a670e80318` (OndoComplianceGMView, Ownable2Step, owner `0x71A4d411b5f7941Dee020417fca30413712f1646`). It forwards to OndoCompliance `0x156F73fc73197555e950743Cb2B23F411c751002` (gmIdentifier `0x428ECB70E90d1527A5f5e177789f51747b883F34`), which reverts only if the account is on the blocklist `0xd8c8174691d936E2C80114EC449037b13421B0a8` or the sanctions list `0x40C57923924B5c5c5455c48D93317139ADDaC8fb`. There is no allowlist. | Sourcify sources and on-chain reads |
| Pause | TokenPauseManager `0xfD48112E448417CA79305a518c4186dF4b0A200a`, which can pause one token or all tokens. `isTokenPaused(NVDAon)` is false today. | on chain |
| Burn | `BURNER_ROLE` can call `burn(from, amount)` on **any** address. | GMToken source |
| Rebasing or multiplier | No balance rebasing on Ethereum. Dividends are reinvested and show up in the price. A SyntheticSharesOracle (`0x9BC39DB6fbB44B91a48b8D5A6C208B82B1741bE6`) tracks a shares multiplier. Balances on chain do not change; on Solana and BNB only the display is scaled. | docs.ondo.finance corporate-actions; code |
| Fee-on-transfer | None in the code. | GMToken source |
| Redemption | Redeeming requires KYC (Ondo docs, secondary-market restrictions page), and the issuer may refuse a redemption. Redemption is instant to USDon, or to USDC subject to swapper liquidity (minimum $1); the USDon/USDC swapper requires whitelisting. US persons and listed countries are not eligible. Trading pauses around ex-dividend dates. | docs.ondo.finance investing-and-redeeming, eligibility, transferability |
| Docs on smart-contract holders | "can be held by any smart contracts or other externally owned accounts" | docs.ondo.finance investing-and-redeeming |

Evidence that a contract we do not control can hold it:
- `checkIsCompliant` passes for `0x…dEaD`, for `0x1111…1111` and for the USDC contract.
- Simulated `transfer` calls from holder contract `0xc9b4bc7c15423fcfe6b75ab5118ba773945a3a46` succeed to `0x1111…`, to the USDC contract, and to the CCTPx manager `0x8582133d6561dcb43af8c4d2ff6e48c7eaa7cf44`, for both 1 wei and 1e18.

### NVDAon is already registered as an ownerless CCTPx token and wrapped on Arc mainnet

Circle's Iris registry (`https://iris-api.circle.com/v2/cctpx/tokens?pageSize=150`) returns 74 tokens on one page. NVDAon is listed with tokenId `0xcfd8957c3edb3bf7ce5d72df3cf047a58f01fc44cc0223b3a111b1135762b444`:

| Domain | Token | Manager | Enabled |
| --- | --- | --- | --- |
| 0 (Ethereum) | `0x2d1f7226bd1f780af6b9a49dcc0ae00e8df4bdee` | `0x8582133d6561dcb43af8c4d2ff6e48c7eaa7cf44` | yes |
| 26 (Arc) | `0x65a70add2abe2051373a92f4a951d34eefdffa90` | `0x8582133d6561dcb43af8c4d2ff6e48c7eaa7cf44` | yes |

The same registry lists these other Ondo tokens with Arc deployments: TSLAon, SLVon, AMZNon, MSFTon, CRCLon, GOOGLon, AAPLon, COINon, SPYon, SPCXon and MSTRon. No xStocks are listed.

On-chain checks:
- The CCTPx service on Ethereum is `0x431871229103b780868f8C6BB820cd16ECf942BC`, an ERC1967 proxy with implementation `0xcef229c35cf3b6ba34690295399369412ab9b2b8`, verified on Sourcify.
  - `getOwnerlessTokenId(NVDAon)` returns the tokenId above, so the registration is ownerless.
  - `resolveTokenManager` returns `0x8582…`.
  - `isTrustedDomain(26)` returns true.
- The manager `0x8582…` on Ethereum:
  - `tokenManagerType` = 2 (LOCK_UNLOCK), `operator` = 0x0, not paused, `maxTransferAmount` = uint256 max.
  - It holds 13191034458710744 wei of NVDAon (about 0.0132).
- Registration was done by a plain EOA, not by an Ondo-labelled address. The ownerless function takes no issuer signature, which suggests that anyone can register a token they do not control. The EOA's identity is unverified.
  - Tx `0x9507eadbba14bb1563016d24ea47f31cf8f9aa76a1dd45b793f16f7db2aa5e41` (2026-09-23 22:53:35Z) is `registerOwnerlessToken`, sent by EOA `0xb053C334D151374fC19f784EBd543B73701ddfD8`.
- First lock: tx `0x07e7fa14bcf48de0509e5e548c6f9eb33782ad3177a82b6b745f9761a84e260a` (2026-09-23 23:44:23Z). It is a `crossChainTransfer` of 13191034458710744 to domain 26, with minFinalityThreshold 2000 (Standard).
- The Arc token `0x65a7…`:
  - Name "NVIDIA (Ondo Tokenized)", symbol NVDAon (copied from the home token), decimals 18.
  - `totalSupply` = 13191034458710744, exactly equal to the locked amount. All of it is held by `0xb053…`.
  - `denylistProvider` = `0x3ebE1f103151890346cD7dbCEC1C596Cc50EF58e`.

Consequence for ADR 0012:
- The "wNVDA on Arc" leg already exists as Circle's `CrossChainToken` at `0x65a7…`. A second ownerless registration of the same token should map to the same tokenId and manager. (This is inferred from `getOwnerlessTokenId` and was not tested.)
- We would use or deposit into the existing manager rather than deploy our own.

Risks to locked backing. The issuer keeps full control of the home token:
- Ondo can blocklist the manager address.
- Ondo can pause the token.
- Ondo can burn from the manager through `BURNER_ROLE`.
- Ondo can upgrade the beacon.

Any of these would freeze or strand every wrapped token on Arc. Circle docs describe ownerless registration as "intended for community assets without an active issuer". On an ownerless registration nobody controls rate limits or pause.

## xStocks (Backed): NVDAx

| Item | Value | Source |
| --- | --- | --- |
| Issuer | Backed Assets (JE) Limited (Jersey, JFSC). Each token is a tracker certificate (bearer debt instrument), backed 1:1 by the share in segregated custody. It carries no shareholder rights. | docs.xstocks.fi product-legal-overview |
| Chain | Ethereum, plus Arbitrum, BSC, HyperEVM, Ink, Mantle, Monad, XLayer, Optimism, Solana, TON and Tron. **Arc is not listed.** | `GET https://api.xstocks.fi/api/v1/token` (public) |
| Token address (Ethereum) | `0xc845b2894dbddd03858fd2d643b4ef725fe0849d` (ISIN CH1436219195). The ERC-4626 wrappers are v1 `0x93e62845c1dd5822ebc807ab71a5fb750decd15a` (legacy, do not integrate) and current `0xa8ddb5cd96b5222afe198316e9a57caa642850d5`. | xStocks API |
| Decimals | 18 (on chain) | `decimals()` |
| Total supply | 110180538701145229619549 (about 110,180.5) | `totalSupply()` |
| Contract | Transparent proxy. The implementation `0x65c40d624af3b18c109fbf87b7deff34cdc5f19b` is `BackedAutoFeeTokenImplementation`, verified on Blockscout (solc 0.8.9). The admin `0x696c685a02a1fc6e2aacbe26cd6695f4f4a6a085` has owner `0x49754062E35f7591B93cc4F9915965be89643a65`, which is also the token owner. The issuer can upgrade it. | Blockscout API v2, storage slots |
| Transfer hooks | `BackedTokenImplementation._beforeTokenTransfer` runs `require(!isPaused)`. If neither `from` nor `to` is zero, it also runs `require(!sanctionsList.isSanctioned(from))` and `require(!sanctionsList.isSanctioned(to))`. `_spendAllowance` checks the spender. | verified source |
| Who can hold or receive | Anyone who is not sanctioned. `sanctionsList` is `0x40C57923924B5c5c5455c48D93317139ADDaC8fb` (the Chainalysis oracle). There is no allowlist and no issuer blocklist. The docs say the tokens are "freely transferable" and "permissionless". | source, on chain, FAQ |
| Pause | Global `isPaused`, set by pauser `0x8768cDA7A463DAe1baA6b2500EFB025ebd7FFC50`. It is false today. | on chain |
| Burn | The burner can burn only its own balance or the token contract's balance (`account == _msgSender() \|\| account == address(this)`). It **cannot** burn from a third party. | source |
| Rebasing | **Yes.** `balanceOf = sharesOf(account) * currentMultiplier / 1e18`. The multiplier is currently 1001701196801074000, and there have been 2 updates. Multiplier updates for dividends and splits activate at 00:30 UTC after the ex-date. Issuer docs say "xStocks cannot integrate natively with DeFi protocols" and point to the ERC-4626 wrapper. | source; docs.xstocks.fi developers/multipliers and wrapped-xstocks |
| Fee-on-transfer | None per transfer. A management fee works through the multiplier (`feePerPeriod`, which lowers the multiplier each `periodLength` of 604800 s). `feePerPeriod` is 0 today. The owner can raise it, which would shrink every balance. Transfers turn the amount into shares (rounding down), so a recipient may receive 1 wei less than `amount`. | source and on-chain reads |
| Redemption | Only through the primary market: KYC/AML onboarding, a whitelisted wallet, a $5,000 minimum, issuer fees "currently set to 0", on US business days (24/5). Not offered to US persons. | docs.xstocks.fi issuance-and-redemption, FAQ |

Evidence that a contract we do not control can hold it:
- Simulated `transfer` calls from the Gnosis Safe holder `0x57c9F34252ca1cD57663004609DA9F2C8b2352B9` succeed to `0x1111…`, to the USDC contract and to the CCTPx manager `0x8582…`, for both 1 wei and 1e18.
- `isSanctioned(0x8582…)` returns false.

Why lock and wrap is unsafe for raw xStocks:
- A LOCK_UNLOCK manager holds a rebasing balance while the wrapped supply on Arc stays fixed. After a dividend or split, the locked balance and the Arc supply no longer match one to one.
- A fee increase would leave the Arc supply larger than the locked backing.
- Rounding when amounts are turned into shares can give the manager less than the amount it recorded.
- Circle's CCTPx docs say nothing about rebasing or fee-on-transfer tokens.

A workable path would be to lock the current non-rebasing ERC-4626 wrapper (`0xa8dd…`) instead of NVDAx. That is untested and not registered in CCTPx.

## Shared cross-check

Both issuers point to the same sanctions oracle, `0x40C57923924B5c5c5455c48D93317139ADDaC8fb`. Chainalysis' own oracle docs (go.chainalysis.com/chainalysis-oracle-docs.html, fetched 2026-11-06) list this address as the Ethereum oracle.

## Discrepancies

1. **Manager owner.** Circle docs say an ownerless manager has "no owner or operator at configuration". The manager `0x8582…` has `operator` = 0x0, but `owner()` returns the EOA `0x173d00f7e8702d176628963FbD4E1Bcc18B29F94`. What that owner can do is unknown, because the manager source is not published.
2. **Arc domain 26.** Circle's supported-chains page labels domain 26 "Arc Testnet". The contract-addresses page lists "Arc" mainnet as domain 26 at `0x4318…` on explorer.arc.io. On-chain reads on Arc mainnet (chainId 5042) match the mainnet listing.
3. **Ondo transfer screening.** A search snippet described Ondo as using "transfer hooks for address screening". The code shows deny-list screening only (blocklist plus sanctions), with no allowlist.
4. **No independent news.** A news search (2026-11-06, extended mode) found no independent report of Ondo tokens on Arc through CCTPx. The only evidence is Circle's Iris registry and on-chain state.

## Not verified

- **TokenManager source.** The source of the CCTPx TokenManager (`0x8582…`) and of `CrossChainToken`. Circle says the contracts are not yet open-sourced, and they are not verified on Sourcify or Blockscout. Not verified:
  - what the manager's `owner()` can do;
  - whether the manager measures balance deltas or trusts `amount`.
- **Second registration.** Whether a second `registerOwnerlessToken` for NVDAon reverts or returns the existing tokenId. This was inferred from `getOwnerlessTokenId` and not tested.
- **Ondo policy.** Whether Ondo would blocklist or burn from the CCTPx manager in practice. Ondo has no published policy on this.
- **Arc denylist.** Who controls the Arc `denylistProvider` `0x3ebE…`, and what it currently blocks.
- **xStocks wrapper.** Whether the current xStocks ERC-4626 wrapper `0xa8dd…` has its own transfer restrictions; its source was not read.
- **Final terms.** The NVDAx Final Terms PDF (ISIN CH1436219195) and the Ondo GM legal terms were not read. The redemption terms above come from the issuers' doc sites only.
- **Other tokens.** Only NVDAon and NVDAx were checked on chain. The other Ondo tokens and other xStocks were not.

Checked: Ondo docs (addresses, investing-and-redeeming, transferability, eligibility, corporate-actions, secondary-market restrictions); GMToken and compliance sources on Sourcify; the NVDAon pause, compliance and transfer simulations; the Circle CCTPx docs (overview, ownerless vs custom, architecture, contract reference, chains, addresses, denylist layers, ownerless configuration); the Iris mainnet registry; the CCTPx service and manager state; the registration and lock transactions; the Arc mainnet token state; the xStocks docs (FAQ, how it works, legal overview, multipliers, wrapped xStocks, issuance and redemption, bridge); the xStocks public token API; the NVDAx verified source and on-chain configuration; the NVDAx transfer simulations; the Chainalysis oracle docs.

Not checked: TokenManager and CrossChainToken source (not public); the Final Terms PDFs; the xStocks wrapper source; any token other than NVDAon and NVDAx. The newest source was fetched on 2026-11-06.
