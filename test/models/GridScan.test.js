import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import GridScan from "@/models/GridScan";

describe("GridScan model", () => {
  it("persists points and metrics", async () => {
    const scan = await GridScan.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      keyword: "plumber near me",
      gridSize: 3,
      radiusMiles: 5,
      points: [{ lat: 40, lng: -74, rank: 2 }, { lat: 40.1, lng: -74, rank: null }],
      metrics: { arp: 11.5, solv: 50, foundCount: 1, totalPoints: 2, avgWhenFound: 2 },
    });
    expect(scan.keyword).toBe("plumber near me");
    expect(scan.points).toHaveLength(2);
    expect(scan.metrics.solv).toBe(50);
    expect(scan.createdAt).toBeInstanceOf(Date);
  });

  it("requires locationId and keyword", async () => {
    await expect(GridScan.create({ keyword: "x" })).rejects.toThrow();
    await expect(GridScan.create({ locationId: new mongoose.Types.ObjectId() })).rejects.toThrow();
  });
});
