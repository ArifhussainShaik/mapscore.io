import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";

vi.mock("@/libs/geocode", () => ({ ensureLocationGeo: async () => ({ lat: 40, lng: -74 }) }));
vi.mock("@/libs/dataforseo-maps", () => ({
  scanGrid: async ({ points }) => points.map((p, i) => ({ ...p, rank: i === 0 ? 1 : null })),
}));

let runLocationScan;
beforeEach(async () => {
  ({ runLocationScan } = await import("@/libs/scanEngine"));
});

describe("runLocationScan", () => {
  it("creates one GridScan per keyword with metrics", async () => {
    const loc = await Location.create({
      orgId: new mongoose.Types.ObjectId(),
      businessName: "Joe",
      googlePlaceId: "ChIJ_joe",
      tracking: { gridSize: 3, radiusMiles: 5, keywords: ["plumber", "drain cleaning"], frequency: "weekly" },
    });

    const scans = await runLocationScan(loc);
    expect(scans).toHaveLength(2);

    const saved = await GridScan.find({ locationId: loc._id });
    expect(saved).toHaveLength(2);
    const first = saved.find((s) => s.keyword === "plumber");
    expect(first.points).toHaveLength(9); // 3x3
    expect(first.metrics.foundCount).toBe(1);
  });

  it("skips a location with no keywords", async () => {
    const loc = await Location.create({ orgId: new mongoose.Types.ObjectId(), businessName: "Empty" });
    const scans = await runLocationScan(loc);
    expect(scans).toHaveLength(0);
  });
});
