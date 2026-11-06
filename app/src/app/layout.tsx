import type { Metadata } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./theme.css";
import "./globals.css";

const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// Runs before first paint: apply the saved theme (default dark). Storage can throw, so it is guarded.
const THEME_SCRIPT = `try{var t=localStorage.getItem("arcusa.theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){}`;

export const metadata: Metadata = {
  title: "arcusa: tokenized US stocks on Arc",
  description: "Tokenized US stocks from many chains, traded against USDC on Arc. Live demo on Arc testnet, no real money.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
