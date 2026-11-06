"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SiteNav } from "./site-nav";

/** Hamburger menu for narrow screens: the site links plus anything the page adds (status, anchors). Closes on navigation, Escape or an outside tap. */
export function NavMenu({ children, className = "" }: { children?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);
  return (
    <>
      <button type="button" className={`icon-btn menu-btn ${className}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <>
          <div className="menu-scrim" onClick={() => setOpen(false)} />
          <div id="site-menu" className="menu-panel" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
            <SiteNav className="menu-links" />
            {children}
          </div>
        </>
      )}
    </>
  );
}
