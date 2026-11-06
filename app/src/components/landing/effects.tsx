"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the landing page:
 * - reveal-on-scroll for [data-reveal] elements (IntersectionObserver)
 * - light parallax for [data-parallax] elements (rAF-throttled scroll)
 * - solid nav background once the page is scrolled
 * Everything is skipped when the user prefers reduced motion.
 */
export function LandingEffects() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing");
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = root.querySelector<HTMLElement>(".lp-nav");
    const revealEls = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const parallaxEls = root.querySelectorAll<HTMLElement>("[data-parallax]");

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

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      nav?.classList.toggle("is-scrolled", y > 12);
      if (reduce) return;
      parallaxEls.forEach((el) => {
        const speed = Number(el.dataset.parallax) || 0.1;
        el.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("lp-js");
    };
  }, []);

  return null;
}
