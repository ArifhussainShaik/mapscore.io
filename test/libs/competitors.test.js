import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";

vi.mock("@/libs/geocode", () => ({ ensureLocationGeo: async () => ({ lat: 40, lng: -74 }) }));
vi.mock("@/libs/dataforseo-maps", () => ({
  getLocalPack: async () => [
    { placeId: "c1", name: "Ace", rank: 1, reviewCount: 300, rating: 4.8, photoCount: 70, category: "Plumber", website: "https://ace.com" },
  ],
}));
vi.mock("@/libs/website-checker", () => ({
  checkWebsite: async () => ({ https: true, loads: true, mobile: true, pagespeed: 88 }),
}));

let captureCompetitors;
beforeEach(async () => {
  ({ captureCompetitors } = await import("@/libs/competitors"));
});

describe("captureCompetitors", () => {
  it("captures competitors with website signals and persists a snapshot", async () => {
    const loc = await Location.create({ orgId: new mongoose.Types.ObjectId(), businessName: "Joe", googlePlaceId: "ChIJ_joe" });
    const snap = await captureCompetitors(loc, "plumber");
    expect(snap.competitors).toHaveLength(1);
    expect(snap.competitors[0].websiteSignals.pagespeed).toBe(88);
    const saved = await CompetitorSnapshot.findById(snap._id);
    expect(saved).not.toBeNull();
  });
});
