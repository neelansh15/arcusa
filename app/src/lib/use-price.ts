"use client";

import { useEffect, useState } from "react";
import { PRICE } from "./config";

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

export function usePrice(): PriceState {
  const [state, setState] = useState<PriceState>({
    quote: null,
    fetchedAt: null,
    stale: true,
    error: null,
    history: [],
  });

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch(PRICE.route, { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        if (!alive) return;
        const time = Math.floor(body.fetchedAt / 1000);
        setState((s) => {
          const last = s.history[s.history.length - 1];
          const history =
            last && last.time >= time ? s.history : [...s.history, { time, value: body.quote }].slice(-500);
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
  }, []);

  return state;
}
