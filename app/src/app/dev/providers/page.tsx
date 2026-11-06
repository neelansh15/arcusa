import { notFound } from "next/navigation";
import { ProviderHarness } from "./harness";

export const metadata = { title: "Provider selector (dev)" };

/** Development-only page: renders the provider selector from fixtures in every state (ADR 0026). 404 in production. */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ProviderHarness />;
}
