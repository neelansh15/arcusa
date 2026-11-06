"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Mobile bottom sheet. Drag the handle area down to dismiss; tap the backdrop, press Esc or use the close button too. */
export function BottomSheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const start = useRef<{ y: number; t: number } | null>(null);
  const sheetEl = useRef<HTMLDivElement>(null);

  function close() {
    setLeaving(true);
    setTimeout(onClose, 180);
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulling down while the content is scrolled to the top drags the sheet instead of scrolling it (touch only).
  useEffect(() => {
    const el = sheetEl.current;
    if (!el) return;
    let y0 = 0, t0 = 0, base: number | null = null, dist = 0;
    const ts = (e: TouchEvent) => { y0 = e.touches[0].clientY; t0 = performance.now(); base = null; dist = 0; };
    const tm = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      if (base === null) {
        if (el.scrollTop <= 0 && y - y0 > 4) { base = y; t0 = performance.now(); setDragging(true); } else return;
      }
      e.preventDefault();
      dist = Math.max(0, y - base);
      setDy(dist);
    };
    const te = () => {
      if (base === null) return;
      const v = dist / Math.max(1, performance.now() - t0);
      base = null;
      setDragging(false);
      if (dist > 110 || (v > 0.6 && dist > 30)) close();
      else setDy(0);
    };
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te);
    el.addEventListener("touchcancel", te);
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
      el.removeEventListener("touchcancel", te);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function down(e: React.PointerEvent) {
    start.current = { y: e.clientY, t: performance.now() };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!start.current) return;
    setDy(Math.max(0, e.clientY - start.current.y));
  }
  function up(e: React.PointerEvent) {
    if (!start.current) return;
    const dist = Math.max(0, e.clientY - start.current.y);
    const v = dist / Math.max(1, performance.now() - start.current.t); // px per ms
    start.current = null;
    setDragging(false);
    if (dist > 110 || (v > 0.6 && dist > 30)) close();
    else setDy(0);
  }

  const offset = leaving ? "100%" : `${dy}px`;
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={label}>
      <div className="sheet-bg" style={{ opacity: leaving ? 0 : Math.max(0.2, 1 - dy / 400), transition: dragging ? "none" : "opacity .18s" }} onClick={close} />
      <div className="sheet" ref={sheetEl} style={{ transform: `translateY(${offset})`, transition: dragging ? "none" : "transform .18s ease-out", animation: dy || leaving ? "none" : undefined }}>
        <div className="sheet-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <span />
          <button aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={close}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
