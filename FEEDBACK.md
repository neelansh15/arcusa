# Feedback on Arc, Circle and the developer tooling

Problems we hit while building arcusa, with what we expected, what happened and a suggested fix. Each item says how we found it and on what date. Items marked "observed" were seen on a real machine or chain; items marked "docs only" are page-versus-page contradictions we read but have not yet exercised. Newest source date: 2026-11-06.

Keep adding to this file as we go. Any spike that finds a mismatch should add an entry here (the task Result links to it).

## 1. Arc Foundry install (`arc-forge`, `arc-cast`, `arc-anvil`)

Source: https://github.com/circlefin/arc-foundry, section "Precompiled binaries". Observed 2026-11-06 on macOS (Apple silicon), following the README steps exactly.

The README says to extract the archive, move the binaries to `~/.local/bin` with the `arc-` prefix, and run `arc-forge --version`. Three things then failed in a row, and none is mentioned in the README or in the Arc install tutorial.

| # | What happened | Expected | Suggested fix |
|---|---|---|---|
| 1.1 | `zsh: command not found: arc-forge` even though `ls ~/.local/bin` lists the file. macOS zsh does not put `~/.local/bin` on PATH by default. | The README steps end with a working command. | Add the line `export PATH="$HOME/.local/bin:$PATH"` (and say which shell file to put it in) right after the `mv` commands. |
| 1.2 | macOS Gatekeeper: "arc-forge Not Opened. Apple could not verify arc-forge is free of malware". The binary is unsigned or not notarized, and the download carries the quarantine flag. The dialog's default button is "Move to Trash". | A documented way to run the binary. | Notarize the macOS binaries, or document `xattr -d com.apple.quarantine ~/.local/bin/arc-*` and tell users to verify the `.sha256` first. |
| 1.3 | `dyld: Library not loaded: /opt/homebrew/opt/libusb/lib/libusb-1.0.0.dylib`, then `zsh: abort`. The binary is dynamically linked to Homebrew's libusb, which a fresh Mac does not have. | The "precompiled binary" runs on its own. | Document `brew install libusb` as a prerequisite, or link libusb statically. A missing-library abort gives a new user no hint. |

Impact: about 10 minutes lost on a task that is meant to be a one-line check, and a user who does not know Gatekeeper may delete the binary. The install tutorial (https://docs.arc.io/arc/tutorials/install-arc-foundry.md) should be checked for the same gaps.

## 2. Docs that disagree with each other or with the chain

Observed or read during research on 2026-11-05 and 2026-11-06. Details and sources are in `PLAN.md` ("Doc discrepancy to remember") and in the "Not verified" sections of the ADRs.

| # | Mismatch | Status | Suggested fix |
|---|---|---|---|
| 2.1 | The Arc Bridge page, the provider README and `llms.txt` say "USDC and EURC only". The supported-tokens page and Circle's announcement list WETH, cirBTC and CCTPx third-party assets. | docs only | Update the stale pages. AI tools read `llms.txt`, so it spreads the wrong answer. |
| 2.2 | `maxTransferAmount = 0` is "no cap" in the quickstarts but "blocks all transfers" in the rate-limits how-to. | docs only | Say which is true on the live contract. |
| 2.3 | The quickstart polls `resolveTokenAddress` and expects a zero address for an unregistered token. On chain, the call reverts with `TokenNotRegistered` (`0x5d0028cf`). | observed in the contract ABI and error data; the live call is checked in T-024 | Fix the quickstart's polling loop to catch the revert. |
| 2.4 | Quickstarts say to confirm a non-zero rate limit. The ownerless docs say there is no rate limit by default. An ownerless token read on chain had both limits at uint256 max and a zero operator, so there is nothing to set. | observed on chain, 2026-11-06 | Say in the quickstart that the rate-limit step only applies to custom tokens. |
| 2.5 | Circle's docs say ownerless token managers have no owner. A manager for an already-wrapped Ondo token has an `owner()` EOA (`0x173d00f7e8702d176628963FbD4E1Bcc18B29F94`). | observed on chain; what the owner can do is unknown (the manager source is not public) | Document what the owner can do, and publish the manager source. |
| 2.6 | Bridge Kit takes a bytes32 CCTPx **token id**, not a token address, and the token must be in Circle's Iris registry (`GET /v2/cctpx/tokens`). The Bridge Kit docs and the CCTPx contract docs talk in token addresses. | docs only, T-024 exercises it | Show the token id in the Bridge Kit non-USDC example, and say how to get one. |
| 2.7 | Arc's oracle page lists Pyth, but only Pyth Pro is deployed on Arc testnet. The Hermes endpoint returns 401 without a key. | observed (Hermes 401), 2026-11-06 | Say Pyth Pro needs an access token, and which Pyth products exist on testnet. |
| 2.8 | The CCTP Fast Transfer docs do not say whether Fast applies to non-USDC tokens. Circle's docs imply a Fast quote is rejected for a token without an FX symbol (`FX_SYMBOL_NOT_CONFIGURED`). | docs only, T-024 checks it with a real quote | State plainly which tokens get Fast Transfer. |

## 3. Earlier mismatch between the docs and the SDK

Early in the build (before the ADRs) our first plan, based on the docs, did not match what the SDK and Bridge Kit accept: the plan assumed a custom token address could be passed to Bridge Kit, while the SDK takes a token id (item 2.6). We recorded the fix in `PLAN.md` ("Resolved Nov 6"). The laptop session that hit the SDK side should add exact versions, calls and error messages here before submission.

## What would have helped

- One end-to-end non-USDC example (register, deploy remote, bridge, check balance) that has been run on testnet, with the token id printed.
- A "known gotchas" box on the install page: PATH, Gatekeeper, libusb.
- Dated pages. Several pages read as current and are not.
