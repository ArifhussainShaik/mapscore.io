import { describe, it, expect } from "vitest";
import { rankBucket, rankColor, RANK_BUCKETS } from "@/libs/rankColor";

describe("rankColor", () => {
  it("buckets ranks correctly", () => {
    expect(rankBucket(2).fill).toBe("#1A9850");
    expect(rankBucket(5).fill).toBe("#A6D96A");
    expect(rankBucket(9).fill).toBe("#FEE08B");
    expect(rankBucket(13).fill).toBe("#FDAE61");
    expect(rankBucket(18).fill).toBe("#F46D43");
  });
  it("treats null/over-20 as not-found (darkest red)", () => {
    expect(rankColor(null)).toBe("#A50026");
    expect(rankColor(99)).toBe("#A50026");
  });
  it("exposes 5 in-pack legend buckets", () => {
    expect(RANK_BUCKETS).toHaveLength(5);
  });
});
