"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { neighbours } from "@/lib/docs-nav";

export function PrevNext() {
  const { prev, next } = neighbours(usePathname() ?? "");
  if (!prev && !next) return null;
  return (
    <nav className="docs-pn" aria-label="Previous and next pages">
      {prev ? (
        <Link href={prev.href} className="docs-pn-link prev">
          <span>Previous</span>
          <b>{prev.title}</b>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="docs-pn-link next">
          <span>Next</span>
          <b>{next.title}</b>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
