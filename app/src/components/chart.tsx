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

/** Chart canvases cannot read CSS variables, so resolve the --chart-* tokens to strings. */
function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    line: v("--chart-line"), up: v("--chart-up"), down: v("--chart-down"), text: v("--chart-text"), grid: v("--chart-grid"),
    cross: v("--chart-cross"), border: v("--chart-border"),
    areaTop: v("--chart-area-top"), areaBottom: v("--chart-area-bottom"), areaDownTop: v("--chart-area-down-top"), areaDownBottom: v("--chart-area-down-bottom"),
  };
}
type ChartTheme = ReturnType<typeof readTheme>;

interface Hover {
  x: number;
  y: number;
  price: number;
  time: number;
}

/** Simple: a smooth area line with a hover tooltip. Pro: candlesticks with an interval picker. Colours come from the theme tokens. */
export function PriceChart({ history, variant = "line" }: { history: PricePoint[]; variant?: "line" | "candles" }) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const area = useRef<ISeriesApi<"Area"> | null>(null);
  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [interval, setIntervalKey] = useState<Interval>("1m");
  const [hover, setHover] = useState<Hover | null>(null);
  const [theme, setTheme] = useState<ChartTheme | null>(null);
  const candles = useMemo(() => toCandles(history, interval), [history, interval]);
  const falling = history.length > 1 && history[history.length - 1].value < history[0].value;

  // Read the tokens once on mount and again whenever <html data-theme> changes.
  useEffect(() => {
    setTheme(readTheme());
    const mo = new MutationObserver(() => setTheme(readTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!el.current) return;
    const t = readTheme();
    const candlesMode = variant === "candles";
    const chart = createChart(el.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: t.text, fontSize: 12, fontFamily: "inherit", attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: t.grid } },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { style: 2, color: t.cross, labelVisible: false },
        horzLine: { visible: candlesMode, labelVisible: candlesMode },
      },
      leftPriceScale: { visible: true, borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
      rightPriceScale: { visible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      handleScroll: candlesMode,
      handleScale: candlesMode,
    });
    chartRef.current = chart;
    if (candlesMode) {
      candle.current = chart.addSeries(CandlestickSeries, {
        upColor: t.up, downColor: t.down, borderUpColor: t.up, borderDownColor: t.down, wickUpColor: t.up, wickDownColor: t.down,
        priceScaleId: "left", priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      });
    } else {
      area.current = chart.addSeries(AreaSeries, {
        lineColor: t.line, topColor: t.areaTop, bottomColor: t.areaBottom, lineWidth: 3, lineType: LineType.Curved,
        crosshairMarkerRadius: 6, crosshairMarkerBorderColor: t.line, crosshairMarkerBackgroundColor: "transparent", crosshairMarkerBorderWidth: 3,
        priceScaleId: "left", priceLineVisible: false, lastValueVisible: false,
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

  // Re-apply colours when the theme (or rising/falling state) changes, without rebuilding the chart.
  useEffect(() => {
    if (!theme) return;
    chartRef.current?.applyOptions({
      layout: { textColor: theme.text },
      grid: { horzLines: { color: theme.grid } },
      crosshair: { vertLine: { color: theme.cross } },
    });
    const line = falling ? theme.down : theme.line;
    area.current?.applyOptions({
      lineColor: line, crosshairMarkerBorderColor: line,
      topColor: falling ? theme.areaDownTop : theme.areaTop, bottomColor: falling ? theme.areaDownBottom : theme.areaBottom,
    });
    candle.current?.applyOptions({ upColor: theme.up, downColor: theme.down, borderUpColor: theme.up, borderDownColor: theme.down, wickUpColor: theme.up, wickDownColor: theme.down });
  }, [theme, falling, variant]);

  useEffect(() => {
    area.current?.setData(history.map((h) => ({ time: h.time as UTCTimestamp, value: h.value })));
    candle.current?.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    chartRef.current?.timeScale().fitContent();
  }, [history, candles, variant]);

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
