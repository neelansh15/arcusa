import Link from "next/link";
import type { CSSProperties } from "react";
import { CandleChart, Logo, icons } from "./graphics";
import { LiveQuote } from "./live-quote";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/* ---------- Nav ---------- */

export function Nav() {
  return (
    <header className="lp-nav">
      <div className="lp-container lp-nav-inner">
        <a href="#top" className="lp-brand" aria-label="arcusa home">
          <Logo />
          <span>arcusa</span>
        </a>
        <nav className="lp-nav-links" aria-label="Sections">
          <a href="#features">Product</a>
          <a href="#how">How it works</a>
          <a href="#bridge">Bridge</a>
        </nav>
        <div className="lp-nav-right">
          <span className="lp-testnet">Arc testnet demo</span>
          <Link href="/trade" className="lp-btn lp-btn-primary lp-btn-sm">
            Launch app
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */

export function Hero() {
  return (
    <section className="lp-hero" id="top">
      <div className="lp-container lp-hero-inner">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow lp-load" style={delay(0)}>
            Tokenized US equities on Arc
          </p>
          <h1 className="lp-h1 lp-load" style={delay(60)}>
            US stocks from every chain, settled in USDC.
          </h1>
          <p className="lp-lead lp-load" style={delay(120)}>
            arcusa is a trading terminal for tokenized US stocks on Arc, Circle&apos;s L1. The goal: bring tokenized
            equities from Ethereum, BNB Chain, Base, Solana and more onto Arc, and trade them against USDC at an
            oracle-anchored price, with CCTP and Bridge Kit moving the funds.
          </p>
          <div className="lp-cta-row lp-load" style={delay(180)}>
            <Link href="/trade" className="lp-btn lp-btn-primary lp-btn-lg">
              Open the terminal {icons.arrow}
            </Link>
            <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">
              How it works
            </a>
          </div>
          <p className="lp-note lp-load" style={delay(240)}>
            Live demo on Arc testnet, no real money.
          </p>
        </div>

        <div className="lp-hero-visual lp-load" style={delay(140)}>
          <div className="lp-chart-card">
            <div className="lp-chart-head">
              <div className="lp-pair">
                <span className="lp-pair-logo">N</span>
                <div>
                  <b>NVDA / USDC</b>
                  <span>Tokenized NVIDIA</span>
                </div>
              </div>
              <div className="lp-tf" aria-hidden="true">
                <span>1m</span>
                <span className="on">5m</span>
                <span>1h</span>
              </div>
            </div>
            <LiveQuote />
            <div className="lp-chart-body">
              <CandleChart />
            </div>
            <div className="lp-chart-foot">
              <span>Oracle price · illustrative preview</span>
              <span>USDC settlement</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Features ---------- */

const FEATURES = [
  {
    icon: icons.stock,
    title: "Tokenized US stocks",
    body: "On-chain tokens that track US equities. NVDA is the first listing; more tickers and issuers are the roadmap.",
    tag: "Live: NVDA",
  },
  {
    icon: icons.usdc,
    title: "USDC settlement",
    body: "Every trade is quoted and settled in USDC, which is also the gas token on Arc. One balance, no volatile gas asset.",
    tag: "Live",
  },
  {
    icon: icons.oracle,
    title: "Oracle-priced market",
    body: "Prices are published on-chain, so every fill is anchored to a reference price anyone can verify.",
    tag: "Live",
  },
  {
    icon: icons.book,
    title: "Inventory market",
    body: "An on-chain inventory market quotes a bid and ask around the oracle price. You see the spread before you trade.",
    tag: "Live",
  },
  {
    icon: icons.bridge,
    title: "Multi-chain in",
    body: "Bring tokenized stocks and USDC from Ethereum, BNB Chain, Base, Solana and others to Arc using CCTP and Bridge Kit.",
    tag: "Roadmap",
  },
  {
    icon: icons.terminal,
    title: "A real terminal",
    body: "Candlestick chart, order ticket, balances and recent trades in one dense screen.",
    tag: "Live",
  },
];

export function Features() {
  return (
    <section className="lp-section" id="features">
      <div className="lp-container">
        <div className="lp-section-head" data-reveal>
          <span className="lp-kicker">Product</span>
          <h2 className="lp-h2">A brokerage feel on an on-chain engine.</h2>
        </div>
        <div className="lp-features">
          {FEATURES.map((f, i) => (
            <article className="lp-feature" key={f.title} data-reveal style={delay(i * 40)}>
              <div className="lp-feature-top">
                <div className="lp-feature-ic">{f.icon}</div>
                <span className={`lp-tag ${f.tag === "Roadmap" ? "road" : ""}`}>{f.tag}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */

const STEPS = [
  {
    icon: icons.bridge,
    title: "Bring assets to Arc",
    body: "Move USDC and tokenized stocks from Ethereum, BNB Chain, Base, Solana and other chains with CCTP and Bridge Kit.",
  },
  { icon: icons.wallet, title: "Connect", body: "Connect a wallet on Arc. USDC pays for gas, so there is no second token to hold." },
  { icon: icons.swap, title: "Trade against USDC", body: "Pick buy or sell, check the oracle-anchored bid/ask, and submit from the order ticket." },
  { icon: icons.check, title: "Settle on Arc", body: "The fill settles in one transaction: tokens and USDC land in your wallet." },
];

export function HowItWorks() {
  return (
    <section className="lp-section lp-how" id="how">
      <div className="lp-container">
        <div className="lp-section-head" data-reveal>
          <span className="lp-kicker">How it works</span>
          <h2 className="lp-h2">From any chain to a filled order in four steps.</h2>
        </div>
        <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li className="lp-step" key={s.title} data-reveal style={delay(i * 50)}>
              <em>{String(i + 1).padStart(2, "0")}</em>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Bridge / USDC ---------- */

const CHAINS = [
  { name: "Ethereum", state: "Demo: Sepolia testnet", live: true },
  { name: "BNB Chain", state: "Planned", live: false },
  { name: "Base", state: "Planned", live: false },
  { name: "Solana", state: "Planned", live: false },
  { name: "More chains", state: "Planned", live: false },
];

export function Bridge() {
  return (
    <section className="lp-section lp-bridge" id="bridge">
      <div className="lp-container lp-bridge-inner">
        <div className="lp-bridge-copy" data-reveal>
          <span className="lp-kicker">Multi-chain in, USDC on Arc</span>
          <h2 className="lp-h2">Native USDC. No wrappers.</h2>
          <p className="lp-body">
            Circle&apos;s Cross-Chain Transfer Protocol burns USDC on the source chain and mints it natively on Arc once
            Circle attests to the burn. Bridge Kit packages the flow for apps. arcusa builds on both so funds and
            tokenized stocks from many chains end up in one place, priced by an oracle and settled in USDC.
          </p>
          <ul className="lp-checks">
            <li>{icons.check} Burn on the source chain</li>
            <li>{icons.check} Attestation from Circle</li>
            <li>{icons.check} Mint native USDC on Arc</li>
            <li>{icons.check} Trade right away: USDC is also gas</li>
          </ul>
        </div>
        <div className="lp-bridge-visual" data-reveal style={delay(80)}>
          <div className="lp-bridge-card">
            <div className="lp-bridge-head">
              <span>Source chain</span>
              <span>Status</span>
            </div>
            <ul className="lp-chains">
              {CHAINS.map((c) => (
                <li key={c.name}>
                  <b>{c.name}</b>
                  <span className={c.live ? "on" : ""}>{c.state}</span>
                </li>
              ))}
            </ul>
            <div className="lp-bridge-dest">
              <span>Destination</span>
              <b>Arc · settled in USDC</b>
            </div>
          </div>
          <p className="lp-fine">Today the in-app bridge moves testnet USDC from Ethereum Sepolia. Other chains are the goal, not yet live.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats ---------- */

const STATS = [
  { k: "USDC", v: "Quote, settlement and gas", s: "one asset for everything" },
  { k: "Oracle", v: "On-chain reference price", s: "verifiable fills" },
  { k: "CCTP", v: "Native USDC transfers", s: "burn, attest, mint" },
  { k: "NVDA", v: "First listed equity", s: "more tickers on the roadmap" },
];

export function Stats() {
  return (
    <section className="lp-section lp-stats-sec" aria-label="At a glance">
      <div className="lp-container">
        <div className="lp-stats">
          {STATS.map((s, i) => (
            <div className="lp-stat" key={s.k} data-reveal style={delay(i * 40)}>
              <b>{s.k}</b>
              <span>{s.v}</span>
              <small>{s.s}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */

export function FinalCta() {
  return (
    <section className="lp-section lp-final">
      <div className="lp-container">
        <div className="lp-final-card" data-reveal>
          <h2 className="lp-h2">Open the terminal.</h2>
          <p className="lp-body">Connect a wallet and place an on-chain stock trade settled in USDC.</p>
          <div className="lp-cta-row center">
            <Link href="/trade" className="lp-btn lp-btn-primary lp-btn-lg">
              Launch arcusa {icons.arrow}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <div className="lp-footer-brand">
          <a href="#top" className="lp-brand">
            <Logo size={24} />
            <span>arcusa</span>
          </a>
          <p>Live demo on Arc testnet, no real money. Built for ETHGlobal.</p>
        </div>
        <nav className="lp-footer-links" aria-label="Footer">
          <Link href="/trade">Terminal</Link>
          <a href="#features">Product</a>
          <a href="#how">How it works</a>
          <a href="https://www.arc.network" target="_blank" rel="noreferrer">
            Arc
          </a>
          <a href="https://developers.circle.com/cctp" target="_blank" rel="noreferrer">
            Circle CCTP
          </a>
        </nav>
      </div>
      <div className="lp-container lp-disclaimer">
        Demo only. The deployment runs on Arc testnet; tokens have no monetary value, are not backed by or redeemable
        for real shares, and nothing here is investment advice. Prices on this page are illustrative. Multi-chain
        support is a roadmap goal and is not live.
      </div>
    </footer>
  );
}
