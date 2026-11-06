"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_NAV } from "@/lib/docs-nav";

export function DocsSidebar() {
  const path = (usePathname() ?? "").replace(/\/$/, "") || "/";
  return (
    <nav className="docs-side" aria-label="Documentation">
      {DOCS_NAV.map((section) => (
        <div key={section.title} className="docs-side-group">
          <div className="docs-side-title">{section.title}</div>
          <ul>
            {section.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={path === l.href ? "on" : ""} aria-current={path === l.href ? "page" : undefined}>
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
