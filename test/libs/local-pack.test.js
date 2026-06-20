import { describe, it, expect, beforeEach } from "vitest";
import { getLocalPack } from "@/libs/dataforseo-maps";

describe("getLocalPack (not configured → mock)", () => {
  beforeEach(() => {
    delete process.env.DATAFORSEO_LOGIN;
    delete process.env.DATAFORSEO_PASSWORD;
  });

  it("returns a list of listings with signals", async () => {
    const list = await getLocalPack({ keyword: "plumber", lat: 40, lng: -74, limit: 3 });
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("placeId");
    expect(list[0]).toHaveProperty("rank");
    expect(list[0]).toHaveProperty("reviewCount");
  });
});
