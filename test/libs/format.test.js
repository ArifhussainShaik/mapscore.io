import { describe, it, expect } from "vitest";
import { formatRankDelta } from "@/libs/format";

describe("formatRankDelta", () => {
  it("treats a LOWER rank as an improvement (green, up arrow)", () => {
    const d = formatRankDelta(8, 5); // prev 8 → now 5
    expect(d.improved).toBe(true);
    expect(d.tone).toBe("success");
    expect(d.delta).toBe(3);
  });
  it("treats a HIGHER rank as a decline (red)", () => {
    const d = formatRankDelta(5, 9);
    expect(d.improved).toBe(false);
    expect(d.tone).toBe("error");
  });
  it("handles no previous data", () => {
    expect(formatRankDelta(null, 5).tone).toBe("neutral");
  });
});
