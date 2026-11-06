Scripts used to deploy the second wrapped token (mTSLA), following docs/runbooks/deploy-wrapped-token.md.
Run from a folder with `viem`, `solc`, `@circle-fin/bridge-kit` and `@circle-fin/adapter-viem-v2` installed.
They read the deployer key from `~/.arcusa/arcusa-testnet-wallet.json` (never in the repo) and keep state in `state.json` in the working directory.
Token addresses are hard-coded for TSLA; edit them for another token.

1. `node compile.mjs <repo root>` compiles contracts/sepolia/src/MockTSLAToken.sol to MockTSLAToken.json.
2. `node run.mjs` deploys, mints, registers, requests the Arc wrapper and waits for it (about 20 min).
3. `node verify.mjs` reads the wrapper and the locked balance.
4. `node bridge.mjs` bridges 10 tokens to Arc (SLOW, about 19 min).
5. `node market.mjs <repo root> deploy` then `node market.mjs <repo root> deposit <wTSLA> <USDC>`.
