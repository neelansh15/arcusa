import Link from "next/link";
import type { CSSProperties } from "react";
import { BridgeDiagram, CandleChart, Logo, Sparkline, icons } from "./graphics";
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
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#bridge">Bridge</a>
        </nav>
        <div className="lp-nav-right">
          <span className="lp-testnet">
            <i /> Testnet
          </span>
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
      <div className="lp-hero-bg" aria-hidden="true">
        <div className="lp-grid" />
        <div data-parallax="0.18" className="lp-orb-wrap">
          <div className="lp-orb lp-orb-a" />
        </div>
        <div data-parallax="0.08" className="lp-orb-wrap">
          <div className="lp-orb lp-orb-b" />
        </div>
        <div data-parallax="0.12" className="lp-orb-wrap">
          <div className="lp-orb lp-orb-c" />
        </div>
      </div>

      <div className="lp-container lp-hero-inner">
        <div className="lp-hero-copy">
          <a href="#how" className="lp-eyebrow lp-load" style={delay(0)}>
            <span className="lp-eyebrow-tag">ETHGlobal Mumbai</span>
            Live demo on Arc testnet
            {icons.arrow}
          </a>
          <h1 className="lp-h1 lp-load" style={delay(80)}>
            US stocks,
            <br />
            <span className="lp-grad">settled in USDC.</span>
          </h1>
          <p className="lp-lead lp-load" style={delay(160)}>
            arcusa is a trading terminal for tokenized US equities on Arc, Circle&apos;s L1. Buy and sell NVDA against
            USDC at an on-chain oracle price, with a live bid/ask and a built-in CCTP bridge from Sepolia.
          </p>
          <div className="lp-cta-row lp-load" style={delay(240)}>
            <Link href="/trade" className="lp-btn lp-btn-primary lp-btn-lg">
              Open the terminal {icons.arrow}
            </Link>
            <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">
              See how it works
            </a>
          </div>
          <p className="lp-note lp-load" style={delay(320)}>
            Testnet demo. No real money, no real shares.
          </p>
        </div>

        <div className="lp-hero-visual lp-load" style={delay(200)}>
          <div className="lp-chart-card">
            <div className="lp-chart-head">
              <div className="lp-pair">
                <span className="lp-pair-logo">N</span>
                <div>
                  <b>NVDA / USDC</b>
                  <span>Tokenized NVIDIA · Arc testnet</span>
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
              <span>
                <i className="lp-live-dot" /> Oracle price · illustrative preview
              </span>
              <span className="lp-mono">USDC settlement</span>
            </div>
          </div>

          <div className="lp-float lp-float-a">
            <span className="lp-float-ic ok">{icons.check}</span>
            <div>
              <b>Order filled</b>
              <span>Bought 2.50 NVDA @ 182.45</span>
            </div>
          </div>
          <div className="lp-float lp-float-b">
            <span className="lp-float-ic">{icons.bridge}</span>
            <div>
              <b>CCTP transfer</b>
              <span>250.00 USDC · Sepolia → Arc</span>
            </div>
          </div>
          <div className="lp-float lp-float-c">
            <span className="lp-float-ic">{icons.oracle}</span>
            <div>
              <b>Oracle update</b>
              <span>NVDA price pushed on-chain</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Ticker marquee ---------- */

const TICKS = [
  { sym: "NVDA", name: "NVIDIA", px: "182.40", ch: "+1.94%", up: true, live: true },
  { sym: "AAPL", name: "Apple", px: "—", ch: "soon", up: true, live: false },
  { sym: "MSFT", name: "Microsoft", px: "—", ch: "soon", up: true, live: false },
  { sym: "TSLA", name: "Tesla", px: "—", ch: "soon", up: false, live: false },
  { sym: "AMZN", name: "Amazon", px: "—", ch: "soon", up: true, live: false },
  { sym: "GOOGL", name: "Alphabet", px: "—", ch: "soon", up: false, live: false },
  { sym: "META", name: "Meta", px: "—", ch: "soon", up: true, live: false },
];

function TickerRow({ hidden }: { hidden?: boolean }) {
  return (
    <div className="lp-ticker-row" aria-hidden={hidden || undefined}>
      {TICKS.map((t, i) => (
        <div className={`lp-tick ${t.live ? "live" : ""}`} key={t.sym}>
          <b>{t.sym}</b>
          <span className="lp-tick-name">{t.name}</span>
          <Sparkline seed={(i + 3) * 7919} up={t.up} />
          <span className="lp-mono">{t.px}</span>
          <span className={`lp-tick-ch ${t.live ? (t.up ? "up" : "down") : "soon"}`}>{t.ch}</span>
        </div>
      ))}
      <div className="lp-tick info">
        <b>USDC</b>
        <span className="lp-tick-name">native settlement on Arc</span>
      </div>
      <div className="lp-tick info">
        <b>CCTP</b>
        <span className="lp-tick-name">Sepolia → Arc testnet</span>
      </div>
    </div>
  );
}

export function Ticker() {
  return (
    <section className="lp-ticker" aria-label="Markets">
      <div className="lp-ticker-track">
        <TickerRow />
        <TickerRow hidden />
      </div>
    </section>
  );
}

/* ---------- Features ---------- */

const FEATURES = [
  {
    icon: icons.stock,
    title: "Tokenized US stocks",
    body: "Trade on-chain tokens that track US equities, starting with NVDA. More tickers are on the roadmap.",
  },
  {
    icon: icons.usdc,
    title: "USDC-native settlement",
    body: "Every trade is quoted and settled in USDC, which is also the gas token on Arc. One balance, no volatile gas asset.",
  },
  {
    icon: icons.oracle,
    title: "On-chain price oracle",
    body: "Prices are published on-chain, so every fill is anchored to a reference price anyone can verify.",
  },
  {
    icon: icons.book,
    title: "Inventory market, live bid/ask",
    body: "An on-chain inventory market quotes a bid and ask around the oracle price. You see the spread before you trade.",
  },
  {
    icon: icons.bridge,
    title: "Built-in CCTP bridge",
    body: "Bring testnet USDC from Ethereum Sepolia to Arc with Circle's CCTP: burn, attest, mint. No wrapped tokens.",
  },
  {
    icon: icons.terminal,
    title: "A real terminal",
    body: "Candlestick chart, order ticket, balances and recent trades in one dense, keyboard-friendly screen.",
  },
];

export function Features() {
  return (
    <section className="lp-section" id="features">
      <div className="lp-container">
        <div className="lp-section-head" data-reveal>
          <span className="lp-kicker">Features</span>
          <h2 className="lp-h2">
            A brokerage feel.
            <br />
            <span className="lp-dim">An on-chain engine.</span>
          </h2>
        </div>
        <div className="lp-features">
          {FEATURES.map((f, i) => (
            <article className="lp-feature" key={f.title} data-reveal style={delay(i * 70)}>
              <div className="lp-feature-ic">{f.icon}</div>
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
  { icon: icons.wallet, title: "Connect", body: "Connect a wallet and switch to Arc testnet. USDC pays for gas." },
  { icon: icons.bridge, title: "Fund with USDC", body: "Bridge testnet USDC from Sepolia via CCTP, or use USDC you already hold on Arc." },
  { icon: icons.swap, title: "Trade NVDA", body: "Pick buy or sell, check the oracle-anchored bid/ask, and submit from the order ticket." },
  { icon: icons.check, title: "Settle on-chain", body: "The fill settles in one transaction: tokens and USDC land in your wallet." },
];

export function HowItWorks() {
  return (
    <section className="lp-section lp-how" id="how">
      <div className="lp-container">
        <div className="lp-section-head" data-reveal>
          <span className="lp-kicker">How it works</span>
          <h2 className="lp-h2">
            From Sepolia to a filled order
            <br />
            <span className="lp-dim">in four steps.</span>
          </h2>
        </div>
        <div className="lp-steps-wrap">
          <div className="lp-steps-line" aria-hidden="true">
            <span />
          </div>
          <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li className="lp-step" key={s.title} data-reveal style={delay(i * 110)}>
              <div className="lp-step-node">
                {s.icon}
                <em>{String(i + 1).padStart(2, "0")}</em>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bridge / USDC ---------- */

export function Bridge() {
  return (
    <section className="lp-section lp-bridge" id="bridge">
      <div className="lp-container lp-bridge-inner">
        <div className="lp-bridge-copy" data-reveal>
          <span className="lp-kicker">USDC in, via CCTP</span>
          <h2 className="lp-h2">
            Native USDC.
            <br />
            <span className="lp-grad">No wrappers.</span>
          </h2>
          <p className="lp-body">
            Circle&apos;s Cross-Chain Transfer Protocol burns USDC on the source chain and mints it natively on the
            destination once Circle attests to the burn. arcusa wires this into the terminal, so moving testnet USDC
            from Sepolia to Arc is one panel, not a separate app.
          </p>
          <ul className="lp-checks">
            <li>{icons.check} Burn on Ethereum Sepolia</li>
            <li>{icons.check} Attestation from Circle</li>
            <li>{icons.check} Mint native USDC on Arc testnet</li>
            <li>{icons.check} Trade immediately: USDC is also gas</li>
          </ul>
        </div>
        <div className="lp-bridge-visual" data-reveal style={delay(120)}>
          <div className="lp-bridge-card">
            <BridgeDiagram />
            <div className="lp-bridge-row">
              <div>
                <span>From</span>
                <b>Sepolia</b>
              </div>
              <div className="lp-bridge-amt">
                <span>Amount</span>
                <b className="lp-mono">250.00 USDC</b>
              </div>
              <div>
                <span>To</span>
                <b>Arc testnet</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats ---------- */

const STATS = [
  { k: "NVDA", v: "First listed equity", s: "more tickers on the roadmap" },
  { k: "USDC", v: "Quote, settlement and gas", s: "one asset for everything" },
  { k: "2 chains", v: "Sepolia → Arc via CCTP", s: "burn, attest, mint" },
  { k: "$0", v: "Real money at risk", s: "testnet demo only" },
];

export function Stats() {
  return (
    <section className="lp-section lp-stats-sec" aria-label="At a glance">
      <div className="lp-container">
        <div className="lp-stats">
          {STATS.map((s, i) => (
            <div className="lp-stat" key={s.k} data-reveal style={delay(i * 90)}>
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
          <div className="lp-final-bg" aria-hidden="true" />
          <span className="lp-kicker">Try the demo</span>
          <h2 className="lp-h2 lp-final-h">
            Open the terminal.
            <br />
            <span className="lp-grad">Trade NVDA on Arc.</span>
          </h2>
          <p className="lp-body">Grab testnet USDC, connect a wallet, and place your first on-chain stock trade.</p>
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
          <p>Built for ETHGlobal Mumbai on Arc testnet.</p>
        </div>
        <nav className="lp-footer-links" aria-label="Footer">
          <Link href="/trade">Terminal</Link>
          <a href="#features">Features</a>
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
        Testnet demonstration only. Tokens on arcusa have no monetary value, are not backed by or redeemable for real
        shares, and nothing here is investment advice. Prices shown on this page are illustrative.
      </div>
    </footer>
  );
}
