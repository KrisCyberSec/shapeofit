import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f5f2ec",
          color: "#1a1814",
          padding: "64px",
          fontFamily: "Georgia"
        }}
      >
        <div
          style={{
            borderTop: "6px solid #1a1814",
            display: "flex",
            flexDirection: "column",
            paddingTop: "28px"
          }}
        >
          <div
            style={{
              color: "#c0392b",
              fontSize: 24,
              fontFamily: "monospace",
              letterSpacing: 5,
              textTransform: "uppercase"
            }}
          >
            ChartQuery
          </div>
          <div style={{ fontSize: 92, lineHeight: 0.95, marginTop: 28 }}>
            See what the data means.
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, fontFamily: "Arial", fontSize: 30, color: "#4a4640" }}>
          <div>Ask a question.</div>
          <div>See the chart.</div>
          <div>Trust the source.</div>
        </div>
      </div>
    ),
    size
  );
}
