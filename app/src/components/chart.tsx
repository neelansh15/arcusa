"use client";

import { AreaSeries, ColorType, createChart, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { PricePoint } from "@/lib/use-price";

export function PriceChart({ history }: { history: PricePoint[] }) {
  const el = useRef<HTMLDivElement>(null);
  const series = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const chart = createChart(el.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#8b95a5" },
      grid: { vertLines: { color: "#1a212b" }, horzLines: { color: "#1a212b" } },
      rightPriceScale: { borderColor: "#262e3a" },
      timeScale: { borderColor: "#262e3a", timeVisible: true, secondsVisible: true },
    });
    series.current = chart.addSeries(AreaSeries, {
      lineColor: "#2dd4a7",
      topColor: "rgba(45,212,167,0.25)",
      bottomColor: "rgba(45,212,167,0)",
      lineWidth: 2,
    });
    return () => {
      chart.remove();
      series.current = null;
    };
  }, []);

  useEffect(() => {
    series.current?.setData(history.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })));
  }, [history]);

  return <div ref={el} className="chart" />;
}
