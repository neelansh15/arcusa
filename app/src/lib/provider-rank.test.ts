import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultQuote, holdLastGood, rankQuotes, simulateQuote, type Provider, type RawQuote } from "./provider-rank.ts";

const addr = "0x0000000000000000000000000000000000000001" as const;
const real: Provider = { id: "real", assetTicker: "TSLA", label: "wTSLA", tokenSymbol: "wTSLA", premiumBps: 0, spreadBps: 0, simulated: false, market: { oracle: addr, market: addr, token: addr } };
const simA: Provider = { id: "a", assetTicker: "TSLA", label: "TSLAon", tokenSymbol: "TSLAon", premiumBps: 8, spreadBps: 30, simulated: true };
const simB: Provider = { id: "b", assetTicker: "TSLA", label: "TSLAx", tokenSymbol: "TSLAx", premiumBps: -5, spreadBps: 45, simulated: true };
const raw = (provider: Provider, out: number, status: RawQuote["status"] = "ok"): RawQuote => ({ provider, out, price: out > 0 ? 100 / out : 0, spreadBps: provider.spreadBps, status, updatedAt: 1 });

test("buy: most tokens out wins, deltas are relative to best", () => {
  const { quotes, best } = rankQuotes([raw(real, 0.4), raw(simA, 0.5), raw(simB, 0.45)], "buy");
  assert.equal(best?.providerId, "a");
  assert.equal(quotes.filter((q) => q.isBest).length, 1);
  assert.ok(Math.abs(quotes[0].deltaVsBestPct + 20) < 1e-9);
  assert.equal(quotes[1].deltaVsBestPct, 0);
});

test("sell: most USDC out wins", () => {
  const { best } = rankQuotes([raw(real, 99), raw(simA, 101), raw(simB, 100)], "sell");
  assert.equal(best?.providerId, "a");
});

test("tie prefers a tradable provider, then registry order", () => {
  assert.equal(rankQuotes([raw(simA, 1), raw(real, 1)], "buy").best?.providerId, "real");
  assert.equal(rankQuotes([raw(simA, 1), raw(simB, 1)], "buy").best?.providerId, "a");
});

test("stale quotes lose to ok ones, but win when nothing is ok", () => {
  assert.equal(rankQuotes([raw(simA, 9, "stale"), raw(real, 1)], "buy").best?.providerId, "real");
  assert.equal(rankQuotes([raw(simA, 9, "stale"), raw(real, 1, "stale")], "buy").best?.providerId, "a");
});

test("unavailable never wins and has no delta", () => {
  const { quotes, best } = rankQuotes([raw(simA, 0, "unavailable"), raw(real, 1)], "buy");
  assert.equal(best?.providerId, "real");
  assert.equal(quotes[0].deltaVsBestPct, 0);
  assert.equal(quotes[0].isBest, false);
  assert.equal(rankQuotes([raw(simA, 0, "unavailable"), raw(simB, 0, "unavailable")], "buy").best, undefined);
});

test("zero amount: all tied, tradable provider is best, no NaN", () => {
  const { quotes, best } = rankQuotes([raw(simA, 0), raw(real, 0)], "buy");
  assert.equal(best?.providerId, "real");
  for (const q of quotes) assert.ok(Number.isFinite(q.deltaVsBestPct) && q.deltaVsBestPct === 0);
  assert.equal(simulateQuote(simA, "buy", 0, 200).out, 0);
});

test("single provider is always best, even stale or unavailable", () => {
  for (const status of ["ok", "stale", "unavailable"] as const) {
    const { quotes, best } = rankQuotes([raw(real, 1, status)], "buy");
    assert.equal(best?.providerId, "real");
    assert.equal(quotes.length, 1);
    assert.equal(quotes[0].tradable, true);
  }
});

test("tradable reflects having a market", () => {
  const { quotes } = rankQuotes([raw(real, 1), raw(simA, 1)], "buy");
  assert.deepEqual(quotes.map((q) => q.tradable), [true, false]);
});

test("simulateQuote applies premium then spread, both directions", () => {
  const buy = simulateQuote({ premiumBps: 100, spreadBps: 100 }, "buy", 101, 100);
  assert.ok(Math.abs(buy.price - 100 * 1.01 * 1.01) < 1e-9);
  assert.ok(Math.abs(buy.out - 101 / buy.price) < 1e-9);
  const sell = simulateQuote({ premiumBps: 100, spreadBps: 100 }, "sell", 2, 100);
  assert.ok(Math.abs(sell.price - 100 * 1.01 * 0.99) < 1e-9);
  assert.ok(Math.abs(sell.out - 2 * sell.price) < 1e-9);
});

test("default selection is the best tradable provider, while best stays the overall winner", () => {
  const { quotes, best } = rankQuotes([raw(real, 0.4), raw(simA, 0.5)], "buy");
  assert.equal(best?.providerId, "a");
  assert.equal(defaultQuote(quotes, best)?.providerId, "real");
  assert.equal(quotes.find((q) => q.isBest)?.providerId, "a");
});

test("default selection: stale tradable beats nothing, no tradable falls back to best", () => {
  const stale = rankQuotes([raw(real, 0.4, "stale"), raw(simA, 0.5)], "buy");
  assert.equal(defaultQuote(stale.quotes, stale.best)?.providerId, "real");
  const none = rankQuotes([raw(simA, 0.5), raw(simB, 0.4)], "buy");
  assert.equal(defaultQuote(none.quotes, none.best)?.providerId, "a");
  const down = rankQuotes([raw(real, 0, "unavailable"), raw(simA, 0.5)], "buy");
  assert.equal(defaultQuote(down.quotes, down.best)?.providerId, "a");
});

test("default selection with one provider is that provider", () => {
  const { quotes, best } = rankQuotes([raw(real, 1)], "buy");
  assert.equal(defaultQuote(quotes, best)?.providerId, "real");
});

test("a single failed read keeps the last good quote for a short time", () => {
  const good = raw(real, 0.4);
  const bad = raw(real, 0, "unavailable");
  assert.equal(holdLastGood(bad, { raw: good, at: 1000 }, 5000, 20_000), good);
  assert.equal(holdLastGood(bad, { raw: good, at: 1000 }, 30_000, 20_000), bad); // too old
  assert.equal(holdLastGood(bad, undefined, 5000, 20_000), bad); // nothing to hold
  assert.equal(holdLastGood(bad, { raw: raw(real, 0, "unavailable"), at: 1000 }, 5000, 20_000), bad);
  const ok = raw(real, 0.5);
  assert.equal(holdLastGood(ok, { raw: good, at: 1000 }, 5000, 20_000), ok); // fresh data always wins
});
