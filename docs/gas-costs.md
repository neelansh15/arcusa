# Gas costs of the main contract transactions

Measured on 2026-11-06 from the receipts of the deployer wallet `0x07621e39424914f633D478DdE751f3FF728CB351`. Gas used is exact. Fees in wei are testnet-specific: Sepolia gas was about 20 wei, so its ETH fees are near zero and only the gas units and fixed fees carry over to mainnet. Arc charges gas in USDC.

Sources: Sepolia receipts via eth-sepolia.blockscout.com, Arc receipts via testnet.arcscan.app, plus LOG.md.

## 1. Creating the wrapper token (one-time per token)

| Step | Chain | Tx | Gas used |
|---|---|---|---|
| `registerOwnerlessToken` | Sepolia | `0x3b946d738e4db14994bda7037e180f33d9e9bd0bb973b0931367194799b5e1bc` | 2,515,786 |
| `deployRemoteOwnerlessToken` (creates wNVDA on Arc) | Sepolia | `0x4fd4052e56e5b9d38a178cc0d612715a4770db311195e1daaf71cec552b58cc0` | 305,443 |

- Total: about 2.82M gas on the source chain.
- Fixed fee: the deploy tx carries a signed quote from Circle's Iris API, 142,720,395,729,835 wei (0.00014272 ETH). It does not depend on gas price.
- The Arc side of the deployment needed no transaction from us.
- Not part of production cost: deploying the mock mNVDA token (4,742,009 gas, tx `0xb138a26cd1213dd6a8e7320fc87fd995e7b0d9f963c8de4d3f600d4d21342337`) and minting it (241,011 gas). A real token already exists.
- Result: wNVDA on Arc `0x5ad2862787d5C7F42a09014CE4C973d162878a16`.

## 2. Bridging tokens (cost is per transfer, not per amount)

| Leg | Step | Tx | Gas used | Fee |
|---|---|---|---|---|
| Sepolia to Arc (lock) | approve | `0xa23dddd0...2fc557` (first approval) | 128,309 | about 0 on testnet |
| Sepolia to Arc (lock) | approve | `0xb771e0a6...a1ebbf` | 20,389 | about 0 on testnet |
| Sepolia to Arc (lock) | `crossChainTransfer` | `0xd5deba9d...495b06` | 445,229 | 8,459,351 wei (testnet) |
| Arc to Sepolia (burn) | approve | `0xdb41d721...` | 44,197 | 0.00089 USDC |
| Arc to Sepolia (burn) | `crossChainTransfer` | `0x459d52fa...` | 354,297 | 0.00713 USDC |

- Rule of thumb for a top-up from Ethereum: about 0.45M gas per transfer plus an approve (20k, or 128k on a first-ever approval). At 1 gwei that is about 0.00045 ETH. This is an estimate, not a measurement on mainnet.
- Arc legs cost under one cent in USDC.
- The destination mint is paid by the forwarder (`useForwarder: true`).
- Not captured: Circle's forwarding fee for the mNVDA legs. Bridge Kit returned `fees: null`. The earlier USDC bridge test (T-004) cost about 0.017 USDC per 1 USDC transfer, which is the closest reference.
- SLOW transfers take about 16 minutes Sepolia to Arc and about 28 seconds Arc to Sepolia. FAST reverted in simulation and is untested.

## 3. Market contract transactions on Arc testnet

| Action | Gas used | Fee (USDC) |
|---|---|---|
| Deploy `PriceOracle` | 959,335 | 0.0201 |
| Deploy `InventoryMarket` | 1,671,971 | 0.0351 |
| `setRelayer` | 47,904 | 0.0010 |
| `deposit` (owner, USDC) | 59,838 | 0.0013 |
| `deposit` (owner, wNVDA) | 106,363 | 0.0022 |
| `buy` | 157,186 | 0.0033 |
| `sell` | 139,824 | 0.0029 |

Arc enforces a 20 gwei fee floor, so these fees are real-world representative.

## Not measured

- Mainnet gas prices and the Circle forwarding fee for non-USDC tokens.
- Gas for oracle price pushes by the relayer (it pushes when the price moves more than 0.1%, or every 60 seconds).
