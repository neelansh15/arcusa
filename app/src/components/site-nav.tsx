"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Primary site navigation. Shared by the app header, the docs header and the landing nav so the items, labels and order never drift. */
export const SITE_NAV = [
  { href: "/", label: "Home" },
  { href: "/trade", label: "Trade" },
  { href: "/bridge", label: "Bridge" },
  { href: "/docs", label: "Docs" },
] as const;

export function SiteNav({ className }: { className?: string }) {
  const path = (usePathname() ?? "/").replace(/\/$/, "") || "/";
  return (
    <nav className={className} aria-label="Site">
      {SITE_NAV.map((l) => {
        const on = l.href === "/" ? path === "/" : path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
