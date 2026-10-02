import { ImageResponse } from "next/og";

// Served at /opengraph-image — the preview card for WhatsApp/Twitter/Google.
export const runtime = "nodejs";
export const alt = "SEO Content Writer — Research, write, publish";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SEO Content Writer";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>{APP_NAME}</div>
        <div style={{ marginTop: 16, fontSize: 36, color: "#dbeafe" }}>
          Research, write, publish — in minutes
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 16, fontSize: 24, color: "#eff6ff" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "10px 24px", borderRadius: 999 }}>
            Real Google research
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "10px 24px", borderRadius: 999 }}>
            Meta + Schema
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "10px 24px", borderRadius: 999 }}>
            Word export
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
