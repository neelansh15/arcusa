import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/sidebar";
import { PrevNext } from "@/components/docs/prev-next";
import "./docs.css";

export const metadata: Metadata = {
  title: { default: "Docs · arcusa", template: "%s · arcusa docs" },
  description: "How arcusa works: tokenized US equities settled in USDC on Arc. Testnet demo.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="docs">
      <header className="docs-top">
        <div className="docs-top-inner">
          <Link href="/" className="docs-logo">
            <i />
            arcusa
          </Link>
          <span className="docs-top-label">Docs</span>
          <nav className="docs-top-nav" aria-label="Site">
            <Link href="/">Home</Link>
            <Link href="/trade">Trade</Link>
            <Link href="/bridge">Bridge</Link>
            <Link href="/docs" className="on">
              Docs
            </Link>
          </nav>
        </div>
      </header>
      <div className="docs-body">
        <DocsSidebar />
        <main className="docs-main">
          <article className="docs-content">{children}</article>
          <PrevNext />
        </main>
      </div>
    </div>
  );
}
