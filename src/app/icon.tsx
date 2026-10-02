import { ImageResponse } from "next/og";

// Served at /icon + /apple-icon — the small logo in browser tabs and Google results.
export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          borderRadius: 14,
          color: "white",
          fontSize: 40,
          fontWeight: 800,
          fontFamily: "Arial, sans-serif",
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
