import { PRICE } from "@/lib/config";

export const dynamic = "force-dynamic";

// Fallback when the ingest service is down. Tickers are an allowlist, never request input in the URL.
const SYMBOLS = ["NVDA", "TSLA"];

export async function GET(req: Request) {
  const fetchedAt = Date.now();
  const symbol = (new URL(req.url).searchParams.get("symbol") ?? "NVDA").toUpperCase();
  if (!SYMBOLS.includes(symbol)) {
    return Response.json({ error: "unknown symbol", fetchedAt }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  try {
    const res = await fetch(PRICE.upstream.replace("NVDAx", `${symbol}x`), {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const body = (await res.json()) as { quote?: unknown };
    const quote = Number(body.quote);
    if (!Number.isFinite(quote) || quote <= 0) throw new Error("bad quote");
    return Response.json(
      { symbol, quote, fetchedAt, stale: false, source: "xstocks.fi" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "upstream error", fetchedAt },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
