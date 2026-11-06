"use client";

import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { INTERVALS, toCandles, type Interval } from "@/lib/candles";
import type { PricePoint } from "@/lib/use-price";

export function PriceChart({ history }: { history: PricePoint[] }) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [interval, setIntervalKey] = useState<Interval>("1m");
  const candles = useMemo(() => toCandles(history, interval), [history, interval]);

  useEffect(() => {
    if (!el.current) return;
    const chart = createChart(el.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#5a6475", fontSize: 11 },
      grid: { vertLines: { color: "#eef0f3" }, horzLines: { color: "#eef0f3" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#e6e8ec", scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: "#e6e8ec", timeVisible: true, secondsVisible: false, rightOffset: 6 },
    });
    chartRef.current = chart;
    series.current = chart.addSeries(CandlestickSeries, {
      upColor: "#2563eb",
      downColor: "#b4474d",
      borderUpColor: "#2563eb",
      borderDownColor: "#b4474d",
      wickUpColor: "#2563eb",
      wickDownColor: "#b4474d",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    return () => {
      chart.remove();
      chartRef.current = null;
      series.current = null;
    };
  }, []);

  useEffect(() => {
    series.current?.setData(
      candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })),
    );
  }, [candles]);

  return (
    <div className="chart-wrap">
      <div className="chart-tools">
        <div className="seg">
          {(Object.keys(INTERVALS) as Interval[]).map((k) => (
            <button key={k} className={interval === k ? "on" : ""} onClick={() => setIntervalKey(k)}>
              {k}
            </button>
          ))}
        </div>
        <span className="muted small">{history.length} ticks · NVDA indicative (xstocks.fi)</span>
      </div>
      <div ref={el} className="chart" />
    </div>
  );
}
