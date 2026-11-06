import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/sidebar";
import { Header } from "@/components/header";
import { PrevNext } from "@/components/docs/prev-next";
import "./docs.css";

export const metadata: Metadata = {
  title: { default: "Docs · arcusa", template: "%s · arcusa docs" },
  description: "How arcusa works: tokenized US equities settled in USDC on Arc. Testnet demo.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="docs">
      <div className="docs-top">
        <Header />
      </div>
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
