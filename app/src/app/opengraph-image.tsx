import { ImageResponse } from "next/og";

export const alt = "arcusa: Bringing US stocks to Arc";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0d0f13", color: "#f2f4f7", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#c3dc4e", display: "flex" }} />
          arcusa
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 100, fontWeight: 800, lineHeight: 1.02, letterSpacing: -4, marginTop: 40 }}>
          <span>Bringing US stocks</span>
          <span style={{ color: "#c3dc4e" }}>to Arc</span>
        </div>
        <div style={{ marginTop: 40, fontSize: 30, color: "#8b93a1" }}>Testnet demo. Not a security, no real shares, no real value.</div>
      </div>
    ),
    size,
  );
}
