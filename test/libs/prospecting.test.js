import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Prospect from "@/models/Prospect";

vi.mock("@/libs/dataforseo-maps", () => ({
  getLocalPack: async () => [
    { placeId: "p1", name: "Bob's HVAC", rank: 4, reviewCount: 8, rating: 3.9, photoCount: 3, website: "" },
    { placeId: "p2", name: "Ace HVAC", rank: 1, reviewCount: 320, rating: 4.8, photoCount: 90, website: "https://ace.com" },
  ],
}));
vi.mock("@/libs/geocode", () => ({ geocodeArea: async () => ({ lat: 40, lng: -74 }) }));

let findProspects;
beforeEach(async () => {
  ({ findProspects } = await import("@/libs/prospecting"));
});

describe("findProspects", () => {
  it("scores candidates by opportunity and saves prospects (worst first)", async () => {
    const orgId = new mongoose.Types.ObjectId();
    const prospects = await findProspects({ orgId, keyword: "hvac", area: "Newark, NJ" });
    expect(prospects.length).toBe(2);
    expect(prospects[0].businessName).toBe("Bob's HVAC");
    expect(prospects[0].auditSnapshot.score).toBeLessThan(prospects[1].auditSnapshot.score);
    expect(await Prospect.countDocuments({ orgId })).toBe(2);
  });
});
