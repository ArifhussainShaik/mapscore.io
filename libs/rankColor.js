// Colorblind-safe diverging ramp (ColorBrewer RdYlGn-derived). Order is monotonic in
// lightness so it survives deuteranopia/protanopia + grayscale. ALWAYS pair with the
// printed rank number (never color alone) — see DESIGN-GUIDELINES.md.
export const RANK_BUCKETS = [
  { min: 1, max: 3, fill: "#1A9850", text: "#FFFFFF", label: "1–3 (Top)" },
  { min: 4, max: 6, fill: "#A6D96A", text: "#1A1A1A", label: "4–6" },
  { min: 7, max: 10, fill: "#FEE08B", text: "#1A1A1A", label: "7–10" },
  { min: 11, max: 15, fill: "#FDAE61", text: "#1A1A1A", label: "11–15" },
  { min: 16, max: 20, fill: "#F46D43", text: "#FFFFFF", label: "16–20" },
];
export const NOT_FOUND = { fill: "#A50026", text: "#FFFFFF", label: "Not found" };

export function rankBucket(rank) {
  if (rank == null || rank > 20) return NOT_FOUND;
  return RANK_BUCKETS.find((b) => rank >= b.min && rank <= b.max) || NOT_FOUND;
}
export function rankColor(rank) {
  return rankBucket(rank).fill;
}
