import { BaseError, ContractFunctionRevertedError } from "viem";
import { isRejection } from "./use-switch-to-arc";

export interface FriendlyError {
  title: string;
  text: string;
  /** "info" for things the user chose (cancelled), "warn" for limits they can fix, "err" for the rest. */
  tone: "info" | "warn" | "err";
}

/** Revert name, if viem could decode one (needs the error in the ABI) or the message carries it. */
function revertName(e: unknown): string | null {
  if (e instanceof BaseError) {
    const r = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (r instanceof ContractFunctionRevertedError && r.data?.errorName) return r.data.errorName;
  }
  const m = (e as { message?: string })?.message ?? "";
  const hit = m.match(/\b(TradeTooLarge|InventoryShort|ExposureExceeded|SessionClosed|StalePrice|NoPrice|EnforcedPause|SlippageExceeded|ZeroAmount)\b/);
  return hit ? hit[1] : null;
}

const BY_NAME: Record<string, FriendlyError> = {
  TradeTooLarge: { title: "Amount too large", text: "This is above the per-trade limit. Try a smaller amount.", tone: "warn" },
  InventoryShort: { title: "Not enough liquidity", text: "The market can't fill this size right now. Try a smaller amount.", tone: "warn" },
  ExposureExceeded: { title: "Not enough liquidity", text: "The market has reached its limit on this side for now. Try a smaller amount or come back later.", tone: "warn" },
  SessionClosed: { title: "Trading is closed", text: "This market isn't trading right now.", tone: "warn" },
  StalePrice: { title: "Price feed paused", text: "The price is out of date, so trading is paused. Try again shortly.", tone: "warn" },
  NoPrice: { title: "Price feed paused", text: "There is no price yet, so trading is paused. Try again shortly.", tone: "warn" },
  EnforcedPause: { title: "Trading is paused", text: "The market is paused right now.", tone: "warn" },
  SlippageExceeded: { title: "Price moved", text: "The price changed while you were trading. Try again.", tone: "warn" },
  ZeroAmount: { title: "Amount too small", text: "Enter a larger amount.", tone: "warn" },
};

/** Turn a quote or trade failure into a short, plain message. No liquidity or limit numbers are shown. */
export function friendlyMarketError(e: unknown): FriendlyError {
  if (isRejection(e)) return { title: "Cancelled", text: "You cancelled the request in your wallet.", tone: "info" };
  const name = revertName(e);
  if (name && BY_NAME[name]) return BY_NAME[name];
  const first = ((e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as Error)?.message ?? "").split("\n")[0].slice(0, 120);
  return { title: "Couldn't complete that", text: first || "Something went wrong. Try again.", tone: "err" };
}
