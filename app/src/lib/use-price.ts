"use client";

import { useEffect, useState } from "react";
import { PRICE, PRICE_API } from "./config";

export interface PricePoint {
  time: number; // unix seconds
  value: number;
}

export interface PriceState {
  quote: number | null;
  fetchedAt: number | null;
  stale: boolean;
  error: string | null;
  history: PricePoint[];
}

export function usePrice(symbol = "NVDA"): PriceState {
  const [state, setState] = useState<PriceState>({
    quote: null,
    fetchedAt: null,
    stale: true,
    error: null,
    history: [],
  });

  useEffect(() => {
    let alive = true;
    setState({ quote: null, fetchedAt: null, stale: true, error: null, history: [] });
    // Seed history from the ingest service so the chart isn't empty on load.
    fetch(`${PRICE_API}/api/ticks?symbol=${symbol}&limit=5000`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { ticks: PricePoint[]; symbol?: string }) => {
        // An older ingest service ignores ?symbol and answers NVDA ticks without a symbol field.
        if ((b.symbol ?? "NVDA") !== symbol) return;
        if (alive && b.ticks?.length) setState((s) => ({ ...s, history: [...b.ticks, ...s.history.filter((p) => p.time > b.ticks[b.ticks.length - 1].time)] }));
      })
      .catch(() => {});
    async function tick() {
      try {
        let body: { quote: number; fetchedAt: number };
        try {
          const r = await fetch(`${PRICE_API}/api/price?symbol=${symbol}`, { cache: "no-store" });
          const j = await r.json();
          if (!r.ok || (j.symbol ?? "NVDA") !== symbol) throw new Error("ingest down or wrong symbol");
          body = { quote: j.quote, fetchedAt: j.time * 1000 };
        } catch {
          const res = await fetch(`${PRICE.route}?symbol=${symbol}`, { cache: "no-store" });
          body = await res.json();
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
        if (!alive) return;
        const time = Math.floor(body.fetchedAt / 1000);
        setState((s) => {
          const last = s.history[s.history.length - 1];
          const history =
            last && last.time >= time ? s.history : [...s.history, { time, value: body.quote }].slice(-5000);
          return { quote: body.quote, fetchedAt: body.fetchedAt, stale: false, error: null, history };
        });
      } catch (e) {
        if (!alive) return;
        setState((s) => ({ ...s, error: e instanceof Error ? e.message : "error" }));
      }
    }
    tick();
    const id = setInterval(tick, PRICE.pollMs);
    // Re-evaluate staleness against our own fetchedAt clock.
    const staleId = setInterval(
      () =>
        setState((s) =>
          s.fetchedAt !== null && Date.now() - s.fetchedAt > PRICE.staleAfterMs && !s.stale
            ? { ...s, stale: true }
            : s,
        ),
      1_000,
    );
    return () => {
      alive = false;
      clearInterval(id);
      clearInterval(staleId);
    };
  }, [symbol]);

  return state;
}
