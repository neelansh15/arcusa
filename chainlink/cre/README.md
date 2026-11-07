# Chainlink CRE parity monitor

A [Chainlink Runtime Environment](https://docs.chain.link/cre) workflow that checks, for one wrapped stock at a time (NVDA or TSLA), whether Arcusa's bridge and oracle agree with their sources. It is run with `cre workflow simulate`. It is **not deployed** on the CRE network.

## What it does

On a cron trigger (every 5 minutes in the config; the simulator runs the trigger once) the handler reads four things:

| # | Read | Chain / source | Call |
| - | - | - | - |
| a | locked provider tokens | Ethereum Sepolia (`ethereum-testnet-sepolia`) | `mToken.balanceOf(tokenManager)` |
| b | wrapped supply | Arc Testnet (`arc-testnet`) | `wToken.totalSupply()` |
| c | oracle round | Arc Testnet | Studio `PriceOracle.latestRound()` |
| d | source price | xStocks HTTP API (same endpoint `services/price/server.mjs` polls) | `GET https://api.xstocks.fi/api/v2/public/assets/{SYM}x/price-data` |

It returns a JSON report: `lockedMinusWrapped`, the oracle-versus-source deviation in basis points, three checks and a `healthy` flag. Thresholds are in the config: oracle age at most 60 s (ADR 0015 `maxAge` in session) and absolute deviation at most 30 bps (ADR 0015 base spread). `lockCoversWrapped` is `locked >= wrapped` (ADR 0015: "alert if locked < wrapped supply"). The 30 bps limit is our reading of the ADR, not a value it states for this purpose.

Addresses live in `parity-monitor/config.nvda.json` and `config.tsla.json` (from `deployments/arc-testnet.json` and `app/src/lib/config.ts`). They hold addresses only; no keys. `secrets.yaml` holds no names in use. `.env` is gitignored.

Both chains are in the tenant's `cre workflow supported-chains` list (checked 2026-11-07).

## Run it

Needs the CRE CLI (v1.39.0 used), Bun, and `cre login` with a Chainlink account.

```bash
cd chainlink/cre
bun install --cwd ./parity-monitor
cre workflow simulate parity-monitor --target staging-settings --non-interactive --trigger-index 0
cre workflow simulate parity-monitor --target staging-settings --config config.tsla.json --non-interactive --trigger-index 0
```

The first command uses the NVDA config (the default in `workflow.yaml`), the second the TSLA one.

## Sample output (real, 2026-11-07, simulator)

NVDA:

```json
{"symbol":"NVDA","chains":{"source":"ethereum-testnet-sepolia","arc":"arc-testnet"},"locked":"5.000000000000000000","wrapped":"5.000000000000000000","lockedMinusWrapped":"0.000000000000000000","oracle":{"priceUsd":188.275,"publishTime":1794012482,"ageSeconds":10,"stale":false},"source":{"priceUsd":188.29,"url":"https://api.xstocks.fi/api/v2/public/assets/NVDAx/price-data"},"deviationBps":-0.8,"thresholds":{"maxOracleAgeSeconds":60,"maxDeviationBps":30},"checks":{"lockCoversWrapped":true,"oracleFresh":true,"deviationWithinLimit":true},"healthy":true}
```

TSLA:

```json
{"symbol":"TSLA","chains":{"source":"ethereum-testnet-sepolia","arc":"arc-testnet"},"locked":"10.000000000000000000","wrapped":"10.000000000000000000","lockedMinusWrapped":"0.000000000000000000","oracle":{"priceUsd":359.27,"publishTime":1794012457,"ageSeconds":54,"stale":false},"source":{"priceUsd":359.275,"url":"https://api.xstocks.fi/api/v2/public/assets/TSLAx/price-data"},"deviationBps":-0.14,"thresholds":{"maxOracleAgeSeconds":60,"maxDeviationBps":30},"checks":{"lockCoversWrapped":true,"oracleFresh":true,"deviationWithinLimit":true},"healthy":true}
```

Both runs printed `Workflow compiled` and `Workflow Simulation Result`; all four reads succeeded. The TSLA oracle was 54 s old, close to the 60 s limit; that is the relayer's push cadence, not a monitor fault. Run on one machine once; the figures change every run.

## What it does NOT do

- It is not deployed on the CRE network (the account shows "Deploy Access: Not enabled"). It was only simulated. Deployment access was requested with `cre account access` on 2026-11-07 (purpose: Hackathon) and is pending; this file will say so if it is granted.
- It does not write onchain and does not feed the oracle. The oracle price still comes from xStocks through our own relayer.
- It does not replace the relayer or any contract check.
- It uses no Chainlink Data Feeds or Data Streams. The price source is the xStocks API.
- The simulator runs a single node, so HTTP and read consensus are not exercised across a real DON.
- It monitors; nothing acts on `healthy=false`.

See ADR 0028 (`docs/adr/0028-chainlink-cre-parity-monitor.md`).
