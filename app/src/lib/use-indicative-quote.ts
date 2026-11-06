"use client";

import { useEffect, useState } from "react";

export interface IndicativeQuote {
  /** The price to show. Falls back to a sample when the feed is down. */
  price: number;
  /** "live" only when the quote is under 60 seconds old; otherwise the price is a labelled sample. */
  kind: "live" | "sample";
}

const SAMPLE = 186;

/** Landing-page price. Calls only /api/price (no ticks, no RPC), once plus a 30 second poll, 3 second abort. */
export function useIndicativeQuote(): IndicativeQuote {
  const [state, setState] = useState<IndicativeQuote>({ price: SAMPLE, kind: "sample" });

  useEffect(() => {
    let alive = true;
    async function load() {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 3000);
      try {
        const r = await fetch("/api/price", { cache: "no-store", signal: ctl.signal });
        const j = (await r.json()) as { quote?: number; fetchedAt?: number };
        if (!r.ok || typeof j.quote !== "number" || !(j.quote > 0)) throw new Error("bad quote");
        const fresh = typeof j.fetchedAt === "number" && Date.now() - j.fetchedAt < 60_000;
        if (alive) setState({ price: j.quote, kind: fresh ? "live" : "sample" });
      } catch {
        // keep the sample; never fake a live price
      } finally {
        clearTimeout(timer);
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return state;
}
