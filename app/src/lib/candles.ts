import type { PricePoint } from "./use-price";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const INTERVALS = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600 } as const;
export type Interval = keyof typeof INTERVALS;

export function toCandles(ticks: PricePoint[], interval: Interval): Candle[] {
  const step = INTERVALS[interval];
  const out: Candle[] = [];
  for (const t of ticks) {
    const time = Math.floor(t.time / step) * step;
    const last = out[out.length - 1];
    if (last && last.time === time) {
      last.high = Math.max(last.high, t.value);
      last.low = Math.min(last.low, t.value);
      last.close = t.value;
    } else {
      out.push({ time, open: t.value, high: t.value, low: t.value, close: t.value });
    }
  }
  return out;
}
