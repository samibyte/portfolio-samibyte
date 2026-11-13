import { ImageResponse } from "next/og";
import { content } from "@/lib/content";

export const alt = `${content.name} — ${content.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050d1a",
          color: "#e0e8f0",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: "#ff9f43",
            }}
          />
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#b4c2d0",
            }}
          >
            {content.role}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.02 }}>
            {content.name}
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.4,
              color: "#b4c2d0",
              maxWidth: 940,
            }}
          >
            {content.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#b4c2d0",
          }}
        >
          <div>{content.location}</div>
          <div>{content.status}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
