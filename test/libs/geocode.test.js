import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

const geocodeMock = vi.fn();
vi.mock("@/libs/google-places", () => ({ geocodePlaceId: (...a) => geocodeMock(...a) }));

let ensureLocationGeo;
beforeEach(async () => {
  ({ ensureLocationGeo } = await import("@/libs/geocode"));
  geocodeMock.mockReset();
});

describe("ensureLocationGeo", () => {
  it("returns existing coords without geocoding", async () => {
    const loc = await Location.create({
      orgId: new mongoose.Types.ObjectId(),
      businessName: "A",
      geo: { lat: 40, lng: -74 },
    });
    const geo = await ensureLocationGeo(loc);
    expect(geo).toEqual({ lat: 40, lng: -74 });
    expect(geocodeMock).not.toHaveBeenCalled();
  });

  it("geocodes by place id and persists", async () => {
    geocodeMock.mockResolvedValue({ lat: 34.05, lng: -118.24 });
    const loc = await Location.create({
      orgId: new mongoose.Types.ObjectId(),
      businessName: "B",
      googlePlaceId: "ChIJ_la",
    });
    const geo = await ensureLocationGeo(loc);
    expect(geo.lat).toBeCloseTo(34.05);
    const reloaded = await Location.findById(loc._id);
    expect(reloaded.geo.lat).toBeCloseTo(34.05);
  });
});
