import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

describe("Location model", () => {
  it("creates a location with default tracking config", async () => {
    const loc = await Location.create({
      orgId: new mongoose.Types.ObjectId(),
      businessName: "Joe's Plumbing",
      googlePlaceId: "ChIJ_test",
    });
    expect(loc.managed).toBe(false);
    expect(loc.status).toBe("active");
    expect(loc.tracking.gridSize).toBe(7);
    expect(loc.tracking.radiusMiles).toBe(5);
    expect(loc.tracking.frequency).toBe("weekly");
    expect(loc.tracking.keywords).toEqual([]);
  });

  it("requires orgId and businessName", async () => {
    await expect(Location.create({ businessName: "No Org" })).rejects.toThrow();
    await expect(
      Location.create({ orgId: new mongoose.Types.ObjectId() })
    ).rejects.toThrow();
  });
});
