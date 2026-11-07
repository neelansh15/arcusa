import type { NextConfig } from "next";

// The browser only talks to this site; /ingest/* is proxied to the price service server-side,
// so the backend origin is never exposed to clients. Override with INGEST_ORIGIN (not NEXT_PUBLIC).
const INGEST_ORIGIN = process.env.INGEST_ORIGIN ?? "https://arcusa-api.superd.app";

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/ingest/:path*", destination: `${INGEST_ORIGIN}/:path*` }];
  },
};

export default config;
