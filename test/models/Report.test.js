import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Report from "@/models/Report";

describe("Report model", () => {
  it("creates a report with an auto share token", async () => {
    const r = await Report.create({
      orgId: new mongoose.Types.ObjectId(),
      locationId: new mongoose.Types.ObjectId(),
      period: "2026-06",
      branding: { agencyName: "Acme", logoUrl: "", primaryColor: "#2563eb" },
      snapshot: { score: 82, grade: "B", keywords: [{ keyword: "plumber", arp: 5.2, solv: 60, arpDelta: -1.1 }], gaps: [] },
    });
    expect(r.shareToken).toBeTruthy();
    expect(r.shareToken.length).toBeGreaterThanOrEqual(16);
    expect(r.snapshot.score).toBe(82);
  });

  it("requires orgId, locationId, period", async () => {
    await expect(Report.create({ period: "2026-06" })).rejects.toThrow();
  });
});
