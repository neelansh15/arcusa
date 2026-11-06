"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the landing page (ADR 0021):
 * - reveal-on-scroll, fail-safe: content is visible by default; it is hidden only after the observer proves it works,
 *   anything already in view is revealed at once, and a timeout reveals the rest
 * - `data-live` on animated blocks so looping CSS pauses offscreen and when the tab is hidden
 * - cursor-follow glow on bento tiles (fine pointers only)
 * - hairline nav border once scrolled
 * Reduced motion: nothing is hidden, nothing loops.
 */
export function LandingEffects() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing");
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = root.querySelector<HTMLElement>(".lp-nav");
    const cleanups: Array<() => void> = [];

    const onScroll = () => nav?.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    const revealEls = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!reduce && "IntersectionObserver" in window) {
      const reveal = (el: Element) => el.classList.add("is-in");
      // Reveal what is already on screen immediately.
      revealEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
      });
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              reveal(e.target);
              io.unobserve(e.target);
            }
          }
          // Only now, with proof the observer fires, is it safe to hide un-revealed content.
          root.classList.add("lp-js");
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
      );
      revealEls.forEach((el) => !el.classList.contains("is-in") && io.observe(el));
      const safety = window.setTimeout(() => revealEls.forEach(reveal), 2500);
      cleanups.push(() => {
        io.disconnect();
        clearTimeout(safety);
        root.classList.remove("lp-js");
      });
    } else {
      revealEls.forEach((el) => el.classList.add("is-in"));
    }

    // Pause looping animations offscreen and when the tab is hidden.
    const live = Array.from(root.querySelectorAll<HTMLElement>("[data-live-root]"));
    const visible = new Map<Element, boolean>();
    const apply = () => live.forEach((el) => el.setAttribute("data-live", String(!document.hidden && visible.get(el) !== false)));
    if (!reduce && "IntersectionObserver" in window) {
      const lio = new IntersectionObserver((entries) => {
        entries.forEach((e) => visible.set(e.target, e.isIntersecting));
        apply();
      });
      live.forEach((el) => lio.observe(el));
      document.addEventListener("visibilitychange", apply);
      cleanups.push(() => {
        lio.disconnect();
        document.removeEventListener("visibilitychange", apply);
      });
    }

    // Cursor-follow glow: one handler on the grid sets two CSS variables on the hovered tile.
    const grid = root.querySelector<HTMLElement>(".lp-bento");
    if (grid && !reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const move = (e: PointerEvent) => {
        const tile = (e.target as HTMLElement).closest<HTMLElement>(".lp-tile");
        if (!tile) return;
        const r = tile.getBoundingClientRect();
        tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
        tile.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      grid.addEventListener("pointermove", move);
      cleanups.push(() => grid.removeEventListener("pointermove", move));
    }

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}
