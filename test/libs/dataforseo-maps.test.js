import { describe, it, expect, beforeEach } from "vitest";
import { scanGrid } from "@/libs/dataforseo-maps";

describe("scanGrid (not configured → mock)", () => {
  beforeEach(() => {
    delete process.env.DATAFORSEO_LOGIN;
    delete process.env.DATAFORSEO_PASSWORD;
  });

  it("returns a rank entry per input point", async () => {
    const points = [
      { lat: 40, lng: -74 },
      { lat: 40.1, lng: -74 },
      { lat: 40.2, lng: -74 },
    ];
    const result = await scanGrid({ keyword: "plumber", points, targetPlaceId: "ChIJ_x" });
    expect(result).toHaveLength(3);
    result.forEach((p) => {
      expect(p).toHaveProperty("lat");
      expect(p).toHaveProperty("lng");
      expect(p).toHaveProperty("rank"); // number or null
    });
  });
});
