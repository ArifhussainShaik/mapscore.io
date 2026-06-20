import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";

describe("CompetitorSnapshot model", () => {
  it("stores competitors with signals", async () => {
    const snap = await CompetitorSnapshot.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      keyword: "plumber near me",
      competitors: [
        { placeId: "c1", name: "Ace Plumbing", rank: 1, reviewCount: 320, rating: 4.8, photoCount: 80, category: "Plumber", website: "https://ace.com" },
      ],
    });
    expect(snap.competitors).toHaveLength(1);
    expect(snap.competitors[0].reviewCount).toBe(320);
  });

  it("requires locationId and keyword", async () => {
    await expect(CompetitorSnapshot.create({ keyword: "x" })).rejects.toThrow();
  });
});
