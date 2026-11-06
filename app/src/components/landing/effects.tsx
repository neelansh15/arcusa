"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the landing page:
 * - quiet reveal-on-scroll for [data-reveal] elements
 * - hairline nav border once the page is scrolled
 * Skipped when the user prefers reduced motion.
 */
export function LandingEffects() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing");
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = root.querySelector<HTMLElement>(".lp-nav");
    const revealEls = root.querySelectorAll<HTMLElement>("[data-reveal]");

    let io: IntersectionObserver | undefined;
    if (!reduce && "IntersectionObserver" in window) {
      root.classList.add("lp-js");
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io?.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
      revealEls.forEach((el) => io?.observe(el));
    }

    const onScroll = () => nav?.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      root.classList.remove("lp-js");
    };
  }, []);

  return null;
}
