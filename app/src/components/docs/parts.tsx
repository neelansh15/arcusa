import type { ReactNode } from "react";
import type { AccountRow, ChainInfo, ContractRow, PlannedChain, TxRow } from "@/lib/docs-contracts";

export function PageHead({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: ReactNode }) {
  return (
    <header className="docs-head">
      {eyebrow && <div className="docs-eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {lead && <p className="docs-lead">{lead}</p>}
    </header>
  );
}

export function Callout({ kind = "note", title, children }: { kind?: "note" | "warn" | "roadmap"; title?: string; children: ReactNode }) {
  return (
    <aside className={`docs-callout ${kind}`}>
      {title && <b>{title}</b>}
      <div>{children}</div>
    </aside>
  );
}

export type Status = "live" | "testnet" | "roadmap" | "unverified";
const STATUS_TEXT: Record<Status, string> = {
  live: "Live",
  testnet: "Testnet",
  roadmap: "Roadmap",
  unverified: "Unverified",
};

export function Tag({ status }: { status: Status }) {
  return <span className={`docs-tag ${status}`}>{STATUS_TEXT[status]}</span>;
}

export function Short({ hash }: { hash: string }) {
  return <>{`${hash.slice(0, 10)}…${hash.slice(-8)}`}</>;
}

export function ContractTable({ chain, rows }: { chain: ChainInfo; rows: ContractRow[] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>
            <th>Contract</th>
            <th>Address</th>
            <th>Purpose</th>
            <th>Deploy tx</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                <b>{r.name}</b>
                <div className="docs-sub">{r.owner === "arcusa" ? "Deployed by arcusa" : r.owner === "wrapper" ? "Created by the CCTPx wrapper flow" : `Third party: ${r.owner}`}</div>
              </td>
              <td>
                <a className="docs-addr" href={`${chain.explorer}/address/${r.address}`} target="_blank" rel="noreferrer">
                  {r.address}
                </a>
              </td>
              <td>
                {r.purpose}
                {r.note && <div className="docs-sub">{r.note}</div>}
                <div className="docs-sub">Checked against: {r.source}</div>
              </td>
              <td>
                {r.deployTx ? (
                  <a href={`${chain.explorer}/tx/${r.deployTx}`} target="_blank" rel="noreferrer" className="docs-addr">
                    <Short hash={r.deployTx} />
                  </a>
                ) : (
                  <span className="docs-sub">Not recorded</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccountTable({ chain, rows }: { chain: ChainInfo; rows: AccountRow[] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Address</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                <b>{r.name}</b>
              </td>
              <td>
                <a className="docs-addr" href={`${chain.explorer}/address/${r.address}`} target="_blank" rel="noreferrer">
                  {r.address}
                </a>
              </td>
              <td>
                {r.purpose}
                <div className="docs-sub">Checked against: {r.source}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TxTable({ chain, rows }: { chain: ChainInfo; rows: TxRow[] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Hash</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.hash}>
              <td>{r.label}</td>
              <td>
                <a className="docs-addr" href={`${chain.explorer}/tx/${r.hash}`} target="_blank" rel="noreferrer">
                  <Short hash={r.hash} />
                </a>
              </td>
              <td className="docs-sub">{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlannedTable({ rows }: { rows: PlannedChain[] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>
            <th>Chain</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                <b>{r.name}</b>
              </td>
              <td>
                <Tag status="roadmap" /> <span className="docs-sub">{r.status}</span>
              </td>
              <td>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
