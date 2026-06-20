import { describe, it, expect } from "vitest";
import { computeMetrics } from "@/libs/gridMetrics";

describe("computeMetrics", () => {
  it("computes arp, solv, found counts", () => {
    const points = [
      { lat: 0, lng: 0, rank: 1 },
      { lat: 0, lng: 0, rank: 3 },
      { lat: 0, lng: 0, rank: 8 },
      { lat: 0, lng: 0, rank: null }, // off-pack → 21
    ];
    const m = computeMetrics(points);
    expect(m.totalPoints).toBe(4);
    expect(m.foundCount).toBe(3);
    expect(m.solv).toBe(50); // 2 of 4 points are top-3
    expect(m.avgWhenFound).toBeCloseTo((1 + 3 + 8) / 3, 5);
    expect(m.arp).toBeCloseTo((1 + 3 + 8 + 21) / 4, 5);
  });

  it("handles an all-miss grid", () => {
    const m = computeMetrics([{ rank: null }, { rank: null }]);
    expect(m.foundCount).toBe(0);
    expect(m.solv).toBe(0);
    expect(m.avgWhenFound).toBeNull();
    expect(m.arp).toBe(21);
  });
});
