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
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#7d8795", fontSize: 11 },
      grid: { vertLines: { color: "#161c25" }, horzLines: { color: "#161c25" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#232b36", scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: "#232b36", timeVisible: true, secondsVisible: false, rightOffset: 6 },
    });
    chartRef.current = chart;
    series.current = chart.addSeries(CandlestickSeries, {
      upColor: "#2dd4a7",
      downColor: "#f0616d",
      borderUpColor: "#2dd4a7",
      borderDownColor: "#f0616d",
      wickUpColor: "#2dd4a7",
      wickDownColor: "#f0616d",
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
