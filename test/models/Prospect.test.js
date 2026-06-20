import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Prospect from "@/models/Prospect";

describe("Prospect model", () => {
  it("creates a prospect with default status", async () => {
    const p = await Prospect.create({
      orgId: new mongoose.Types.ObjectId(),
      placeId: "ChIJ_p",
      businessName: "Bob's HVAC",
      auditSnapshot: { score: 42, grade: "D", topGaps: ["No services listed"] },
      contact: { email: "bob@example.com" },
    });
    expect(p.outreachStatus).toBe("new");
    expect(p.auditSnapshot.score).toBe(42);
  });

  it("requires orgId and businessName", async () => {
    await expect(Prospect.create({ placeId: "x" })).rejects.toThrow();
  });
});
