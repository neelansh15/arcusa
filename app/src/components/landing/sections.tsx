import Link from "next/link";
import type { CSSProperties } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMenu } from "../nav-menu";
import { SiteNav } from "../site-nav";
import { CTA, FAQ, FOOTER_DISCLAIMER, HERO, HOOD, STEPS, TILES, CALC, PHONE } from "./copy";
import { Arrow, GBridge, GChain, GCost, GOne, GPhone, GPrice, Logo, Tile, Vis1, Vis2, Vis3 } from "./graphics";
import { Calculator, HeroMock, PhoneShowcase, StoryTracker } from "./islands";

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
        <div className="lp-nav-center">
          <SiteNav className="lp-nav-links" />
          <nav className="lp-nav-sub" aria-label="On this page">
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
        </div>
        <div className="lp-nav-right">
          <span className="lp-testnet">Arc testnet demo</span>
          <ThemeToggle />
          <Link href="/trade" className="lp-btn lp-btn-primary lp-btn-sm">Launch app</Link>
          <NavMenu>
            <nav className="menu-anchors" aria-label="On this page"><a href="#how">How it works</a><a href="#faq">FAQ</a></nav>
          </NavMenu>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */

export function Hero() {
  return (
    <section className="lp-hero" id="top" data-live-root>
      <div className="lp-hero-glow" aria-hidden="true" />
      <div className="lp-container lp-hero-inner">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow lp-load" style={delay(0)}><i /><b>{HERO.brand}</b><span aria-hidden="true">·</span>{HERO.eyebrow}</p>
          <h1 className="lp-h1 lp-load" style={delay(60)}>
            {HERO.h1a}
            <span>{HERO.h1b}</span>
          </h1>
          <p className="lp-lead lp-load" style={delay(120)}>{HERO.lead}</p>
          <div className="lp-cta-row lp-load" style={delay(180)}>
            <Link href="/trade" className="lp-btn lp-btn-primary lp-btn-lg">{HERO.primary} <Arrow /></Link>
            <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">{HERO.secondary}</a>
          </div>
          <p className="lp-note lp-load" style={delay(240)}>{HERO.note}</p>
        </div>
        <div className="lp-hero-visual lp-load" style={delay(140)}>
          <HeroMock />
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works (scroll story) ---------- */

export function HowItWorks() {
  const vis = [<Vis1 key={1} />, <Vis2 key={2} />, <Vis3 key={3} />];
  return (
    <section className="lp-section" id="how">
      <div className="lp-container">
        <div className="lp-shell">
          <div className="lp-section-head" data-reveal>
            <span className="lp-kicker">How it works</span>
            <h2 className="lp-h2">Three steps.<br />That is it.</h2>
          </div>
          <StoryTracker>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li className="lp-step" key={s.n} data-step-n={s.n} data-reveal style={delay(i * 40)}>
                  <span className="lp-step-n">{s.n}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                    <div className="lp-step-vis">{vis[i]}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="lp-sticky" aria-hidden="true" data-live-root>
              <div className="lp-sticky-in">
                <div className="lp-slot s1"><Vis1 /></div>
                <div className="lp-slot s2"><Vis2 /></div>
                <div className="lp-slot s3"><Vis3 /></div>
              </div>
            </div>
          </StoryTracker>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bento ---------- */

const ART: Record<string, React.ReactNode> = {
  one: <GOne />, price: <GPrice />, cost: <GCost />, phone: <GPhone />, bridge: <GBridge />, chain: <GChain />,
};

export function Bento() {
  return (
    <section className="lp-section" id="why">
      <div className="lp-container">
        <div className="lp-section-head center" data-reveal>
          <span className="lp-kicker">Why it feels simple</span>
          <h2 className="lp-h2">Made simple on purpose.</h2>
        </div>
        <div className="lp-bento">
          {TILES.map((t) => (
            <Tile key={t.id} id={t.id} title={t.title} body={t.body} wide={t.id === "chain"}>{ART[t.id]}</Tile>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Calculator ---------- */

export function Try() {
  return (
    <section className="lp-section" id="try">
      <div className="lp-container lp-try">
        <div className="lp-section-head" data-reveal>
          <span className="lp-kicker">Try it</span>
          <h2 className="lp-h2">{CALC.h2}</h2>
          <p className="lp-body">{CALC.lead}</p>
        </div>
        <div className="lp-try-card" data-reveal style={delay(80)}>
          <Calculator />
        </div>
      </div>
    </section>
  );
}

/* ---------- Phone ---------- */

export function Phone() {
  return (
    <section className="lp-section">
      <div className="lp-container lp-phone-sec">
        <div className="lp-section-head" data-reveal>
          <span className="lp-kicker">On mobile</span>
          <h2 className="lp-h2">{PHONE.h2}</h2>
          <p className="lp-body">{PHONE.lead}</p>
        </div>
        <div data-reveal style={delay(80)} data-live-root>
          <PhoneShowcase />
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

export function Faq() {
  return (
    <section className="lp-section" id="faq">
      <div className="lp-container lp-faq">
        <div className="lp-section-head" data-reveal>
          <span className="lp-kicker">FAQ</span>
          <h2 className="lp-h2">Plain answers.</h2>
        </div>
        <div className="lp-faq-list" data-reveal style={delay(60)}>
          {FAQ.map((f) => (
            <details key={f.q} className="lp-qa">
              <summary>{f.q}<i aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
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
          <div className="lp-final-glow" aria-hidden="true" />
          <h2>{CTA.h2}</h2>
          <p>{CTA.lead}</p>
          <Link href="/trade" className="lp-btn lp-btn-dark lp-btn-lg">{CTA.button} <Arrow /></Link>
          <small>{HERO.note}</small>
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
          <a href="#top" className="lp-brand"><Logo size={24} /><span>arcusa</span></a>
          <p>Testnet demo, no real money. Built for ETHGlobal.</p>
        </div>
        <div className="lp-footer-cols">
          <nav aria-label="App"><b>App</b><Link href="/trade">Trade</Link><Link href="/bridge">Bridge</Link><Link href="/docs">Docs</Link></nav>
          <nav aria-label="Under the hood"><b>Under the hood</b>{HOOD.map((h) => <Link key={h.href} href={h.href}>{h.label}</Link>)}</nav>
        </div>
      </div>
      <div className="lp-container lp-disclaimer">{FOOTER_DISCLAIMER}</div>
    </footer>
  );
}
