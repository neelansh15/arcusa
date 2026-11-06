/**
 * Every word on the landing page lives here, so a later re-word is one file (ADR 0021).
 * Each claim carries its source. Allowed claims: ONE stock (a mock NVDA token), ONE home chain
 * (Ethereum Sepolia), ONE settlement chain (Arc testnet). No speed or fee numbers, no provider names,
 * no other tickers or chains drawn. Disclaimer wording is ADR 0016.
 */

export const DISCLAIMER_SHORT = "Testnet demo. Not a security, no real shares, no real value."; // ADR 0016

export const HERO = {
  eyebrow: "Testnet demo · no real money",
  h1a: "Bringing US stocks",
  h1b: "to Arc",
  lead: "Buy a mock NVIDIA stock token with digital dollars. One balance, settled on Arc. Try it free on testnet.", // docs/how-it-works: USDC is Arc gas; mock token ADR 0016
  primary: "Open the app",
  secondary: "See how it works",
  note: DISCLAIMER_SHORT,
  mockCaption: "Illustration. The app uses the same look.",
};

export const STEPS = [
  {
    n: "1",
    title: "Add USDC",
    body: "Put some test USDC in your wallet. On Arc, USDC also pays the fees, so it is the only balance you need.", // PLAN.md facts; docs/how-it-works
  },
  {
    n: "2",
    title: "Pick a stock",
    body: "Choose NVDA. You see the price, and the cost of trading, before you confirm.", // order ticket shows spread and exec price
  },
  {
    n: "3",
    title: "Tap Buy",
    body: "Your wallet signs and the trade settles in a single transaction on Arc. The first time, you also approve USDC.", // docs/how-it-works items 1 and 5; order-ticket approve then trade
  },
];

export const TILES = [
  { id: "one", title: "One balance", body: "USDC is the price and the fee. No second coin to buy first." }, // docs/how-it-works
  { id: "price", title: "A price you can check", body: "The market quotes around a price published on-chain, so you can see where it comes from." }, // docs/oracle
  { id: "cost", title: "See the cost first", body: "Buy and sell prices, and the gap between them, are shown before you trade." }, // order ticket / market table
  { id: "phone", title: "Made for your phone", body: "The same app, built for thumbs. Slide the ticket up and tap Buy." }, // T-039
  { id: "bridge", title: "Bring funds in", body: "Move test tokens from Ethereum Sepolia to Arc on the bridge page. Demo only." }, // docs/bridge, ADR 0017
  { id: "chain", title: "It is all on-chain", body: "Every trade is a transaction you can open in the Arc explorer." }, // order-ticket toast links explorer
];

export const CALC = {
  h2: "Try the numbers.",
  lead: "Enter an amount of USDC to see roughly how much mock NVDA it buys.",
  label: "You pay (USDC)",
  out: "You get about",
  fine: "Estimate at the indicative price. Fees and slippage not included. Testnet, not a quote.",
};

export const PHONE = {
  h2: "Made for your phone.",
  lead: "The ticket slides up from the bottom. Pick an amount, tap Buy, done.",
  caption: "Illustration of the mobile app.",
};

export const FAQ = [
  {
    q: "What is arcusa?",
    a: "A simple app to buy and sell a stock token with USDC. Today it is a demo that runs on a test network.", // docs home
  },
  {
    q: "Is this real money?",
    a: "No. It runs on Arc testnet. The tokens have no value, are not shares, and nothing here is investment advice.", // ADR 0016
  },
  {
    q: "What is USDC?",
    a: "USDC is a stablecoin: a digital token designed to stay worth one US dollar. On Arc it is also what you use to pay fees.", // PLAN.md
  },
  {
    q: "Why Arc?",
    a: "Arc is Circle's blockchain, where USDC is the fee currency. That is why one balance covers the price and the fee.", // PLAN.md goal
  },
  {
    q: "What stocks can I buy?",
    a: "One for now: a mock NVDA token. More stocks and chains are on the roadmap, and are not live.", // docs home callout
  },
  {
    q: "How is the price set?",
    a: "A price is published on-chain and the market quotes a buy price and a sell price around it. When the US market is closed, the demo uses the last known price and says so.", // docs/oracle, ADR 0015
  },
  {
    q: "What are the risks?",
    a: "It is a demo. The contracts have not been audited and prices are indicative and can be stale. Read the risks page before you try anything bigger.", // docs/risks
  },
];

export const CTA = {
  h2: "Try it in a minute.",
  lead: "Connect a wallet on Arc testnet and place a test trade.",
  button: "Open the app",
};

export const HOOD = [
  { label: "How it works", href: "/docs/how-it-works" },
  { label: "Risks", href: "/docs/risks" },
  { label: "Contracts", href: "/docs/contracts" },
  { label: "Roadmap", href: "/docs/roadmap" },
];

export const FOOTER_DISCLAIMER =
  "Demo only. The deployment runs on Arc testnet; tokens have no monetary value, are not backed by or redeemable for real shares, and nothing here is investment advice. Prices on this page are indicative or illustrative. Multi-chain support and more stocks are roadmap goals and are not live.";
