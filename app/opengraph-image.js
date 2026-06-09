import { ImageResponse } from "next/og";

// Treat the OG image like a YouTube thumbnail (rule 5): one bold claim,
// one strong visual, readable at a glance in a crowded feed.
// Edit the headline / badge here — it's just code.
export const alt = "Is your Google profile losing you customers? Free 50+ factor audit.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand colors — three only: beige bg, slate ink, blue accent (+ red for the bad score).
const BEIGE = "#F4F2EB";
const INK = "#0f172a";
const BLUE = "#2563eb";
const RED = "#dc2626";

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
          backgroundColor: BEIGE,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              backgroundColor: BLUE,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            ls
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: INK }}>LocalScore</div>
        </div>

        {/* Claim + visual */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: INK, lineHeight: 1.05 }}>
              Is your Google
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, color: INK, lineHeight: 1.05 }}>
              profile losing you
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ fontSize: 72, fontWeight: 800, color: RED, lineHeight: 1.05 }}>
                customers?
              </div>
            </div>
            <div style={{ marginTop: 28, fontSize: 30, color: "#475569" }}>
              Free audit of 50+ ranking factors. No signup.
            </div>
          </div>

          {/* Failing-grade badge = the thumbnail hook */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 230,
                height: 230,
                borderRadius: 9999,
                border: `16px solid ${RED}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: RED,
                fontSize: 140,
                fontWeight: 800,
                backgroundColor: "white",
              }}
            >
              D
            </div>
            <div style={{ marginTop: 18, fontSize: 22, fontWeight: 700, color: "#475569" }}>
              Your GBP score?
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 26, color: "#475569" }}>
            Reviews · Photos · Hours · Competitors
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: BLUE }}>localscore.io</div>
        </div>
      </div>
    ),
    size
  );
}
