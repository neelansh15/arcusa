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
  title: "arcusa: Bringing US stocks to Arc",
  description: "Buy a mock NVIDIA stock token with USDC, settled on Arc. A simple testnet demo: no real money, no real shares.",
  openGraph: {
    title: "arcusa: Bringing US stocks to Arc",
    description: "A simple testnet demo: buy a mock NVIDIA stock token with USDC, settled on Arc. No real money.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "arcusa: Bringing US stocks to Arc", description: "A simple testnet demo on Arc. No real money, no real shares." },
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
