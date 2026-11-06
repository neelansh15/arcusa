"use client";

import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { INTERVALS, toCandles, type Interval } from "@/lib/candles";
import type { PricePoint } from "@/lib/use-price";

const ACCENT = "#2563eb";
const NEG = "#b4474d";

interface Hover {
  x: number;
  y: number;
  price: number;
  time: number;
}

/** Simple: a smooth area line with a hover tooltip. Pro: candlesticks with an interval picker. */
export function PriceChart({ history, variant = "line" }: { history: PricePoint[]; variant?: "line" | "candles" }) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const area = useRef<ISeriesApi<"Area"> | null>(null);
  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [interval, setIntervalKey] = useState<Interval>("1m");
  const [hover, setHover] = useState<Hover | null>(null);
  const candles = useMemo(() => toCandles(history, interval), [history, interval]);
  const falling = history.length > 1 && history[history.length - 1].value < history[0].value;
  const lineColor = falling ? NEG : ACCENT;

  useEffect(() => {
    if (!el.current) return;
    const chart = createChart(el.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#5a6475", fontSize: 11, attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: "#eef0f3" } },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { style: 2, color: "#9aa4b5", labelVisible: false },
        horzLine: { visible: variant === "candles", labelVisible: variant === "candles" },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      handleScroll: variant === "candles",
      handleScale: variant === "candles",
    });
    chartRef.current = chart;
    if (variant === "candles") {
      candle.current = chart.addSeries(CandlestickSeries, {
        upColor: ACCENT, downColor: NEG, borderUpColor: ACCENT, borderDownColor: NEG, wickUpColor: ACCENT, wickDownColor: NEG,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      });
    } else {
      area.current = chart.addSeries(AreaSeries, {
        lineColor: ACCENT, topColor: "rgba(37,99,235,.22)", bottomColor: "rgba(37,99,235,0)", lineWidth: 2, lineType: LineType.Curved,
        crosshairMarkerRadius: 5, priceLineVisible: false, lastValueVisible: false,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      });
      chart.subscribeCrosshairMove((p) => {
        const d = area.current && p.seriesData.get(area.current);
        if (!p.point || !d || !("value" in d) || p.time === undefined) return setHover(null);
        setHover({ x: p.point.x, y: p.point.y, price: d.value, time: p.time as number });
      });
    }
    return () => {
      chart.remove();
      chartRef.current = null;
      area.current = null;
      candle.current = null;
    };
  }, [variant]);

  useEffect(() => {
    area.current?.applyOptions({
      lineColor,
      topColor: falling ? "rgba(180,71,77,.2)" : "rgba(37,99,235,.22)",
      bottomColor: falling ? "rgba(180,71,77,0)" : "rgba(37,99,235,0)",
    });
    area.current?.setData(history.map((h) => ({ time: h.time as UTCTimestamp, value: h.value })));
    candle.current?.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    chartRef.current?.timeScale().fitContent();
  }, [history, candles, variant, lineColor, falling]);

  return (
    <div className="chart-wrap">
      {variant === "candles" && (
        <div className="chart-tools">
          <div className="seg">
            {(Object.keys(INTERVALS) as Interval[]).map((k) => (
              <button key={k} className={interval === k ? "on" : ""} onClick={() => setIntervalKey(k)}>{k}</button>
            ))}
          </div>
          <span className="muted small">{history.length} ticks · NVDA indicative (xstocks.fi)</span>
        </div>
      )}
      <div className="chart-box">
        <div ref={el} className="chart" />
        {hover && variant === "line" && (
          <div className="chart-tip" style={{ left: Math.min(Math.max(hover.x + 14, 4), (el.current?.clientWidth ?? 400) - 130), top: Math.max(hover.y - 56, 4) }}>
            <b>${hover.price.toFixed(2)}</b>
            <span>{new Date(hover.time * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
