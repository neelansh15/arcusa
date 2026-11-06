import type { ReactNode } from "react";

/* ---------- Logo (flat) ---------- */

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      <path d="M7.5 23 A8.5 8.5 0 0 1 24.5 23" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="13.5" r="2.4" fill="#fff" />
    </svg>
  );
}

/* ---------- Candlestick chart (flat, illustrative) ---------- */

type Candle = { o: number; h: number; l: number; c: number };

function makeCandles(n: number, seed: number): Candle[] {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out: Candle[] = [];
  let p = 100;
  for (let i = 0; i < n; i++) {
    const o = p;
    const wave = i % 9 < 6 ? 1.1 : -1.6;
    const c = o + (rnd() - 0.5) * 5 + wave;
    const h = Math.max(o, c) + rnd() * 2.6;
    const l = Math.min(o, c) - rnd() * 2.6;
    out.push({ o, h, l, c });
    p = c;
  }
  return out;
}

const CANDLES = makeCandles(40, 20260);
const W = 600;
const H = 280;
const PAD = 14;

export function CandleChart() {
  const lo = Math.min(...CANDLES.map((c) => c.l));
  const hi = Math.max(...CANDLES.map((c) => c.h));
  const y = (v: number) => PAD + ((hi - v) / (hi - lo)) * (H - PAD * 2);
  const step = W / CANDLES.length;
  const bw = step * 0.56;
  const f = (n: number) => n.toFixed(1);
  const last = CANDLES[CANDLES.length - 1];

  return (
    <svg className="lp-candles" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Illustrative NVDA/USDC candlestick chart">
      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <line key={t} x1="0" x2={W} y1={H * t} y2={H * t} className="lp-gridline" />
      ))}
      {CANDLES.map((c, i) => {
        const up = c.c >= c.o;
        const x = i * step + step / 2;
        const top = y(Math.max(c.o, c.c));
        const bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
        return (
          <g key={i} className={`lp-candle ${up ? "up" : "down"}`}>
            <line x1={f(x)} x2={f(x)} y1={f(y(c.h))} y2={f(y(c.l))} />
            <rect x={f(x - bw / 2)} y={f(top)} width={f(bw)} height={f(bh)} />
          </g>
        );
      })}
      <line x1="0" x2={W} y1={f(y(last.c))} y2={f(y(last.c))} className="lp-lastline" />
    </svg>
  );
}

/* ---------- Icons ---------- */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const icons = {
  stock: (
    <Icon>
      <path d="M4 19h16" />
      <path d="M7 15V9M7 9V6M12 16v-6M12 10V8M17 13V5" />
      <rect x="5.5" y="9" width="3" height="5" rx=".6" />
      <rect x="10.5" y="10" width="3" height="5" rx=".6" />
      <rect x="15.5" y="6" width="3" height="6" rx=".6" />
    </Icon>
  ),
  usdc: (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.6 9.4c-.4-.9-1.4-1.4-2.6-1.4-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2 2.7.8 2.7 2-1.1 2-2.7 2c-1.3 0-2.3-.6-2.7-1.5M12 6.5V8M12 16v1.5" />
    </Icon>
  ),
  oracle: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </Icon>
  ),
  book: (
    <Icon>
      <path d="M4 6h7M4 10h5M4 14h8M4 18h4" />
      <path d="M13 6h7M15 10h5M12 14h8M16 18h4" />
    </Icon>
  ),
  bridge: (
    <Icon>
      <path d="M3 17c3-6 6-8 9-8s6 2 9 8" />
      <path d="M3 17h18M7 13.5V17M12 9v8M17 13.5V17" />
    </Icon>
  ),
  terminal: (
    <Icon>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M7 10l3 2-3 2M12.5 14.5H17" />
    </Icon>
  ),
  wallet: (
    <Icon>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <circle cx="16" cy="13.5" r="1.2" />
    </Icon>
  ),
  swap: (
    <Icon>
      <path d="M5 9h13l-3.5-3.5M19 15H6l3.5 3.5" />
    </Icon>
  ),
  check: (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.4 2.4 4.6-4.9" />
    </Icon>
  ),
  arrow: (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h11M11 5.5L15.5 10 11 14.5" />
    </svg>
  ),
};
