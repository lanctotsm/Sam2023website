import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site-metadata";

export function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "90px", background: "#f7f0e4", color: "#480903",
        borderBottom: "18px solid #a66343"
      }}>
        <div style={{ fontSize: 24, letterSpacing: 4, marginBottom: 32 }}>SAMLANCTOT.COM</div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.1 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 36, marginTop: 28 }}>Software Engineer &amp; Photographer</div>
        <div style={{ fontSize: 24, marginTop: 48, color: "#6a6352" }}>Silver Spring, Maryland</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
