"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useIndicativeQuote } from "@/lib/use-indicative-quote";
import { CALC, PHONE } from "./copy";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

/** Counts up to `value` after mount. The server renders the final value; the animated copy is hidden from assistive tech. */
export function CountUp({ value, decimals = 2, prefix = "" }: { value: number; decimals?: number; prefix?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef<number | null>(null);
  useEffect(() => {
    if (reducedMotion()) {
      setShown(value);
      return;
    }
    const start = from.current ?? value * 0.92;
    from.current = value;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(start + (value - start) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const final = `${prefix}${fmt(value, decimals)}`;
  return (
    <span className="lp-count" aria-label={final}>
      <span aria-hidden="true">{prefix}{fmt(shown, decimals)}</span>
    </span>
  );
}

/** The hero's trade-card mock. An illustration built from the app's own look; the price is indicative or a labelled sample. */
export function HeroMock() {
  const q = useIndicativeQuote();
  const label = q.kind === "live" ? "Indicative price" : "Sample price";
  return (
    <div className="lp-mock" aria-hidden="false">
      <div className="lp-float lp-float-a" aria-hidden="true"><i>✓</i><span>Settled on Arc</span></div>
      <div className="lp-float lp-float-b" aria-hidden="true"><span>USDC</span><b>120.00</b></div>
      <div className="lp-mock-card">
        <div className="lp-mock-head">
          <span className="lp-ic nv">N</span><span className="lp-ic us">$</span>
          <b>NVDA <em>/ USDC</em></b>
          <span className="lp-chip-tag">{label}</span>
        </div>
        <div className="lp-mock-price"><CountUp value={q.price} prefix="$" /></div>
        <svg className="lp-mock-chart" viewBox="0 0 400 150" aria-hidden="true">
          <defs>
            <linearGradient id="lpfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--chart-line)" stopOpacity=".32" />
              <stop offset="1" stopColor="var(--chart-line)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="lp-area" d="M0 110 C30 96 50 118 80 100 S130 60 160 76 S210 110 240 84 S300 30 340 48 S380 40 400 22 L400 150 L0 150 Z" fill="url(#lpfill)" />
          <path className="lp-line" pathLength="1" d="M0 110 C30 96 50 118 80 100 S130 60 160 76 S210 110 240 84 S300 30 340 48 S380 40 400 22" fill="none" stroke="var(--chart-line)" strokeWidth="3.5" strokeLinecap="round" />
          <circle className="lp-dot" cx="400" cy="22" r="5" fill="var(--chart-line)" />
        </svg>
        <div className="lp-mock-pay">
          <div><small>You pay</small><b>5 USDC</b></div>
          <div className="lp-arrow">→</div>
          <div><small>You get</small><b>NVDA</b></div>
        </div>
        <div className="lp-mock-buy">Buy NVDA</div>
      </div>
      <p className="lp-mock-cap">{HERO_CAPTION}</p>
    </div>
  );
}
const HERO_CAPTION = "Illustration. The app uses the same look.";

/** Scroll story: marks the active step so the sticky visual can follow. All step text stays in the DOM. */
export function StoryTracker({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step-n]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) root.setAttribute("data-step", (e.target as HTMLElement).dataset.stepN ?? "1");
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="lp-story" data-step="1">
      {children}
    </div>
  );
}

/** No-wallet calculator. Uses only the indicative price; shows no fee number. */
export function Calculator() {
  const q = useIndicativeQuote();
  const [raw, setRaw] = useState("100");
  const n = Number(raw);
  const valid = raw.trim() !== "" && Number.isFinite(n) && n > 0;
  const nvda = valid ? n / q.price : null;
  return (
    <div className="lp-calc">
      <label className="lp-calc-in">
        <span>{CALC.label}</span>
        <div>
          <b>$</b>
          <input inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, "").slice(0, 9))} aria-describedby="calc-fine" />
        </div>
        <input type="range" min={1} max={1000} step={1} value={valid ? Math.min(1000, Math.max(1, n)) : 1} onChange={(e) => setRaw(e.target.value)} aria-label="USDC amount" />
      </label>
      <div className="lp-calc-out" aria-live="polite">
        <span>{CALC.out}</span>
        <b>{nvda === null ? "—" : fmt(nvda, nvda < 1 ? 4 : 3)} <em>NVDA</em></b>
        <small>{q.kind === "live" ? "Indicative price" : "Sample price"}: ${fmt(q.price)}</small>
      </div>
      <p className="lp-fine" id="calc-fine">{CALC.fine}</p>
      <Link href="/trade" className="lp-btn lp-btn-primary lp-btn-lg">Open the app <span aria-hidden="true">→</span></Link>
    </div>
  );
}

/** Phone showcase: plays the mobile flow once when it scrolls into view, then rests. Replay on demand. */
export function PhoneShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(2); // final state without JS or with reduced motion
  const [run, setRun] = useState(0);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !played.current) {
        played.current = true;
        setRun((r) => r + 1);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!run) return;
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 1400);
    const t2 = setTimeout(() => setStep(2), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [run]);

  return (
    <div className="lp-phone-wrap" ref={ref}>
      <div className={`lp-phone s${step}`} role="img" aria-label={PHONE.caption}>
        <div className="lp-phone-notch" />
        <div className="lp-phone-screen">
          <div className="lp-ph-top"><i /> <b>arcusa</b><span /></div>
          <div className="lp-ph-pair"><span className="lp-ic nv">N</span><span className="lp-ic us">$</span><b>NVDA / USDC</b></div>
          <div className="lp-ph-price">$186.00</div>
          <svg viewBox="0 0 200 70" preserveAspectRatio="none" className="lp-ph-chart"><path d="M0 50 C20 44 30 56 50 46 S80 20 100 30 S130 52 150 34 S180 14 200 10" fill="none" stroke="var(--chart-line)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>
          <div className="lp-ph-bar"><i>Buy</i><i>Sell</i></div>
          <div className="lp-ph-sheet">
            <span className="lp-ph-grab" />
            <div className="lp-ph-tabs"><b>Buy</b><em>Sell</em></div>
            <div className="lp-ph-card"><small>You pay</small><b>5 USDC</b></div>
            <div className="lp-ph-card"><small>You receive</small><b>NVDA</b></div>
            <div className="lp-ph-cta">{step >= 2 ? "Done ✓" : "Buy NVDA"}</div>
          </div>
          <div className="lp-ph-success"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23" pathLength="1" /><path d="M15 27l8 8 15-17" pathLength="1" /></svg><b>Trade settled</b></div>
        </div>
      </div>
      <button className="lp-replay" onClick={() => { played.current = true; setRun((r) => r + 1); }}>Replay</button>
      <p className="lp-fine">{PHONE.caption}</p>
    </div>
  );
}
