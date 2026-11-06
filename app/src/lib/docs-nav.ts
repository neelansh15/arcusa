export interface DocLink {
  title: string;
  href: string;
  summary: string;
}

export interface DocSection {
  title: string;
  links: DocLink[];
}

export const DOCS_NAV: DocSection[] = [
  {
    title: "Start",
    links: [
      { title: "Overview", href: "/docs", summary: "What arcusa is, and what is live today." },
      { title: "How it works", href: "/docs/how-it-works", summary: "Trade flow, pricing, spreads and settlement." },
      { title: "Architecture", href: "/docs/architecture", summary: "Contracts, oracle, relayer, price service, app and bridge." },
    ],
  },
  {
    title: "Contracts",
    links: [
      { title: "Contract index", href: "/docs/contracts", summary: "All chains, deployed and planned." },
      { title: "Arc testnet", href: "/docs/contracts/arc-testnet", summary: "Addresses on Arc testnet (5042002)." },
      { title: "Ethereum Sepolia", href: "/docs/contracts/ethereum-sepolia", summary: "Addresses on Ethereum Sepolia (11155111)." },
    ],
  },
  {
    title: "Guides",
    links: [
      { title: "Bridge", href: "/docs/bridge", summary: "Moving inventory between Sepolia and Arc." },
      { title: "Oracle and price", href: "/docs/oracle", summary: "Price service, relayer, staleness and sessions." },
    ],
  },
  {
    title: "Reference",
    links: [
      { title: "Risks", href: "/docs/risks", summary: "What can go wrong, and what is not audited." },
      { title: "FAQ", href: "/docs/faq", summary: "Short answers." },
    ],
  },
];

export const DOCS_FLAT: DocLink[] = DOCS_NAV.flatMap((s) => s.links);

export function neighbours(path: string): { prev: DocLink | null; next: DocLink | null } {
  const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
  const i = DOCS_FLAT.findIndex((l) => l.href === clean);
  if (i === -1) return { prev: null, next: null };
  return { prev: DOCS_FLAT[i - 1] ?? null, next: DOCS_FLAT[i + 1] ?? null };
}
